const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const port = Number(process.env.SMOKE_PORT || 3299);
const baseUrl = `http://127.0.0.1:${port}`;
const adminEmail = "smoke-admin@smsapi.local";
const adminPassword = "smoke-password";
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "smsapi-smoke-"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || data.ok === false) {
    const message = data.error?.message || response.statusText;
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${message}`);
  }
  return { response, data };
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    try {
      await request("/health");
      return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Server did not become ready within 10 seconds.");
}

function cookieFrom(response) {
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("Login did not return a session cookie.");
  return cookie.split(";")[0];
}

async function main() {
  const server = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      MASTER_KEY: "smoke-test-master-key-change-me",
      ALLOWED_ORIGINS: "http://127.0.0.1:3299"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer();

    const openapi = await request("/openapi.json");
    if (openapi.data.openapi !== "3.1.0") throw new Error("OpenAPI version mismatch.");

    const login = await request("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const cookie = cookieFrom(login.response);

    await request("/admin/providers/solapi", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        enabled: false,
        testMode: true,
        apiKey: "smoke-solapi-key",
        apiSecret: "smoke-solapi-secret",
        defaultFrom: "0212345678"
      })
    });

    await request("/admin/providers/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        enabled: false,
        testMode: true,
        apiKey: "smoke-resend-key",
        defaultFrom: "noreply@example.com",
        defaultFromName: "Smoke Test",
        replyTo: "support@example.com"
      })
    });

    const clientResult = await request("/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        name: "Smoke Test Client",
        allowedSenders: "0212345678,noreply@example.com,*@example.com",
        smsDailyLimit: 5,
        emailDailyLimit: 5
      })
    });
    const apiKey = clientResult.data.apiKey;

    const sms = await request("/v1/messages/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        to: "01012345678",
        from: "0212345678",
        text: "[smsAPI Agent] smoke test",
        clientRequestId: "smoke-sms-1"
      })
    });
    if (sms.data.status !== "sent") throw new Error("SMS smoke request was not sent.");

    const email = await request("/v1/messages/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        to: "customer@example.com",
        from: "noreply@example.com",
        subject: "Smoke test",
        html: "<p>Smoke test</p>",
        text: "Smoke test",
        clientRequestId: "smoke-email-1"
      })
    });
    if (email.data.status !== "sent") throw new Error("Email smoke request was not sent.");

    const status = await request(`/v1/messages/${sms.data.messageId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (status.data.message.status !== "sent") throw new Error("Message status lookup failed.");

    console.log("Smoke test passed.");
  } catch (error) {
    console.error(error.message);
    if (serverOutput.trim()) console.error(serverOutput.trim());
    process.exitCode = 1;
  } finally {
    server.kill();
    await sleep(250);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main();
