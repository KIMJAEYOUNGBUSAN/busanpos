const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3100);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@smsapi.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";
const MASTER_KEY = process.env.MASTER_KEY || "dev-only-change-this-master-key";
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "smsapi-db.json");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const PUBLIC_ROUTES = new Set(["/admin/login", "/health"]);

function now() {
  return new Date().toISOString();
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    writeDb({
      providerSettings: {
        solapi: {
          enabled: false,
          testMode: true,
          maskedKey: "",
          defaultFrom: "",
          encryptedConfig: null,
          updatedAt: null
        },
        resend: {
          enabled: false,
          testMode: true,
          maskedKey: "",
          defaultFrom: "",
          defaultFromName: "",
          replyTo: "",
          encryptedConfig: null,
          updatedAt: null
        }
      },
      clients: [],
      messages: [],
      auditLogs: [],
      sessions: []
    });
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function keyBytes() {
  return crypto.createHash("sha256").update(MASTER_KEY).digest();
}

function encryptJson(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    body: body.toString("base64")
  };
}

function decryptJson(payload) {
  if (!payload) return {};
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const body = Buffer.concat([
    decipher.update(Buffer.from(payload.body, "base64")),
    decipher.final()
  ]);
  return JSON.parse(body.toString("utf8"));
}

function maskSecret(value) {
  if (!value) return "";
  const clean = String(value);
  if (clean.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}

function maskPhone(value) {
  const text = String(value || "");
  if (text.length < 8) return maskSecret(text);
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function maskEmail(value) {
  const text = String(value || "");
  const [name, domain] = text.split("@");
  if (!domain) return maskSecret(text);
  return `${name.slice(0, 2)}***@${domain}`;
}

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function createApiKey() {
  return `smsapi_${crypto.randomBytes(24).toString("base64url")}`;
}

function createId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}_${stamp}_${crypto.randomBytes(4).toString("hex")}`;
}

function json(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...(res.corsHeaders || {}),
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin) return {};
  if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin"
    };
  }
  return {};
}

function html(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { ok: false, error: { code: "NOT_FOUND", message: "요청한 주소를 찾을 수 없습니다." } });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(header.split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("REQUEST_TOO_LARGE"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
  });
}

function cleanSessions(db) {
  const cutoff = Date.now() - 1000 * 60 * 60 * 12;
  db.sessions = db.sessions.filter((session) => new Date(session.createdAt).getTime() > cutoff);
}

function requireAdmin(req, res) {
  const token = parseCookies(req).smsapi_session;
  if (!token) {
    json(res, 401, { ok: false, error: { code: "ADMIN_AUTH_REQUIRED", message: "관리자 로그인이 필요합니다." } });
    return null;
  }
  const db = readDb();
  cleanSessions(db);
  const session = db.sessions.find((item) => item.token === token);
  writeDb(db);
  if (!session) {
    json(res, 401, { ok: false, error: { code: "ADMIN_AUTH_REQUIRED", message: "관리자 로그인이 필요합니다." } });
    return null;
  }
  return { db, session };
}

function requireClient(req, res) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    json(res, 401, { ok: false, error: { code: "INVALID_API_KEY", message: "자체 API Key가 필요합니다." } });
    return null;
  }
  const db = readDb();
  const apiKeyHash = hashApiKey(match[1]);
  const client = db.clients.find((item) => item.apiKeyHash === apiKeyHash && item.enabled);
  if (!client) {
    json(res, 401, { ok: false, error: { code: "INVALID_API_KEY", message: "유효하지 않은 API Key입니다." } });
    return null;
  }
  return { db, client };
}

function publicClient(client) {
  return {
    id: client.id,
    name: client.name,
    allowedChannels: client.allowedChannels,
    allowedSenders: client.allowedSenders,
    dailyLimit: client.dailyLimit,
    enabled: client.enabled,
    createdAt: client.createdAt
  };
}

function audit(db, type, details) {
  db.auditLogs.unshift({
    id: createId("audit"),
    type,
    details,
    createdAt: now()
  });
  db.auditLogs = db.auditLogs.slice(0, 300);
}

function dailyCount(db, clientId, channel) {
  const today = new Date().toISOString().slice(0, 10);
  return db.messages.filter((message) =>
    message.clientId === clientId &&
    message.channel === channel &&
    String(message.requestedAt || "").slice(0, 10) === today
  ).length;
}

function validateSender(client, channel, sender) {
  if (!sender || !client.allowedSenders.length) return true;
  if (channel === "email") {
    const domain = String(sender).split("@")[1];
    return client.allowedSenders.includes(sender) || client.allowedSenders.includes(`*@${domain}`);
  }
  return client.allowedSenders.includes(sender);
}

function providerPublic(settings) {
  return {
    enabled: settings.enabled,
    testMode: settings.testMode,
    maskedKey: settings.maskedKey,
    defaultFrom: settings.defaultFrom,
    defaultFromName: settings.defaultFromName,
    replyTo: settings.replyTo,
    updatedAt: settings.updatedAt
  };
}

function solapiAuth(apiKey, apiSecret) {
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function callSolapi(settings, payload) {
  const config = decryptJson(settings.encryptedConfig);
  if (settings.testMode || !settings.enabled) {
    return { providerMessageId: createId("solapi_test"), raw: { testMode: true } };
  }
  const from = payload.from || settings.defaultFrom;
  const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": solapiAuth(config.apiKey, config.apiSecret)
    },
    body: JSON.stringify({
      messages: [{
        to: payload.to,
        from,
        text: payload.text,
        type: payload.type || "SMS"
      }]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.errorMessage || data.message || "솔라피 발송 요청이 실패했습니다.";
    throw Object.assign(new Error(message), { code: "PROVIDER_ERROR", providerResponse: data });
  }
  return {
    providerMessageId: data.groupInfo?.groupId || data.groupId || createId("solapi"),
    raw: data
  };
}

async function callResend(settings, payload) {
  const config = decryptJson(settings.encryptedConfig);
  if (settings.testMode || !settings.enabled) {
    return { providerMessageId: createId("resend_test"), raw: { testMode: true } };
  }
  const fromEmail = payload.from || settings.defaultFrom;
  const from = settings.defaultFromName ? `${settings.defaultFromName} <${fromEmail}>` : fromEmail;
  const body = {
    from,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  };
  if (payload.replyTo || settings.replyTo) body.reply_to = payload.replyTo || settings.replyTo;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || "Resend 이메일 발송 요청이 실패했습니다.";
    throw Object.assign(new Error(message), { code: "PROVIDER_ERROR", providerResponse: data });
  }
  return { providerMessageId: data.id || createId("resend"), raw: data };
}

async function handleAdmin(req, res, pathname) {
  if (req.method === "POST" && pathname === "/admin/login") {
    const body = await readBody(req);
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      json(res, 401, { ok: false, error: { code: "INVALID_LOGIN", message: "관리자 정보가 올바르지 않습니다." } });
      return;
    }
    const db = readDb();
    cleanSessions(db);
    const token = crypto.randomBytes(32).toString("base64url");
    db.sessions.push({ token, createdAt: now() });
    audit(db, "admin.login", { email: ADMIN_EMAIL });
    writeDb(db);
    json(res, 200, { ok: true }, { "Set-Cookie": `smsapi_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax` });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/logout") {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const token = parseCookies(req).smsapi_session;
    auth.db.sessions = auth.db.sessions.filter((session) => session.token !== token);
    writeDb(auth.db);
    json(res, 200, { ok: true }, { "Set-Cookie": "smsapi_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax" });
    return;
  }

  const auth = requireAdmin(req, res);
  if (!auth) return;
  const { db } = auth;

  if (req.method === "GET" && pathname === "/admin/state") {
    json(res, 200, {
      ok: true,
      providerSettings: {
        solapi: providerPublic(db.providerSettings.solapi),
        resend: providerPublic(db.providerSettings.resend)
      },
      clients: db.clients.map(publicClient),
      messages: db.messages.slice(0, 100),
      auditLogs: db.auditLogs.slice(0, 50)
    });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/providers/solapi") {
    const body = await readBody(req);
    const existingConfig = decryptJson(db.providerSettings.solapi.encryptedConfig);
    const apiKey = body.apiKey || existingConfig.apiKey || "";
    const apiSecret = body.apiSecret || existingConfig.apiSecret || "";
    db.providerSettings.solapi = {
      enabled: Boolean(body.enabled),
      testMode: Boolean(body.testMode),
      defaultFrom: body.defaultFrom || "",
      maskedKey: maskSecret(apiKey),
      encryptedConfig: encryptJson({ apiKey, apiSecret }),
      updatedAt: now()
    };
    audit(db, "provider.solapi.updated", { enabled: Boolean(body.enabled), testMode: Boolean(body.testMode) });
    writeDb(db);
    json(res, 200, { ok: true, provider: providerPublic(db.providerSettings.solapi) });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/providers/resend") {
    const body = await readBody(req);
    const existingConfig = decryptJson(db.providerSettings.resend.encryptedConfig);
    const apiKey = body.apiKey || existingConfig.apiKey || "";
    db.providerSettings.resend = {
      enabled: Boolean(body.enabled),
      testMode: Boolean(body.testMode),
      defaultFrom: body.defaultFrom || "",
      defaultFromName: body.defaultFromName || "",
      replyTo: body.replyTo || "",
      maskedKey: maskSecret(apiKey),
      encryptedConfig: encryptJson({ apiKey }),
      updatedAt: now()
    };
    audit(db, "provider.resend.updated", { enabled: Boolean(body.enabled), testMode: Boolean(body.testMode) });
    writeDb(db);
    json(res, 200, { ok: true, provider: providerPublic(db.providerSettings.resend) });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/clients") {
    const body = await readBody(req);
    const apiKey = createApiKey();
    const client = {
      id: createId("client"),
      name: body.name || "새 클라이언트",
      apiKeyHash: hashApiKey(apiKey),
      allowedChannels: Array.isArray(body.allowedChannels) && body.allowedChannels.length ? body.allowedChannels : ["sms", "email"],
      allowedSenders: String(body.allowedSenders || "").split(",").map((item) => item.trim()).filter(Boolean),
      dailyLimit: {
        sms: Number(body.smsDailyLimit || 100),
        email: Number(body.emailDailyLimit || 500)
      },
      enabled: body.enabled !== false,
      createdAt: now()
    };
    db.clients.unshift(client);
    audit(db, "client.created", { clientId: client.id, name: client.name });
    writeDb(db);
    json(res, 201, { ok: true, client: publicClient(client), apiKey });
    return;
  }

  if (req.method === "PATCH" && pathname.startsWith("/admin/clients/")) {
    const id = pathname.split("/").pop();
    const body = await readBody(req);
    const client = db.clients.find((item) => item.id === id);
    if (!client) return notFound(res);
    if (typeof body.enabled === "boolean") client.enabled = body.enabled;
    if (body.name) client.name = body.name;
    audit(db, "client.updated", { clientId: client.id, enabled: client.enabled });
    writeDb(db);
    json(res, 200, { ok: true, client: publicClient(client) });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/test/sms") {
    const body = await readBody(req);
    const result = await callSolapi(db.providerSettings.solapi, {
      to: body.to,
      from: body.from,
      text: body.text || "[smsAPI Agent] 문자 발송 테스트입니다.",
      type: body.type || "SMS"
    });
    audit(db, "provider.solapi.test", { to: maskPhone(body.to), providerMessageId: result.providerMessageId });
    writeDb(db);
    json(res, 200, { ok: true, result });
    return;
  }

  if (req.method === "POST" && pathname === "/admin/test/email") {
    const body = await readBody(req);
    const result = await callResend(db.providerSettings.resend, {
      to: body.to,
      from: body.from,
      subject: body.subject || "smsAPI Agent 이메일 테스트",
      html: body.html || "<p>이메일 발송 테스트입니다.</p>",
      text: body.text || "이메일 발송 테스트입니다."
    });
    audit(db, "provider.resend.test", { to: maskEmail(body.to), providerMessageId: result.providerMessageId });
    writeDb(db);
    json(res, 200, { ok: true, result });
    return;
  }

  notFound(res);
}

async function handlePublicApi(req, res, pathname) {
  const auth = requireClient(req, res);
  if (!auth) return;
  const { db, client } = auth;

  if (req.method === "GET" && pathname.startsWith("/v1/messages/")) {
    const id = pathname.split("/").pop();
    const message = db.messages.find((item) => item.id === id && item.clientId === client.id);
    if (!message) return notFound(res);
    json(res, 200, { ok: true, message });
    return;
  }

  if (req.method !== "POST") return notFound(res);
  const channel = pathname === "/v1/messages/sms" ? "sms" : pathname === "/v1/messages/email" ? "email" : null;
  if (!channel) return notFound(res);
  if (!client.allowedChannels.includes(channel)) {
    json(res, 403, { ok: false, error: { code: "CHANNEL_DISABLED", message: "이 클라이언트는 해당 채널을 사용할 수 없습니다." } });
    return;
  }
  const body = await readBody(req);
  const provider = channel === "sms" ? "solapi" : "resend";
  const settings = db.providerSettings[provider];
  if (!settings.enabled && !settings.testMode) {
    json(res, 400, { ok: false, error: { code: "PROVIDER_NOT_CONFIGURED", message: "발송사가 활성화되어 있지 않습니다." } });
    return;
  }
  if (body.clientRequestId) {
    const duplicate = db.messages.find((message) => message.clientId === client.id && message.clientRequestId === body.clientRequestId);
    if (duplicate) {
      json(res, 409, { ok: false, error: { code: "DUPLICATE_CLIENT_REQUEST_ID", message: "이미 처리된 요청입니다.", messageId: duplicate.id } });
      return;
    }
  }
  const limit = client.dailyLimit[channel] || 0;
  if (limit > 0 && dailyCount(db, client.id, channel) >= limit) {
    json(res, 429, { ok: false, error: { code: "DAILY_LIMIT_EXCEEDED", message: "일일 발송 한도를 초과했습니다." } });
    return;
  }
  const sender = body.from || settings.defaultFrom;
  if (!validateSender(client, channel, sender)) {
    json(res, 403, { ok: false, error: { code: "SENDER_NOT_ALLOWED", message: "허용되지 않은 발신자입니다." } });
    return;
  }

  const message = {
    id: createId(channel === "sms" ? "msg" : "email"),
    clientId: client.id,
    clientRequestId: body.clientRequestId || null,
    channel,
    provider,
    toMasked: channel === "sms" ? maskPhone(body.to) : maskEmail(Array.isArray(body.to) ? body.to[0] : body.to),
    from: sender,
    status: "sending",
    providerMessageId: null,
    errorCode: null,
    errorMessage: null,
    requestedAt: now(),
    sentAt: null
  };
  db.messages.unshift(message);
  writeDb(db);

  try {
    const freshDb = readDb();
    const result = channel === "sms"
      ? await callSolapi(freshDb.providerSettings.solapi, body)
      : await callResend(freshDb.providerSettings.resend, body);
    const saved = freshDb.messages.find((item) => item.id === message.id);
    saved.status = "sent";
    saved.providerMessageId = result.providerMessageId;
    saved.sentAt = now();
    writeDb(freshDb);
    json(res, 200, { ok: true, messageId: saved.id, status: saved.status, providerMessageId: saved.providerMessageId });
  } catch (error) {
    const freshDb = readDb();
    const saved = freshDb.messages.find((item) => item.id === message.id);
    saved.status = "failed";
    saved.errorCode = error.code || "PROVIDER_ERROR";
    saved.errorMessage = error.message;
    writeDb(freshDb);
    json(res, 502, { ok: false, messageId: saved.id, error: { code: saved.errorCode, message: saved.errorMessage } });
  }
}

function adminPage() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>smsAPI Agent</title>
  <style>
    :root { color-scheme: light; font-family: Arial, "Malgun Gothic", sans-serif; color: #19202a; background: #f6f7f9; }
    body { margin: 0; }
    header { background: #111827; color: white; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; }
    main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 14px; font-size: 18px; }
    section { background: white; border: 1px solid #dde2ea; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    label { display: block; font-size: 13px; font-weight: 700; margin: 10px 0 4px; }
    input, textarea, select { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 9px 10px; font-size: 14px; }
    textarea { min-height: 74px; resize: vertical; }
    button { border: 0; border-radius: 6px; background: #2563eb; color: white; padding: 9px 13px; font-weight: 700; cursor: pointer; }
    button.secondary { background: #475569; }
    button.danger { background: #b91c1c; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
    .muted { color: #64748b; font-size: 13px; }
    .hidden { display: none; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; }
    code { background: #eef2ff; padding: 2px 5px; border-radius: 4px; }
    .stat { display: grid; gap: 4px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .stat strong { font-size: 24px; }
    #notice { position: fixed; right: 18px; bottom: 18px; background: #111827; color: white; padding: 12px 14px; border-radius: 8px; max-width: 420px; box-shadow: 0 12px 35px #0003; }
  </style>
</head>
<body>
  <header>
    <h1>smsAPI Agent</h1>
    <button id="logoutBtn" class="secondary hidden">로그아웃</button>
  </header>
  <main>
    <section id="loginBox">
      <h2>관리자 로그인</h2>
      <label>이메일</label>
      <input id="loginEmail" value="${ADMIN_EMAIL}">
      <label>비밀번호</label>
      <input id="loginPassword" type="password" value="1234">
      <div class="row"><button onclick="login()">로그인</button></div>
    </section>

    <div id="app" class="hidden">
      <section>
        <h2>대시보드</h2>
        <div class="grid">
          <div class="stat"><span>오늘 문자</span><strong id="smsToday">0</strong></div>
          <div class="stat"><span>오늘 이메일</span><strong id="emailToday">0</strong></div>
          <div class="stat"><span>실패</span><strong id="failedToday">0</strong></div>
          <div class="stat"><span>API 클라이언트</span><strong id="clientCount">0</strong></div>
        </div>
      </section>

      <div class="grid">
        <section>
          <h2>솔라피 설정</h2>
          <label><input id="solapiEnabled" type="checkbox" style="width:auto"> 사용</label>
          <label><input id="solapiTestMode" type="checkbox" style="width:auto"> 테스트 모드</label>
          <label>API Key <span id="solapiMasked" class="muted"></span></label>
          <input id="solapiApiKey" placeholder="새 키 입력 시에만 저장">
          <label>API Secret</label>
          <input id="solapiApiSecret" type="password" placeholder="새 Secret 입력 시에만 저장">
          <label>기본 발신번호</label>
          <input id="solapiDefaultFrom" placeholder="0212345678">
          <div class="row">
            <button onclick="saveSolapi()">저장</button>
          </div>
        </section>

        <section>
          <h2>Resend 설정</h2>
          <label><input id="resendEnabled" type="checkbox" style="width:auto"> 사용</label>
          <label><input id="resendTestMode" type="checkbox" style="width:auto"> 테스트 모드</label>
          <label>API Key <span id="resendMasked" class="muted"></span></label>
          <input id="resendApiKey" placeholder="새 키 입력 시에만 저장">
          <label>기본 발신 이메일</label>
          <input id="resendDefaultFrom" placeholder="noreply@example.com">
          <label>발신자 이름</label>
          <input id="resendDefaultFromName" placeholder="서비스명">
          <label>Reply-To</label>
          <input id="resendReplyTo" placeholder="support@example.com">
          <div class="row">
            <button onclick="saveResend()">저장</button>
          </div>
        </section>
      </div>

      <div class="grid">
        <section>
          <h2>문자 테스트</h2>
          <label>수신번호</label>
          <input id="smsTestTo" placeholder="01012345678">
          <label>내용</label>
          <textarea id="smsTestText">[smsAPI Agent] 문자 발송 테스트입니다.</textarea>
          <button onclick="testSms()">테스트 발송</button>
        </section>
        <section>
          <h2>이메일 테스트</h2>
          <label>수신 이메일</label>
          <input id="emailTestTo" placeholder="customer@example.com">
          <label>제목</label>
          <input id="emailTestSubject" value="smsAPI Agent 이메일 테스트">
          <label>HTML</label>
          <textarea id="emailTestHtml"><p>이메일 발송 테스트입니다.</p></textarea>
          <button onclick="testEmail()">테스트 발송</button>
        </section>
      </div>

      <section>
        <h2>API 클라이언트 생성</h2>
        <div class="grid">
          <div>
            <label>클라이언트 이름</label>
            <input id="clientName" placeholder="쇼핑몰 A">
          </div>
          <div>
            <label>허용 발신자</label>
            <input id="clientSenders" placeholder="0212345678,noreply@example.com,*@example.com">
          </div>
          <div>
            <label>문자 일일 한도</label>
            <input id="clientSmsLimit" type="number" value="100">
          </div>
          <div>
            <label>이메일 일일 한도</label>
            <input id="clientEmailLimit" type="number" value="500">
          </div>
        </div>
        <div class="row"><button onclick="createClient()">클라이언트 생성</button></div>
        <p class="muted">생성된 자체 API Key는 한 번만 표시됩니다.</p>
        <div id="newApiKey"></div>
      </section>

      <section>
        <h2>API 클라이언트</h2>
        <table><thead><tr><th>이름</th><th>허용 채널</th><th>발신자</th><th>일일 한도</th><th>상태</th></tr></thead><tbody id="clientsTable"></tbody></table>
      </section>

      <section>
        <h2>최근 발송 이력</h2>
        <table><thead><tr><th>시간</th><th>채널</th><th>수신자</th><th>상태</th><th>발송사</th><th>오류</th></tr></thead><tbody id="messagesTable"></tbody></table>
      </section>
    </div>
  </main>
  <div id="notice" class="hidden"></div>
  <script>
    let state = null;
    async function api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error?.message || "요청 실패");
      return data;
    }
    function value(id) { return document.getElementById(id).value; }
    function checked(id) { return document.getElementById(id).checked; }
    function show(message) {
      const box = document.getElementById("notice");
      box.textContent = message;
      box.classList.remove("hidden");
      setTimeout(() => box.classList.add("hidden"), 3500);
    }
    async function login() {
      await api("/admin/login", { method: "POST", body: JSON.stringify({ email: value("loginEmail"), password: value("loginPassword") }) });
      await loadState();
    }
    async function logout() {
      await api("/admin/logout", { method: "POST", body: "{}" });
      location.reload();
    }
    async function loadState() {
      state = await api("/admin/state");
      document.getElementById("loginBox").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");
      document.getElementById("logoutBtn").classList.remove("hidden");
      render();
    }
    function render() {
      const solapi = state.providerSettings.solapi;
      document.getElementById("solapiEnabled").checked = solapi.enabled;
      document.getElementById("solapiTestMode").checked = solapi.testMode;
      document.getElementById("solapiDefaultFrom").value = solapi.defaultFrom || "";
      document.getElementById("solapiMasked").textContent = solapi.maskedKey ? "(" + solapi.maskedKey + ")" : "";
      const resend = state.providerSettings.resend;
      document.getElementById("resendEnabled").checked = resend.enabled;
      document.getElementById("resendTestMode").checked = resend.testMode;
      document.getElementById("resendDefaultFrom").value = resend.defaultFrom || "";
      document.getElementById("resendDefaultFromName").value = resend.defaultFromName || "";
      document.getElementById("resendReplyTo").value = resend.replyTo || "";
      document.getElementById("resendMasked").textContent = resend.maskedKey ? "(" + resend.maskedKey + ")" : "";
      const today = new Date().toISOString().slice(0, 10);
      const todayMessages = state.messages.filter((m) => (m.requestedAt || "").slice(0, 10) === today);
      document.getElementById("smsToday").textContent = todayMessages.filter((m) => m.channel === "sms").length;
      document.getElementById("emailToday").textContent = todayMessages.filter((m) => m.channel === "email").length;
      document.getElementById("failedToday").textContent = todayMessages.filter((m) => m.status === "failed").length;
      document.getElementById("clientCount").textContent = state.clients.length;
      document.getElementById("clientsTable").innerHTML = state.clients.map((c) => "<tr><td>" + c.name + "<br><code>" + c.id + "</code></td><td>" + c.allowedChannels.join(", ") + "</td><td>" + c.allowedSenders.join("<br>") + "</td><td>SMS " + c.dailyLimit.sms + "<br>Email " + c.dailyLimit.email + "</td><td>" + (c.enabled ? "활성" : "비활성") + "</td></tr>").join("");
      document.getElementById("messagesTable").innerHTML = state.messages.map((m) => "<tr><td>" + m.requestedAt + "</td><td>" + m.channel + "</td><td>" + m.toMasked + "</td><td>" + m.status + "</td><td>" + m.provider + "</td><td>" + (m.errorMessage || "") + "</td></tr>").join("");
    }
    async function saveSolapi() {
      await api("/admin/providers/solapi", { method: "POST", body: JSON.stringify({ enabled: checked("solapiEnabled"), testMode: checked("solapiTestMode"), apiKey: value("solapiApiKey"), apiSecret: value("solapiApiSecret"), defaultFrom: value("solapiDefaultFrom") }) });
      document.getElementById("solapiApiKey").value = "";
      document.getElementById("solapiApiSecret").value = "";
      await loadState();
      show("솔라피 설정을 저장했습니다.");
    }
    async function saveResend() {
      await api("/admin/providers/resend", { method: "POST", body: JSON.stringify({ enabled: checked("resendEnabled"), testMode: checked("resendTestMode"), apiKey: value("resendApiKey"), defaultFrom: value("resendDefaultFrom"), defaultFromName: value("resendDefaultFromName"), replyTo: value("resendReplyTo") }) });
      document.getElementById("resendApiKey").value = "";
      await loadState();
      show("Resend 설정을 저장했습니다.");
    }
    async function createClient() {
      const data = await api("/admin/clients", { method: "POST", body: JSON.stringify({ name: value("clientName"), allowedSenders: value("clientSenders"), smsDailyLimit: value("clientSmsLimit"), emailDailyLimit: value("clientEmailLimit") }) });
      document.getElementById("newApiKey").innerHTML = "<p>자체 API Key: <code>" + data.apiKey + "</code></p>";
      await loadState();
      show("API 클라이언트를 생성했습니다.");
    }
    async function testSms() {
      await api("/admin/test/sms", { method: "POST", body: JSON.stringify({ to: value("smsTestTo"), text: value("smsTestText") }) });
      show("문자 테스트 요청이 처리되었습니다.");
    }
    async function testEmail() {
      await api("/admin/test/email", { method: "POST", body: JSON.stringify({ to: value("emailTestTo"), subject: value("emailTestSubject"), html: value("emailTestHtml") }) });
      show("이메일 테스트 요청이 처리되었습니다.");
    }
    document.getElementById("logoutBtn").addEventListener("click", logout);
    loadState().catch(() => {});
  </script>
</body>
</html>`;
}

async function router(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    res.corsHeaders = corsHeaders(req);
    if (req.method === "OPTIONS") {
      res.writeHead(204, res.corsHeaders);
      res.end();
      return;
    }
    if (req.method === "GET" && pathname === "/") return html(res, adminPage());
    if (req.method === "GET" && pathname === "/health") return json(res, 200, { ok: true, service: "smsAPI Agent", time: now() });
    if (pathname.startsWith("/admin/")) return handleAdmin(req, res, pathname);
    if (pathname.startsWith("/v1/")) return handlePublicApi(req, res, pathname);
    if (PUBLIC_ROUTES.has(pathname)) return notFound(res);
    return notFound(res);
  } catch (error) {
    const code = error.message === "INVALID_JSON" ? "INVALID_JSON" : "INTERNAL_ERROR";
    const status = error.message === "INVALID_JSON" ? 400 : 500;
    json(res, status, { ok: false, error: { code, message: error.message } });
  }
}

ensureDb();
http.createServer(router).listen(PORT, () => {
  console.log(`smsAPI Agent listening on http://localhost:${PORT}`);
});
