const STORAGE_KEY = "challenge-manager-mvp-v1";
const API_MODE = location.protocol !== "file:";

const STATUS = {
  challenge: {
    DRAFT: "작성 중",
    RECRUITING: "모집 중",
    READY: "시작 대기",
    RUNNING: "진행 중",
    REVIEWING: "검수 중",
    COMPLETED: "완료",
    CANCELED: "취소",
    HIDDEN: "숨김",
  },
  participant: {
    PENDING_PAYMENT: "결제 대기",
    JOINED: "참가 완료",
    WITHDRAWN: "참가 취소",
    SUCCEEDED: "성공",
    FAILED: "실패",
    DISQUALIFIED: "실격",
  },
  payment: {
    PENDING_PAYMENT: "결제 대기",
    PAID: "결제 완료",
    CANCELED: "결제 취소",
    REFUNDED: "환불 완료",
  },
  submission: {
    SUBMITTED: "제출 완료",
    APPROVED: "승인",
    REJECTED: "반려",
    NEEDS_REVISION: "보완 요청",
  },
  payout: {
    PENDING: "지급 대기",
    HOLD: "지급 보류",
    PAID: "지급 완료",
    FAILED: "지급 실패",
    CANCELED: "지급 취소",
  },
  dispute: {
    OPEN: "접수",
    REVIEWING: "검토 중",
    RESOLVED: "처리 완료",
    REJECTED: "기각",
  },
};

const seed = {
  active: "dashboard",
  currentUserId: "",
  users: [
    { id: "u-admin", email: "admin@challenge.local", password: "1234", name: "플랫폼 관리자", nickname: "관리자", role: "admin", plan: "Agency" },
    { id: "u-organizer", email: "brand@challenge.local", password: "1234", name: "브랜드 운영자", nickname: "브랜드팀", role: "organizer", plan: "Pro" },
    { id: "u-user", email: "user@challenge.local", password: "1234", name: "김챌린저", nickname: "콘텐츠러", role: "participant", plan: "Free" },
  ],
  plans: [
    { name: "Free", price: "0원", challengeLimit: 1, participantLimit: 10, csv: false, report: false },
    { name: "Starter", price: "월 29,000원", challengeLimit: 3, participantLimit: 100, csv: true, report: false },
    { name: "Pro", price: "월 99,000원", challengeLimit: 20, participantLimit: 1000, csv: true, report: true },
    { name: "Agency", price: "월 299,000원 이상", challengeLimit: 999, participantLimit: 9999, csv: true, report: true },
  ],
  challenges: [
    {
      id: "ch-1",
      organizerId: "u-organizer",
      title: "블로그 7일 포스팅 챌린지",
      description: "7일 동안 블로그 콘텐츠를 꾸준히 발행하고 링크와 캡처 이미지로 인증하는 챌린지입니다.",
      platformType: "블로그",
      coverImage: "",
      recruitStartAt: "2026-06-01",
      recruitEndAt: "2026-06-20",
      challengeStartAt: "2026-06-21",
      challengeEndAt: "2026-06-30",
      maxParticipants: 50,
      entryFeeLabel: "10,000원 수동 확인",
      rewardType: "유료 참가 + 보증금 환급형",
      rewardDescription: "성공자는 운영자 확인 후 지급 대상자로 확정됩니다. 자동 송금 기능은 제공하지 않습니다.",
      totalMissionCount: 7,
      requiredApprovalCount: 5,
      submissionGuide: "블로그 게시글 URL과 캡처 이미지를 제출하세요.",
      reviewGuide: "기간 내 작성, 공개 링크, 필수 해시태그 포함 여부를 확인합니다.",
      refundPolicy: "모집 종료 전 취소 가능. 시작 후 환불은 운영자 정책에 따릅니다.",
      requiresAdDisclosure: true,
      status: "RECRUITING",
      isPublic: true,
      rankingLockedAt: "",
      createdAt: "2026-06-11",
    },
    {
      id: "ch-2",
      organizerId: "u-organizer",
      title: "유튜브 쇼츠 업로드 챌린지",
      description: "2주 동안 쇼츠 콘텐츠를 꾸준히 업로드하고 URL로 인증합니다.",
      platformType: "유튜브",
      coverImage: "",
      recruitStartAt: "2026-06-05",
      recruitEndAt: "2026-06-25",
      challengeStartAt: "2026-06-26",
      challengeEndAt: "2026-07-10",
      maxParticipants: 30,
      entryFeeLabel: "무료",
      rewardType: "무료 참가 + 운영자 고정 리워드",
      rewardDescription: "상위 랭킹 대상자는 운영자 확인 후 리워드 지급 대상자로 관리됩니다.",
      totalMissionCount: 7,
      requiredApprovalCount: 5,
      submissionGuide: "유튜브 쇼츠 URL과 설명을 제출하세요.",
      reviewGuide: "공개 영상, 기간 내 업로드, 지정 문구 포함 여부를 확인합니다.",
      refundPolicy: "무료 챌린지입니다.",
      requiresAdDisclosure: false,
      status: "RECRUITING",
      isPublic: true,
      rankingLockedAt: "",
      createdAt: "2026-06-11",
    },
  ],
  participants: [
    {
      id: "pa-1",
      challengeId: "ch-1",
      userId: "u-user",
      participantStatus: "JOINED",
      paymentStatus: "PAID",
      joinedAt: "2026-06-11T09:00:00.000Z",
      paidAt: "2026-06-11T09:20:00.000Z",
      paymentProof: {
        payerName: "김챌린저",
        amount: "10,000",
        reference: "샘플 입금",
        memo: "테스트 결제 확인",
        submittedAt: "2026-06-11T09:10:00.000Z",
        status: "CONFIRMED",
      },
      finalResult: "",
      finalRank: "",
    },
  ],
  submissions: [
    {
      id: "su-1",
      challengeId: "ch-1",
      participantId: "pa-1",
      missionNumber: 1,
      title: "1일차 블로그 인증",
      contentUrl: "https://blog.example.com/day1",
      platformAccount: "content-maker",
      hashtags: "#챌린지 #블로그",
      description: "첫 번째 글을 발행했습니다.",
      imageName: "capture-day1.png",
      status: "APPROVED",
      submittedAt: "2026-06-11T10:00:00.000Z",
      reviewedAt: "2026-06-11T11:00:00.000Z",
      reviewerId: "u-organizer",
      reviewReason: "조건 충족",
      revisionGroupId: "su-1",
    },
  ],
  payouts: [],
  disputes: [],
  notifications: [],
  inquiries: [],
  auditLogs: [],
};

let state = loadState();
normalizeState();
let form = {};
let filters = {
  challenge: "전체",
  submission: "SUBMITTED",
  participantPayment: "ALL",
  participantSearch: "",
  submissionSearch: "",
  search: "",
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : structuredClone(seed);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveLocalOnly() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState() {
  state.disputes ||= [];
  state.notifications ||= [];
  state.inquiries ||= [];
  state.auditLogs ||= [];
  state.plans ||= structuredClone(seed.plans);
  state.users.forEach((user) => {
    user.plan ||= user.role === "admin" ? "Agency" : "Free";
  });
  state.participants.forEach((participant) => {
    participant.paymentProof ||= { payerName: "", amount: "", reference: "", memo: "", submittedAt: "", status: "" };
  });
}

async function resetState() {
  if (!confirm("샘플 데이터로 초기화할까요? 현재 런타임 데이터가 교체됩니다.")) return;
  if (API_MODE) {
    try {
      const payload = await apiPost("/api/reset");
      applyServerPayload(payload);
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  state = structuredClone(seed);
  saveState();
  render();
}

async function apiPost(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "요청 처리에 실패했습니다.");
  return payload;
}

function applyServerPayload(payload) {
  state = payload.state;
  normalizeState();
  saveLocalOnly();
}

async function apiAction(type, payload = {}) {
  const result = await apiPost("/api/action", { type, payload });
  applyServerPayload(result);
  return result;
}

async function initialize() {
  if (API_MODE) {
    try {
      const response = await fetch("/api/session");
      const payload = await response.json();
      state = payload.state;
      normalizeState();
      saveLocalOnly();
    } catch (error) {
      console.error("server init failed", error);
    }
  }
  if (currentUser() && !state.active) state.active = currentUser().role === "participant" ? "explore" : "dashboard";
  render();
}

function uid(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function can(role) {
  return currentUser().role === role;
}

function roleLabel(role) {
  return { admin: "관리자", organizer: "운영자", participant: "참가자" }[role] || role;
}

function userName(id) {
  return state.users.find((user) => user.id === id)?.nickname || "-";
}

function challengeById(id) {
  return state.challenges.find((challenge) => challenge.id === id);
}

function participantById(id) {
  return state.participants.find((participant) => participant.id === id);
}

function myChallenges() {
  const user = currentUser();
  if (user.role === "admin") return state.challenges;
  if (user.role === "organizer") return state.challenges.filter((challenge) => challenge.organizerId === user.id);
  const joinedIds = state.participants.filter((row) => row.userId === user.id).map((row) => row.challengeId);
  return state.challenges.filter((challenge) => joinedIds.includes(challenge.id));
}

function isOwner(challenge) {
  const user = currentUser();
  return Boolean(challenge) && (user.role === "admin" || challenge.organizerId === user.id);
}

function formatDate(value) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function searchText(value = "") {
  return String(value).trim().toLowerCase();
}

function includesSearch(values, keyword) {
  const query = searchText(keyword);
  if (!query) return true;
  return values.some((value) => searchText(value).includes(query));
}

function audit(action, targetType, targetId, beforeValue, afterValue) {
  state.auditLogs.unshift({
    id: uid("log"),
    actorId: currentUser().id,
    action,
    targetType,
    targetId,
    beforeValue,
    afterValue,
    createdAt: nowIso(),
  });
}

function notify(userId, title, message, link = "") {
  state.notifications.unshift({
    id: uid("nt"),
    userId,
    title,
    message,
    link,
    read: false,
    createdAt: nowIso(),
  });
}

function unreadCount(userId = currentUser()?.id) {
  return state.notifications.filter((row) => row.userId === userId && !row.read).length;
}

function planFor(user = currentUser()) {
  return state.plans.find((plan) => plan.name === user?.plan) || state.plans[0];
}

function usageFor(userId) {
  const challenges = state.challenges.filter((challenge) => challenge.organizerId === userId);
  const challengeIds = challenges.map((challenge) => challenge.id);
  return {
    challenges: challenges.length,
    participants: state.participants.filter((participant) => challengeIds.includes(participant.challengeId)).length,
  };
}

function canCreateChallenge(user = currentUser()) {
  if (!user || user.role === "admin") return true;
  return usageFor(user.id).challenges < planFor(user).challengeLimit;
}

function canAcceptParticipant(challenge) {
  const organizer = state.users.find((user) => user.id === challenge.organizerId);
  if (!organizer || organizer.role === "admin") return true;
  return state.participants.filter((participant) => participant.challengeId === challenge.id).length < Math.min(Number(challenge.maxParticipants || 0), planFor(organizer).participantLimit);
}

function badge(type, value) {
  const text = STATUS[type]?.[value] || value || "-";
  const cls =
    ["APPROVED", "PAID", "SUCCEEDED", "COMPLETED", "JOINED"].includes(value)
      ? "ok"
      : ["REJECTED", "FAILED", "CANCELED", "DISQUALIFIED", "HIDDEN"].includes(value)
        ? "danger"
        : ["NEEDS_REVISION", "PENDING_PAYMENT", "PENDING", "HOLD", "REVIEWING", "SUBMITTED"].includes(value)
          ? "warn"
          : "neutral";
  return `<span class="badge ${cls}">${text}</span>`;
}

function platformBadge(type) {
  return `<span class="platform platform-${type}">${type}</span>`;
}

function submissionImageHtml(submission, compact = false) {
  if (submission.imageUrl) {
    return `<a class="thumb-link" href="${escapeHtml(submission.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(submission.imageUrl)}" alt="${escapeHtml(submission.imageName || "인증 이미지")}" />${compact ? "" : `<span>${escapeHtml(submission.imageName || "이미지 보기")}</span>`}</a>`;
  }
  if (submission.imageName) return `<span class="file-pill">${escapeHtml(submission.imageName)}</span>`;
  return "-";
}

function paymentProofSummary(participant) {
  const proof = participant.paymentProof || {};
  if (!proof.submittedAt) {
    return participant.paymentStatus === "PAID" ? "운영자 확인 완료" : "입금 정보 없음";
  }
  return `${proof.payerName || "입금자 미기재"} · ${proof.amount || "금액 미기재"}원`;
}

function paymentProofDetail(participant) {
  const proof = participant.paymentProof || {};
  if (!proof.submittedAt) return `<span class="muted">아직 제출된 입금 확인 정보가 없습니다.</span>`;
  return `
    <div class="proof-box">
      <strong>${escapeHtml(proof.payerName || "입금자 미기재")}</strong>
      <span>${escapeHtml(proof.amount || "금액 미기재")}원</span>
      ${proof.reference ? `<small>참고번호: ${escapeHtml(proof.reference)}</small>` : ""}
      ${proof.memo ? `<small>${escapeHtml(proof.memo)}</small>` : ""}
      <small>제출: ${formatDate(proof.submittedAt)}</small>
    </div>
  `;
}

function progressForParticipant(participant) {
  const challenge = challengeById(participant.challengeId);
  const approvedMissionNumbers = new Set(
    state.submissions
      .filter((submission) => submission.participantId === participant.id && submission.status === "APPROVED")
      .map((submission) => Number(submission.missionNumber))
  );
  const approved = approvedMissionNumbers.size;
  const total = Number(challenge?.totalMissionCount || 1);
  const required = Number(challenge?.requiredApprovalCount || total);
  return {
    approved,
    total,
    required,
    percent: Math.min(100, Math.round((approved / total) * 100)),
    success: approved >= required,
  };
}

function rejectedCount(participantId) {
  return state.submissions.filter((submission) => submission.participantId === participantId && submission.status === "REJECTED").length;
}

function lastApprovedAt(participantId) {
  return state.submissions
    .filter((submission) => submission.participantId === participantId && submission.status === "APPROVED")
    .map((submission) => submission.reviewedAt || submission.submittedAt)
    .sort()
    .at(-1) || "";
}

function rankings(challengeId) {
  return state.participants
    .filter((participant) => participant.challengeId === challengeId)
    .map((participant) => ({
      ...participant,
      progress: progressForParticipant(participant),
      rejected: rejectedCount(participant.id),
      lastApproved: lastApprovedAt(participant.id),
    }))
    .sort((a, b) => {
      if (b.progress.approved !== a.progress.approved) return b.progress.approved - a.progress.approved;
      if (a.lastApproved !== b.lastApproved) return (a.lastApproved || "9999").localeCompare(b.lastApproved || "9999");
      if (a.rejected !== b.rejected) return a.rejected - b.rejected;
      return a.joinedAt.localeCompare(b.joinedAt);
    })
    .map((participant, index) => ({ ...participant, rank: index + 1 }));
}

function participantFor(challengeId, userId = currentUser().id) {
  return state.participants.find((participant) => participant.challengeId === challengeId && participant.userId === userId);
}

function render() {
  const root = document.getElementById("app");
  root.innerHTML = currentUser() ? renderApp() : renderAuth();
  bindEvents();
}

function renderAuth() {
  const mode = form.authMode || "login";
  return `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-copy">
          <strong>ChallengeOps</strong>
          <h1>블로그, 유튜브, 틱톡 챌린지를 한 곳에서 운영하세요.</h1>
          <p>참가 신청, 링크/사진 인증, 운영자 검수, 랭킹 확정, 정산 CSV까지 MVP 흐름을 검증할 수 있습니다.</p>
          <div class="demo-accounts">
            <span>테스트 계정</span>
            <button class="btn ghost" data-demo-login="u-admin">관리자</button>
            <button class="btn ghost" data-demo-login="u-organizer">운영자</button>
            <button class="btn ghost" data-demo-login="u-user">참가자</button>
          </div>
        </div>
        <div class="auth-card">
          <h2>${mode === "login" ? "로그인" : "회원가입"}</h2>
          ${
            mode === "login"
              ? `<form class="form auth-form" data-form="login">
                  <label class="full">이메일<input name="email" type="email" required value="brand@challenge.local" /></label>
                  <label class="full">비밀번호<input name="password" type="password" required value="1234" /></label>
                  <div class="full form-actions"><button class="btn primary">로그인</button></div>
                </form>
                <p class="auth-switch">계정이 없나요? <button data-auth-mode="signup">회원가입</button></p>`
              : `<form class="form auth-form" data-form="signup">
                  <label class="full">이름<input name="name" required placeholder="홍길동" /></label>
                  <label class="full">닉네임<input name="nickname" required placeholder="챌린저" /></label>
                  <label class="full">이메일<input name="email" type="email" required placeholder="user@example.com" /></label>
                  <label class="full">비밀번호<input name="password" type="password" required minlength="4" /></label>
                  <label class="check full"><input type="checkbox" required /> 서비스 이용 약관과 개인정보 수집에 동의합니다.</label>
                  <div class="full form-actions"><button class="btn primary">회원가입</button></div>
                </form>
                <p class="auth-switch">이미 계정이 있나요? <button data-auth-mode="login">로그인</button></p>`
          }
        </div>
      </section>
    </main>
  `;
}

function renderApp() {
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>ChallengeOps</strong>
          <span>콘텐츠 챌린지 인증, 검수, 랭킹, 정산 보조</span>
        </div>
        <div class="user-card">
          <strong>${escapeHtml(currentUser().nickname)}</strong>
          <span>${roleLabel(currentUser().role)} · ${currentUser().plan || "Free"}</span>
        </div>
        <nav class="nav">${renderNav()}<button data-logout>로그아웃</button></nav>
      </aside>
      <main class="content">
        <header class="mobile-bar">
          <strong>ChallengeOps</strong>
          <div class="mobile-actions">${userSessionControl()}<button class="btn ghost" data-logout>로그아웃</button></div>
        </header>
        ${renderPage()}
      </main>
    </div>
    ${renderModal()}
  `;
}

function renderNav() {
  const role = currentUser().role;
  const items = [
    ["dashboard", "대시보드", ["admin", "organizer"]],
    ["explore", "챌린지 탐색", ["participant", "organizer", "admin"]],
    ["my", "내 챌린지", ["participant"]],
    ["manage", "챌린지 관리", ["organizer", "admin"]],
    ["participants", "참가자 관리", ["organizer", "admin"]],
    ["submissions", "제출물 검수", ["organizer", "admin"]],
    ["rankings", "랭킹 관리", ["organizer", "admin"]],
    ["payouts", "정산 보조", ["organizer", "admin"]],
    ["disputes", "이의 신청", ["participant", "organizer", "admin"]],
    ["notifications", `알림${unreadCount() ? ` (${unreadCount()})` : ""}`, ["participant", "organizer", "admin"]],
    ["pricing", "요금제", ["organizer", "admin"]],
    ["planAdmin", "플랜 관리", ["admin"]],
    ["inquiries", "캠페인 문의", ["admin"]],
    ["logs", "운영 로그", ["organizer", "admin"]],
  ];
  return items
    .filter(([, , roles]) => roles.includes(role))
    .map(([id, label]) => `<button class="${state.active === id ? "active" : ""}" data-nav="${id}">${label}</button>`)
    .join("");
}

function pageHeader(title, desc, actions = "") {
  return `
    <div class="topbar">
      <div>
        <h1>${title}</h1>
        <p>${desc}</p>
      </div>
      <div class="actions">
        ${userSessionControl()}
        ${actions}
        ${currentUser().role === "admin" ? `<button class="btn ghost" data-reset>샘플 초기화</button>` : ""}
      </div>
    </div>
  `;
}

function userSessionControl() {
  if (API_MODE) return `<span class="role-pill">${escapeHtml(currentUser().nickname)} · ${roleLabel(currentUser().role)}</span>`;
  return `<select data-switch-user title="사용자 전환">${state.users.map((user) => `<option value="${user.id}" ${user.id === currentUser().id ? "selected" : ""}>${user.nickname} (${roleLabel(user.role)})</option>`).join("")}</select>`;
}

function renderPage() {
  const pages = {
    dashboard: renderDashboard,
    explore: renderExplore,
    my: renderMyChallenges,
    manage: renderManage,
    participants: renderParticipantManage,
    submissions: renderSubmissionReview,
    rankings: renderRankingManage,
    payouts: renderPayouts,
    disputes: renderDisputes,
    notifications: renderNotifications,
    pricing: renderPricing,
    planAdmin: renderPlanAdmin,
    inquiries: renderInquiries,
    logs: renderLogs,
  };
  return (pages[state.active] || renderExplore)();
}

function renderDashboard() {
  const challenges = myChallenges();
  const ids = challenges.map((challenge) => challenge.id);
  const participants = state.participants.filter((row) => ids.includes(row.challengeId));
  const submissions = state.submissions.filter((row) => ids.includes(row.challengeId));
  const payouts = state.payouts.filter((row) => ids.includes(row.challengeId));
  const paidParticipants = participants.filter((row) => row.paymentStatus === "PAID").length;
  const approvedSubmissions = submissions.filter((row) => row.status === "APPROVED").length;
  const successParticipants = participants.filter((row) => row.finalResult === "SUCCEEDED").length;
  const paidPayouts = payouts.filter((row) => row.payoutStatus === "PAID").length;

  return `
    ${pageHeader("운영자 대시보드", "오늘 처리할 참가자, 제출물, 지급 상태를 한 화면에서 확인합니다.", `<button class="btn primary" data-nav="manage" data-action="new-challenge">챌린지 만들기</button>`)}
    <div class="stats">
      ${stat("진행/모집 챌린지", challenges.filter((row) => ["RECRUITING", "RUNNING", "REVIEWING"].includes(row.status)).length)}
      ${stat("결제 대기 참가자", participants.filter((row) => row.paymentStatus === "PENDING_PAYMENT").length)}
      ${stat("검수 대기 제출물", submissions.filter((row) => row.status === "SUBMITTED").length)}
      ${stat("보완 요청", submissions.filter((row) => row.status === "NEEDS_REVISION").length)}
      ${stat("지급 대기", payouts.filter((row) => row.payoutStatus === "PENDING").length)}
      ${stat("CSV 다운로드 가능", currentUser().plan === "Free" ? "제한" : "가능")}
    </div>
    <section class="section">
      <div class="section-head">
        <div>
          <h2>운영 리포트</h2>
          <p>참가 전환, 승인률, 성공자, 지급 완료 상태를 챌린지별로 확인합니다.</p>
        </div>
        ${planFor().report || currentUser().role === "admin" ? `<span class="badge ok">리포트 포함</span>` : `<button class="btn ghost" data-nav="pricing">리포트 업그레이드</button>`}
      </div>
      <div class="metric-strip">
        ${metric("결제 완료율", ratio(paidParticipants, participants.length))}
        ${metric("제출 승인율", ratio(approvedSubmissions, submissions.length))}
        ${metric("성공자", successParticipants)}
        ${metric("지급 완료", `${paidPayouts}/${payouts.length || 0}`)}
      </div>
      ${dashboardReportTable(challenges)}
    </section>
    <div class="grid layout-2">
      <section class="section">
        <div class="section-head">
          <h2>최근 제출물</h2>
          <button class="btn ghost" data-nav="submissions">검수 화면</button>
        </div>
        ${submissionTable(submissions.slice(0, 6), true)}
      </section>
      <section class="section">
        <div class="section-head">
          <h2>운영 중 챌린지</h2>
          <button class="btn ghost" data-nav="manage">관리</button>
        </div>
        ${challengeList(challenges.slice(0, 4), true)}
      </section>
    </div>
  `;
}

function stat(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function ratio(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function dashboardReportTable(challenges) {
  if (!challenges.length) return emptyState("리포트 대상 챌린지가 없습니다.", "챌린지를 만들면 운영 지표가 표시됩니다.");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>챌린지</th><th>참가</th><th>결제 완료</th><th>제출</th><th>승인</th><th>성공자</th><th>지급 완료</th><th>다음 액션</th></tr></thead>
        <tbody>
          ${challenges
            .map((challenge) => {
              const participants = state.participants.filter((row) => row.challengeId === challenge.id);
              const submissions = state.submissions.filter((row) => row.challengeId === challenge.id);
              const payouts = state.payouts.filter((row) => row.challengeId === challenge.id);
              const paid = participants.filter((row) => row.paymentStatus === "PAID").length;
              const approved = submissions.filter((row) => row.status === "APPROVED").length;
              const pendingReview = submissions.filter((row) => row.status === "SUBMITTED").length;
              const success = participants.filter((row) => row.finalResult === "SUCCEEDED").length;
              const payoutPaid = payouts.filter((row) => row.payoutStatus === "PAID").length;
              const next = reportNextAction({ participants, submissions, payouts, pendingReview, challenge });
              return `
                <tr>
                  <td><strong>${escapeHtml(challenge.title)}</strong><small>${badge("challenge", challenge.status)} ${platformBadge(challenge.platformType)}</small></td>
                  <td>${participants.length}/${challenge.maxParticipants}</td>
                  <td>${paid} (${ratio(paid, participants.length)})</td>
                  <td>${submissions.length}</td>
                  <td>${approved} (${ratio(approved, submissions.length)})</td>
                  <td>${success}</td>
                  <td>${payoutPaid}/${payouts.length}</td>
                  <td><button class="btn ghost" data-nav="${next.page}" data-focus-challenge="${challenge.id}">${next.label}</button></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function reportNextAction({ participants, submissions, payouts, pendingReview, challenge }) {
  if (participants.some((row) => row.paymentStatus === "PENDING_PAYMENT")) return { page: "participants", label: "결제 확인" };
  if (pendingReview) return { page: "submissions", label: "검수하기" };
  if (!challenge.rankingLockedAt && submissions.some((row) => row.status === "APPROVED")) return { page: "rankings", label: "랭킹 확정" };
  if (challenge.rankingLockedAt && !payouts.length) return { page: "payouts", label: "지급 대상 생성" };
  if (payouts.some((row) => row.payoutStatus === "PENDING")) return { page: "payouts", label: "지급 확인" };
  return { page: "manage", label: "관리" };
}

function renderExplore() {
  const visible = state.challenges.filter((challenge) => challenge.isPublic && challenge.status !== "HIDDEN");
  const filtered = filters.challenge === "전체" ? visible : visible.filter((challenge) => challenge.platformType === filters.challenge);
  return `
    ${pageHeader("챌린지 탐색", "블로그, 유튜브, 틱톡 챌린지를 확인하고 참가 신청합니다.", can("organizer") || can("admin") ? `<button class="btn primary" data-action="new-challenge">챌린지 만들기</button>` : "")}
    <section class="section">
      <div class="filters">
        <select data-filter="challenge">
          ${["전체", "블로그", "유튜브", "틱톡", "기타"].map((item) => `<option ${filters.challenge === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </div>
      ${challengeList(filtered)}
    </section>
  `;
}

function challengeList(challenges, compact = false) {
  if (!challenges.length) return emptyState("표시할 챌린지가 없습니다.", "운영자가 공개한 챌린지가 여기에 표시됩니다.");
  return `<div class="challenge-grid ${compact ? "compact" : ""}">
    ${challenges.map((challenge) => challengeCard(challenge)).join("")}
  </div>`;
}

function challengeCard(challenge) {
  const participants = state.participants.filter((row) => row.challengeId === challenge.id);
  const joined = participantFor(challenge.id);
  return `
    <article class="challenge-card">
      <div class="cover">${platformBadge(challenge.platformType)}</div>
      <div class="card-body">
        <div class="card-title">
          <h3>${escapeHtml(challenge.title)}</h3>
          ${badge("challenge", challenge.status)}
        </div>
        <p>${escapeHtml(challenge.description)}</p>
        <div class="meta">
          <span>모집 ${formatDate(challenge.recruitStartAt)} ~ ${formatDate(challenge.recruitEndAt)}</span>
          <span>진행 ${formatDate(challenge.challengeStartAt)} ~ ${formatDate(challenge.challengeEndAt)}</span>
          <span>참가 ${participants.length}/${challenge.maxParticipants}명</span>
          <span>성공 기준 ${challenge.requiredApprovalCount}/${challenge.totalMissionCount} 승인</span>
          <span>${escapeHtml(challenge.entryFeeLabel || "무료")}</span>
        </div>
        <div class="card-actions">
          <button class="btn ghost" data-detail="${challenge.id}">상세</button>
          ${
            currentUser().role === "participant"
              ? joined
                ? `<button class="btn" data-open-my="${challenge.id}">내 상태</button>`
                : `<button class="btn primary" data-join="${challenge.id}" ${canJoin(challenge) ? "" : "disabled"}>참가 신청</button>`
              : `<button class="btn primary" data-edit-challenge="${challenge.id}">관리</button>`
          }
        </div>
      </div>
    </article>
  `;
}

function canJoin(challenge) {
  const count = state.participants.filter((row) => row.challengeId === challenge.id).length;
  return challenge.status === "RECRUITING" && count < Number(challenge.maxParticipants || 0) && canAcceptParticipant(challenge);
}

function renderMyChallenges() {
  const rows = state.participants.filter((participant) => participant.userId === currentUser().id);
  return `
    ${pageHeader("내 챌린지", "참가 상태, 진행률, 제출 이력과 랭킹을 확인합니다.")}
    <section class="section">
      ${
        rows.length
          ? `<div class="my-list">${rows.map((participant) => myChallengeCard(participant)).join("")}</div>`
          : emptyState("참가 중인 챌린지가 없습니다.", "챌린지 탐색에서 모집 중인 챌린지에 참가 신청하세요.")
      }
    </section>
  `;
}

function myChallengeCard(participant) {
  const challenge = challengeById(participant.challengeId);
  const progress = progressForParticipant(participant);
  const myRank = rankings(challenge.id).find((row) => row.id === participant.id)?.rank || "-";
  return `
    <article class="my-card">
      <div>
        <h3>${escapeHtml(challenge.title)}</h3>
        <div class="meta">
          ${badge("participant", participant.participantStatus)}
          ${badge("payment", participant.paymentStatus)}
          <span>현재 순위 ${myRank}위</span>
        </div>
        ${progressBar(progress)}
        <div class="payment-line">
          <span>${paymentProofSummary(participant)}</span>
          ${participant.paymentStatus === "PENDING_PAYMENT" ? `<button class="btn ghost" data-payment-proof="${participant.id}">입금 정보 제출</button>` : ""}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn primary" data-submit="${participant.id}" ${participant.paymentStatus === "PAID" ? "" : "disabled"}>미션 제출</button>
        <button class="btn ghost" data-history="${participant.id}">제출 이력</button>
        <button class="btn ghost" data-new-dispute="${participant.id}">이의 신청</button>
      </div>
    </article>
  `;
}

function progressBar(progress) {
  return `
    <div class="progress-block">
      <div class="progress-text">
        <strong>${progress.approved}/${progress.total} 승인</strong>
        <span>성공 기준 ${progress.required}개 · ${progress.success ? "성공 가능" : `${Math.max(0, progress.required - progress.approved)}개 남음`}</span>
      </div>
      <div class="progress"><i style="width:${progress.percent}%"></i></div>
    </div>
  `;
}

function renderManage() {
  const challenges = currentUser().role === "admin" ? state.challenges : state.challenges.filter((challenge) => challenge.organizerId === currentUser().id);
  return `
    ${pageHeader("챌린지 관리", "챌린지를 생성하고 공개 상태와 운영 조건을 관리합니다.", `<button class="btn primary" data-action="new-challenge">챌린지 만들기</button>`)}
    <section class="section">
      ${challengeAdminTable(challenges)}
    </section>
  `;
}

function challengeAdminTable(challenges) {
  if (!challenges.length) return emptyState("생성한 챌린지가 없습니다.", "새 챌린지를 만들어 MVP 운영을 시작하세요.");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>챌린지</th><th>플랫폼</th><th>상태</th><th>참가</th><th>성공 기준</th><th>공개</th><th>액션</th></tr></thead>
        <tbody>
          ${challenges
            .map((challenge) => {
              const count = state.participants.filter((row) => row.challengeId === challenge.id).length;
              return `
                <tr>
                  <td><strong>${escapeHtml(challenge.title)}</strong><small>${formatDate(challenge.challengeStartAt)} ~ ${formatDate(challenge.challengeEndAt)}</small></td>
                  <td>${platformBadge(challenge.platformType)}</td>
                  <td>${badge("challenge", challenge.status)}</td>
                  <td>${count}/${challenge.maxParticipants}</td>
                  <td>${challenge.requiredApprovalCount}/${challenge.totalMissionCount}</td>
                  <td>${challenge.isPublic ? "공개" : "비공개"}</td>
                  <td class="row-actions">
                    <button class="btn ghost" data-edit-challenge="${challenge.id}">수정</button>
                    <button class="btn ghost" data-focus-challenge="${challenge.id}" data-nav="participants">참가자</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderParticipantManage() {
  const challenge = selectedOwnedChallenge();
  return `
    ${pageHeader("참가자 관리", "참가 신청자와 결제 상태를 수동으로 관리합니다.")}
    ${ownerChallengePicker("participants")}
    <section class="section">
      ${challenge ? participantFilters() : ""}
      ${challenge ? participantTable(challenge.id) : emptyState("관리할 챌린지가 없습니다.", "먼저 챌린지를 생성하세요.")}
      ${challenge ? `<div class="footer-actions"><button class="btn ghost" data-download-csv="${challenge.id}" data-csv-type="participants">참가자 CSV</button></div>` : ""}
    </section>
  `;
}

function participantFilters() {
  return `
    <div class="filters">
      <select data-filter="participantPayment">
        ${[
          ["ALL", "전체 결제 상태"],
          ["PENDING_PAYMENT", "결제 대기"],
          ["PAID", "결제 완료"],
          ["REFUNDED", "환불 완료"],
          ["CANCELED", "결제 취소"],
        ]
          .map(([value, label]) => `<option value="${value}" ${filters.participantPayment === value ? "selected" : ""}>${label}</option>`)
          .join("")}
      </select>
      <input data-filter-input="participantSearch" value="${escapeHtml(filters.participantSearch)}" placeholder="참가자, 이메일, 입금자 검색" />
    </div>
  `;
}

function selectedOwnedChallenge() {
  const challenges = currentUser().role === "admin" ? state.challenges : state.challenges.filter((challenge) => challenge.organizerId === currentUser().id);
  if (!challenges.length) return null;
  const selected = form.selectedChallengeId && challenges.find((challenge) => challenge.id === form.selectedChallengeId);
  return selected || challenges[0];
}

function ownerChallengePicker(page) {
  const challenges = currentUser().role === "admin" ? state.challenges : state.challenges.filter((challenge) => challenge.organizerId === currentUser().id);
  if (!challenges.length) return "";
  const selected = selectedOwnedChallenge();
  return `
    <div class="picker">
      <label>챌린지 선택
        <select data-select-challenge data-page="${page}">
          ${challenges.map((challenge) => `<option value="${challenge.id}" ${challenge.id === selected.id ? "selected" : ""}>${challenge.title}</option>`).join("")}
        </select>
      </label>
    </div>
  `;
}

function participantTable(challengeId) {
  const allRows = state.participants.filter((participant) => participant.challengeId === challengeId);
  if (!allRows.length) return emptyState("참가자가 없습니다.", "참가자가 신청하면 이곳에서 결제 상태를 수동 변경할 수 있습니다.");
  const rows = allRows.filter((participant) => {
    const user = state.users.find((row) => row.id === participant.userId) || {};
    const proof = participant.paymentProof || {};
    const paymentMatches = filters.participantPayment === "ALL" || participant.paymentStatus === filters.participantPayment;
    const searchMatches = includesSearch([user.name, user.nickname, user.email, proof.payerName, proof.reference], filters.participantSearch);
    return paymentMatches && searchMatches;
  });
  if (!rows.length) return emptyState("조건에 맞는 참가자가 없습니다.", "검색어 또는 결제 상태 필터를 조정하세요.");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>참가자</th><th>참가 상태</th><th>결제 상태</th><th>입금 정보</th><th>진행률</th><th>승인/반려</th><th>액션</th></tr></thead>
        <tbody>
          ${rows
            .map((participant) => {
              const progress = progressForParticipant(participant);
              return `
                <tr>
                  <td><strong>${userName(participant.userId)}</strong><small>${state.users.find((user) => user.id === participant.userId)?.email || ""}</small></td>
                  <td>${badge("participant", participant.participantStatus)}</td>
                  <td>${badge("payment", participant.paymentStatus)}</td>
                  <td>${paymentProofDetail(participant)}</td>
                  <td>${progress.approved}/${progress.total}</td>
                  <td>${progress.approved} / ${rejectedCount(participant.id)}</td>
                  <td class="row-actions">
                    <button class="btn success" data-pay="${participant.id}" ${participant.paymentStatus === "PAID" ? "disabled" : ""}>결제 완료</button>
                    <button class="btn ghost" data-refund="${participant.id}">환불 처리</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSubmissionReview() {
  const challenge = selectedOwnedChallenge();
  const submissions = challenge
    ? state.submissions.filter((submission) => {
        const participant = participantById(submission.participantId);
        const user = state.users.find((row) => row.id === participant?.userId) || {};
        const statusMatches = filters.submission === "ALL" || submission.status === filters.submission;
        const searchMatches = includesSearch([submission.title, submission.contentUrl, submission.platformAccount, submission.hashtags, user.name, user.nickname, user.email], filters.submissionSearch);
        return submission.challengeId === challenge.id && statusMatches && searchMatches;
      })
    : [];
  return `
    ${pageHeader("제출물 검수", "링크, 이미지, 설명을 확인하고 승인·반려·보완 요청을 처리합니다.")}
    ${ownerChallengePicker("submissions")}
    <section class="section">
      <div class="filters">
        <select data-filter="submission">
          ${[
            ["SUBMITTED", "검수 대기"],
            ["NEEDS_REVISION", "보완 요청"],
            ["APPROVED", "승인"],
            ["REJECTED", "반려"],
            ["ALL", "전체"],
          ]
            .map(([value, label]) => `<option value="${value}" ${filters.submission === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
        <input data-filter-input="submissionSearch" value="${escapeHtml(filters.submissionSearch)}" placeholder="제출물, 참가자, 링크 검색" />
      </div>
      ${!submissions.length ? "" : `<div class="bulk-actions"><button class="btn success" data-bulk-approve>선택 승인</button><small>검수 대기 또는 보완 요청 상태만 선택할 수 있습니다.</small></div>`}
      ${submissionTable(submissions)}
      ${challenge ? `<div class="footer-actions"><button class="btn ghost" data-download-csv="${challenge.id}" data-csv-type="submissions">제출물 CSV</button></div>` : ""}
    </section>
  `;
}

function submissionTable(submissions, compact = false) {
  if (!submissions.length) return emptyState("제출물이 없습니다.", "검수할 제출물이 생기면 여기에 표시됩니다.");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${compact ? "" : "<th>선택</th>"}<th>제출물</th><th>참가자</th><th>상태</th><th>링크</th><th>이미지</th><th>제출일</th>${compact ? "" : "<th>액션</th>"}</tr></thead>
        <tbody>
          ${submissions
            .map((submission) => {
              const participant = participantById(submission.participantId);
              const challenge = challengeById(submission.challengeId);
              const canBulkApprove = ["SUBMITTED", "NEEDS_REVISION"].includes(submission.status);
              return `
                <tr>
                  ${compact ? "" : `<td><input type="checkbox" data-bulk-submission="${submission.id}" ${canBulkApprove ? "" : "disabled"} /></td>`}
                  <td><strong>${escapeHtml(submission.title)}</strong><small>${escapeHtml(challenge?.title || "")} · 미션 ${submission.missionNumber}</small></td>
                  <td>${userName(participant?.userId)}</td>
                  <td>${badge("submission", submission.status)}</td>
                  <td>${submission.contentUrl ? `<a href="${escapeHtml(submission.contentUrl)}" target="_blank" rel="noreferrer">링크 열기</a>` : "-"}</td>
                  <td>${submissionImageHtml(submission, true)}</td>
                  <td>${formatDate(submission.submittedAt)}</td>
                  ${
                    compact
                      ? ""
                      : `<td class="row-actions">
                          <button class="btn success" data-review="${submission.id}" data-status="APPROVED">승인</button>
                          <button class="btn warn" data-review="${submission.id}" data-status="NEEDS_REVISION">보완</button>
                          <button class="btn danger" data-review="${submission.id}" data-status="REJECTED">반려</button>
                        </td>`
                  }
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRankingManage() {
  const challenge = selectedOwnedChallenge();
  const rows = challenge ? rankings(challenge.id) : [];
  return `
    ${pageHeader("랭킹 관리", "승인 수, 마지막 승인 시각, 반려 수, 참가 신청 시각 기준으로 랭킹을 계산합니다.")}
    ${ownerChallengePicker("rankings")}
    <section class="section">
      <div class="notice">랭킹 확정 후 일반 검수 변경은 제한됩니다. 이 화면은 MVP의 성공자 확정 기준입니다.</div>
      ${rankingTable(rows)}
      ${challenge ? `<div class="footer-actions"><button class="btn primary" data-lock-ranking="${challenge.id}">랭킹 확정</button></div>` : ""}
    </section>
  `;
}

function rankingTable(rows) {
  if (!rows.length) return emptyState("랭킹 대상자가 없습니다.", "참가자가 생기면 랭킹이 계산됩니다.");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>순위</th><th>참가자</th><th>성공 여부</th><th>승인 수</th><th>반려 수</th><th>마지막 승인</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td><strong>${row.rank}</strong></td>
                  <td>${userName(row.userId)}</td>
                  <td>${row.progress.success ? badge("participant", "SUCCEEDED") : badge("participant", "FAILED")}</td>
                  <td>${row.progress.approved}/${row.progress.total}</td>
                  <td>${row.rejected}</td>
                  <td>${formatDate(row.lastApproved)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPayouts() {
  const challenge = selectedOwnedChallenge();
  return `
    ${pageHeader("정산 보조", "실제 송금이 아닌 지급 대상자와 지급 상태를 관리하는 화면입니다.")}
    ${ownerChallengePicker("payouts")}
    <section class="section">
      <div class="notice">본 화면은 실제 송금 기능이 아닙니다. 외부 절차로 지급 후 상태만 업데이트하세요.</div>
      ${challenge ? payoutTable(challenge.id) : emptyState("정산할 챌린지가 없습니다.", "랭킹 확정 후 지급 대상자를 생성합니다.")}
    </section>
  `;
}

function payoutTable(challengeId) {
  const rows = state.payouts.filter((payout) => payout.challengeId === challengeId);
  if (!rows.length) {
    return `
      ${emptyState("지급 대상자가 없습니다.", "랭킹 확정 후 지급 대상자를 생성하세요.")}
      <div class="footer-actions"><button class="btn primary" data-generate-payouts="${challengeId}">지급 대상자 생성</button></div>
    `;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>참가자</th><th>순위</th><th>결과</th><th>지급 예정액</th><th>지급 상태</th><th>메모</th><th>액션</th></tr></thead>
        <tbody>
          ${rows
            .map((payout) => {
              const participant = participantById(payout.participantId);
              return `
                <tr>
                  <td>${userName(participant?.userId)}</td>
                  <td>${participant?.finalRank || "-"}</td>
                  <td>${participant?.finalResult === "SUCCEEDED" ? "성공" : "실패"}</td>
                  <td><input class="inline-input" value="${payout.expectedAmount || ""}" data-payout-amount="${payout.id}" placeholder="직접 입력" /></td>
                  <td>${badge("payout", payout.payoutStatus)}</td>
                  <td><input class="inline-input" value="${escapeHtml(payout.payoutMemo || "")}" data-payout-memo="${payout.id}" placeholder="메모" /></td>
                  <td class="row-actions">
                    <button class="btn ghost" data-payout-status="${payout.id}" data-status="HOLD">보류</button>
                    <button class="btn success" data-payout-status="${payout.id}" data-status="PAID">완료</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="footer-actions">
      <button class="btn ghost" data-generate-payouts="${challengeId}">대상자 다시 생성</button>
      <button class="btn primary" data-download-csv="${challengeId}" data-csv-type="payouts">정산 CSV</button>
    </div>
  `;
}

function renderDisputes() {
  const rows =
    currentUser().role === "participant"
      ? state.disputes.filter((row) => row.userId === currentUser().id)
      : currentUser().role === "admin"
        ? state.disputes
        : state.disputes.filter((row) => isOwner(challengeById(row.challengeId)));
  return `
    ${pageHeader("이의 신청", "반려, 랭킹, 지급 상태에 대한 이의 신청을 접수하고 답변합니다.", currentUser().role === "participant" ? `<button class="btn primary" data-new-dispute>이의 신청하기</button>` : "")}
    <section class="section">
      ${rows.length ? disputeTable(rows) : emptyState("이의 신청이 없습니다.", currentUser().role === "participant" ? "필요한 경우 이의 신청을 접수하세요." : "참가자가 이의 신청을 접수하면 이곳에 표시됩니다.")}
    </section>
  `;
}

function disputeTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>유형</th><th>챌린지</th><th>신청자</th><th>상태</th><th>사유</th><th>답변</th><th>액션</th></tr></thead>
        <tbody>
          ${rows
            .map((row) => {
              const challenge = challengeById(row.challengeId);
              return `
                <tr>
                  <td>${escapeHtml(row.type)}</td>
                  <td><strong>${escapeHtml(challenge?.title || "-")}</strong><small>${formatDate(row.createdAt)}</small></td>
                  <td>${userName(row.userId)}</td>
                  <td>${badge("dispute", row.status)}</td>
                  <td><small>${escapeHtml(row.reason)}</small></td>
                  <td><small>${escapeHtml(row.response || "-")}</small></td>
                  <td class="row-actions">
                    ${
                      currentUser().role === "participant"
                        ? "-"
                        : `<button class="btn ghost" data-answer-dispute="${row.id}" data-status="REVIEWING">검토</button>
                           <button class="btn success" data-answer-dispute="${row.id}" data-status="RESOLVED">완료</button>
                           <button class="btn danger" data-answer-dispute="${row.id}" data-status="REJECTED">기각</button>`
                    }
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderNotifications() {
  const rows = state.notifications.filter((row) => row.userId === currentUser().id);
  return `
    ${pageHeader("알림", "참가 신청, 결제 확인, 검수 결과, 랭킹 확정, 지급 상태 변경을 확인합니다.", rows.length ? `<button class="btn ghost" data-mark-read>모두 읽음</button>` : "")}
    <section class="section">
      ${
        rows.length
          ? `<div class="notification-list">
              ${rows
                .map(
                  (row) => `
                    <article class="notification ${row.read ? "read" : "unread"}">
                      <div>
                        <strong>${escapeHtml(row.title)}</strong>
                        <p>${escapeHtml(row.message)}</p>
                        <small>${formatDate(row.createdAt)}</small>
                      </div>
                      ${row.link ? `<button class="btn ghost" data-nav="${row.link}">이동</button>` : ""}
                    </article>
                  `
                )
                .join("")}
            </div>`
          : emptyState("알림이 없습니다.", "상태 변경이 발생하면 알림이 표시됩니다.")
      }
    </section>
  `;
}

function renderPlanAdmin() {
  const operators = state.users.filter((user) => user.role !== "participant");
  return `
    ${pageHeader("플랜 관리", "운영자 플랜을 수동으로 변경하고 사용량을 확인합니다.")}
    <section class="section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>사용자</th><th>역할</th><th>현재 플랜</th><th>사용량</th><th>플랜 변경</th></tr></thead>
          <tbody>
            ${operators
              .map((user) => {
                const usage = usageFor(user.id);
                const plan = planFor(user);
                return `
                  <tr>
                    <td><strong>${escapeHtml(user.nickname)}</strong><small>${escapeHtml(user.email)}</small></td>
                    <td>${roleLabel(user.role)}</td>
                    <td>${user.plan}</td>
                    <td>${usage.challenges}/${plan.challengeLimit === 999 ? "∞" : plan.challengeLimit} 챌린지 · ${usage.participants}/${plan.participantLimit === 9999 ? "∞" : plan.participantLimit} 참가자</td>
                    <td>
                      <select data-user-plan="${user.id}">
                        ${state.plans.map((planRow) => `<option value="${planRow.name}" ${planRow.name === user.plan ? "selected" : ""}>${planRow.name}</option>`).join("")}
                      </select>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <div>
          <h2>데이터 관리</h2>
          <p>JSON DB를 백업하거나 백업 파일로 복원합니다. 복원은 현재 데이터를 교체합니다.</p>
        </div>
      </div>
      <div class="data-tools">
        <button class="btn primary" data-backup-db>DB 백업 다운로드</button>
        <label class="btn ghost file-btn">DB 복원 파일 선택<input type="file" accept="application/json,.json" data-restore-db /></label>
      </div>
    </section>
  `;
}

function renderPricing() {
  const usage = usageFor(currentUser().id);
  const currentPlan = planFor();
  return `
    ${pageHeader("요금제", "MVP에서는 실제 결제 대신 문의와 관리자 수동 플랜 변경으로 유료 의향을 검증합니다.")}
    <section class="section">
      <h2>현재 사용량</h2>
      <div class="usage-grid">
        ${stat("현재 플랜", currentUser().plan || "Free")}
        ${stat("챌린지 사용량", `${usage.challenges}/${currentPlan.challengeLimit === 999 ? "무제한" : currentPlan.challengeLimit}`)}
        ${stat("참가자 사용량", `${usage.participants}/${currentPlan.participantLimit === 9999 ? "대량" : currentPlan.participantLimit}`)}
      </div>
    </section>
    <section class="section">
      <div class="pricing-grid">
        ${state.plans
          .map(
            (plan) => `
              <article class="price-card ${currentUser().plan === plan.name ? "current" : ""}">
                <h3>${plan.name}</h3>
                <strong>${plan.price}</strong>
                <ul>
                  <li>챌린지 ${plan.challengeLimit === 999 ? "무제한" : `${plan.challengeLimit}개`}</li>
                  <li>참가자 ${plan.participantLimit === 9999 ? "대량 운영" : `${plan.participantLimit}명`}</li>
                  <li>CSV 다운로드 ${plan.csv ? "가능" : "제한"}</li>
                  <li>브랜드 리포트 ${plan.report ? "포함" : "미포함"}</li>
                </ul>
                <button class="btn ${currentUser().plan === plan.name ? "ghost" : "primary"}" data-plan-inquiry="${plan.name}">${currentUser().plan === plan.name ? "현재 플랜" : "업그레이드 문의"}</button>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="section">
      <h2>브랜드 캠페인 문의</h2>
      ${inquiryForm()}
    </section>
  `;
}

function inquiryForm(plan = "") {
  return `
    <form class="form" data-form="inquiry">
      <label>회사명<input name="company" required placeholder="예: ABC 브랜드" /></label>
      <label>담당자명<input name="manager" required placeholder="담당자명" /></label>
      <label>이메일<input name="email" required type="email" value="${currentUser().email}" /></label>
      <label>희망 플랜<input name="plan" value="${plan}" placeholder="Starter, Pro, Campaign" /></label>
      <label>희망 플랫폼<select name="platform"><option>블로그</option><option>유튜브</option><option>틱톡</option><option>복합</option></select></label>
      <label>예상 참가자 수<input name="participants" type="number" min="1" placeholder="100" /></label>
      <label class="full">문의 내용<textarea name="message" placeholder="운영하려는 챌린지와 필요한 지원을 적어주세요."></textarea></label>
      <div class="full form-actions"><button class="btn primary">문의 접수</button></div>
    </form>
  `;
}

function renderInquiries() {
  return `
    ${pageHeader("캠페인 문의", "요금제와 브랜드 캠페인 문의를 확인합니다.")}
    <section class="section">
      ${state.inquiries.length ? inquiryTable() : emptyState("접수된 문의가 없습니다.", "요금제 또는 캠페인 문의가 접수되면 이곳에 표시됩니다.")}
    </section>
  `;
}

function inquiryTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>회사</th><th>담당자</th><th>이메일</th><th>플랜</th><th>플랫폼</th><th>참가자</th><th>접수일</th></tr></thead>
        <tbody>${state.inquiries
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.company)}</td>
                <td>${escapeHtml(row.manager)}</td>
                <td>${escapeHtml(row.email)}</td>
                <td>${escapeHtml(row.plan || "-")}</td>
                <td>${escapeHtml(row.platform)}</td>
                <td>${escapeHtml(row.participants || "-")}</td>
                <td>${formatDate(row.createdAt)}</td>
              </tr>
            `
          )
          .join("")}</tbody>
      </table>
    </div>
  `;
}

function renderLogs() {
  const logs = currentUser().role === "admin" ? state.auditLogs : state.auditLogs.filter((log) => log.actorId === currentUser().id || myChallenges().some((challenge) => challenge.id === log.targetId));
  return `
    ${pageHeader("운영 로그", "상태 변경과 주요 운영 액션을 추적합니다.")}
    <section class="section">
      ${
        logs.length
          ? `<div class="table-wrap"><table><thead><tr><th>일시</th><th>작업자</th><th>액션</th><th>대상</th><th>변경</th></tr></thead><tbody>
              ${logs
                .map(
                  (log) => `
                    <tr>
                      <td>${formatDate(log.createdAt)}</td>
                      <td>${userName(log.actorId)}</td>
                      <td>${escapeHtml(log.action)}</td>
                      <td>${escapeHtml(log.targetType)} · ${escapeHtml(log.targetId)}</td>
                      <td><small>${escapeHtml(log.beforeValue || "-")} -> ${escapeHtml(log.afterValue || "-")}</small></td>
                    </tr>
                  `
                )
                .join("")}
            </tbody></table></div>`
          : emptyState("로그가 없습니다.", "상태 변경 작업을 하면 로그가 남습니다.")
      }
    </section>
  `;
}

function emptyState(title, desc) {
  return `<div class="empty"><strong>${title}</strong><span>${desc}</span></div>`;
}

function openChallengeForm(id = "") {
  if (!id && !canCreateChallenge()) {
    const plan = planFor();
    alert(`${plan.name} 플랜에서는 챌린지를 ${plan.challengeLimit}개까지 만들 수 있습니다. 요금제 업그레이드를 문의하세요.`);
    state.active = "pricing";
    render();
    return;
  }
  const challenge = id ? challengeById(id) : null;
  form.modal = "challenge";
  form.challenge = challenge
    ? structuredClone(challenge)
    : {
        id: "",
        organizerId: currentUser().id,
        title: "",
        description: "",
        platformType: "블로그",
        coverImage: "",
        recruitStartAt: today(),
        recruitEndAt: today(),
        challengeStartAt: today(),
        challengeEndAt: today(),
        maxParticipants: 10,
        entryFeeLabel: "무료",
        rewardType: "무료 참가 + 운영자 고정 리워드",
        rewardDescription: "",
        totalMissionCount: 7,
        requiredApprovalCount: 5,
        submissionGuide: "",
        reviewGuide: "",
        refundPolicy: "",
        requiresAdDisclosure: false,
        status: "DRAFT",
        isPublic: false,
        rankingLockedAt: "",
        createdAt: today(),
      };
  render();
}

function renderModal() {
  if (!form.modal) return "";
  if (form.modal === "challenge") return challengeModal();
  if (form.modal === "detail") return detailModal();
  if (form.modal === "join") return joinModal();
  if (form.modal === "paymentProof") return paymentProofModal();
  if (form.modal === "submit") return submitModal();
  if (form.modal === "history") return historyModal();
  if (form.modal === "review") return reviewModal();
  if (form.modal === "dispute") return disputeModal();
  if (form.modal === "answerDispute") return answerDisputeModal();
  return "";
}

function modalShell(title, body, actions = "") {
  return `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head">
          <h2>${title}</h2>
          <button class="icon-btn" data-close-modal>×</button>
        </div>
        ${body}
        ${actions ? `<div class="modal-actions">${actions}</div>` : ""}
      </div>
    </div>
  `;
}

function challengeModal() {
  const c = form.challenge;
  return modalShell(
    c.id ? "챌린지 수정" : "챌린지 만들기",
    `
      <form class="form" data-form="challenge">
        <label class="full">제목<input name="title" required value="${escapeHtml(c.title)}" /></label>
        <label class="full">설명<textarea name="description" required>${escapeHtml(c.description)}</textarea></label>
        <label>플랫폼<select name="platformType">${["블로그", "유튜브", "틱톡", "기타"].map((item) => `<option ${c.platformType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label>상태<select name="status">${Object.entries(STATUS.challenge).map(([value, label]) => `<option value="${value}" ${c.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>모집 시작<input name="recruitStartAt" type="date" required value="${c.recruitStartAt}" /></label>
        <label>모집 종료<input name="recruitEndAt" type="date" required value="${c.recruitEndAt}" /></label>
        <label>진행 시작<input name="challengeStartAt" type="date" required value="${c.challengeStartAt}" /></label>
        <label>진행 종료<input name="challengeEndAt" type="date" required value="${c.challengeEndAt}" /></label>
        <label>최대 참가자<input name="maxParticipants" type="number" min="1" required value="${c.maxParticipants}" /></label>
        <label>참가비 표시<input name="entryFeeLabel" value="${escapeHtml(c.entryFeeLabel)}" /></label>
        <label>총 미션 수<input name="totalMissionCount" type="number" min="1" required value="${c.totalMissionCount}" /></label>
        <label>최소 승인 수<input name="requiredApprovalCount" type="number" min="1" required value="${c.requiredApprovalCount}" /></label>
        <label class="full">보상 방식<select name="rewardType">${["무료 참가 + 운영자 고정 리워드", "유료 참가 + 보증금 환급형", "유료 참가 + 운영자 별도 리워드", "기타 수동 정산"].map((item) => `<option ${c.rewardType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label class="full">보상 설명<textarea name="rewardDescription">${escapeHtml(c.rewardDescription || "")}</textarea></label>
        <label class="full">제출 가이드<textarea name="submissionGuide" required>${escapeHtml(c.submissionGuide || "")}</textarea></label>
        <label class="full">검수 기준<textarea name="reviewGuide" required>${escapeHtml(c.reviewGuide || "")}</textarea></label>
        <label class="full">환불 정책<textarea name="refundPolicy" required>${escapeHtml(c.refundPolicy || "")}</textarea></label>
        <label class="check"><input name="requiresAdDisclosure" type="checkbox" ${c.requiresAdDisclosure ? "checked" : ""} /> 광고 표시 확인 필요</label>
        <label class="check"><input name="isPublic" type="checkbox" ${c.isPublic ? "checked" : ""} /> 공개</label>
        <div class="full notice">MVP에서는 실제 결제와 자동 지급을 제공하지 않습니다. 참가비와 보상은 운영 참고 정보로 표시됩니다.</div>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-save-challenge>저장</button>`
  );
}

function detailModal() {
  const c = challengeById(form.detailId);
  if (!c) return "";
  return modalShell(
    "챌린지 상세",
    `
      <div class="detail">
        <div class="detail-title">${platformBadge(c.platformType)} ${badge("challenge", c.status)}</div>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description)}</p>
        <dl>
          <dt>모집 기간</dt><dd>${formatDate(c.recruitStartAt)} ~ ${formatDate(c.recruitEndAt)}</dd>
          <dt>진행 기간</dt><dd>${formatDate(c.challengeStartAt)} ~ ${formatDate(c.challengeEndAt)}</dd>
          <dt>성공 기준</dt><dd>${c.requiredApprovalCount}/${c.totalMissionCount}개 승인</dd>
          <dt>제출 방법</dt><dd>${escapeHtml(c.submissionGuide)}</dd>
          <dt>검수 기준</dt><dd>${escapeHtml(c.reviewGuide)}</dd>
          <dt>보상 방식</dt><dd>${escapeHtml(c.rewardType)} · ${escapeHtml(c.rewardDescription || "운영자 확인 후 지급 상태가 업데이트됩니다.")}</dd>
          <dt>환불 정책</dt><dd>${escapeHtml(c.refundPolicy)}</dd>
          <dt>광고 표시</dt><dd>${c.requiresAdDisclosure ? "경제적 이해관계 표시 확인이 필요합니다." : "필수 아님"}</dd>
        </dl>
      </div>
    `,
    currentUser().role === "participant" && !participantFor(c.id)
      ? `<button class="btn ghost" data-close-modal>닫기</button><button class="btn primary" data-join="${c.id}">참가 신청</button>`
      : `<button class="btn primary" data-close-modal>확인</button>`
  );
}

function joinModal() {
  const c = challengeById(form.joinId);
  return modalShell(
    "참가 신청 확인",
    `
      <div class="detail">
        <h3>${escapeHtml(c.title)}</h3>
        <p>성공 기준: ${c.requiredApprovalCount}/${c.totalMissionCount}개 승인</p>
        <p>보상 방식: ${escapeHtml(c.rewardType)}</p>
        <p>환불 정책: ${escapeHtml(c.refundPolicy)}</p>
      </div>
      <form class="checks" data-form="join">
        <label><input type="checkbox" name="terms" required /> 챌린지 조건을 확인했습니다.</label>
        <label><input type="checkbox" name="refund" required /> 환불 정책을 확인했습니다.</label>
        <label><input type="checkbox" name="privacy" required /> 개인정보 수집 및 이용에 동의합니다.</label>
        <label><input type="checkbox" name="ad" required /> 광고 표시 안내를 확인했습니다.</label>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-confirm-join="${c.id}">참가 신청</button>`
  );
}

function paymentProofModal() {
  const participant = participantById(form.paymentProofParticipantId);
  const challenge = challengeById(participant.challengeId);
  const proof = participant.paymentProof || {};
  return modalShell(
    "입금 정보 제출",
    `
      <div class="detail">
        <h3>${escapeHtml(challenge.title)}</h3>
        <p>실제 결제 연동 전까지 운영자가 외부 입금 내역을 확인할 수 있도록 참고 정보만 제출합니다.</p>
      </div>
      <form class="form" data-form="payment-proof">
        <label>입금자명<input name="payerName" required value="${escapeHtml(proof.payerName || currentUser().name || "")}" /></label>
        <label>입금액<input name="amount" required inputmode="numeric" placeholder="예: 10000" value="${escapeHtml(proof.amount || "")}" /></label>
        <label class="full">참고번호/거래 메모<input name="reference" placeholder="은행 앱 표시 문구, 거래번호 등" value="${escapeHtml(proof.reference || "")}" /></label>
        <label class="full">운영자에게 남길 메모<textarea name="memo" placeholder="입금 시간, 입금 계좌명 등 운영자가 확인할 수 있는 범위만 적어주세요.">${escapeHtml(proof.memo || "")}</textarea></label>
        <div class="full notice">계좌번호, 주민등록번호, 카드번호 같은 민감 정보는 입력하지 마세요.</div>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-save-payment-proof="${participant.id}">저장</button>`
  );
}

function submitModal() {
  const participant = participantById(form.submitParticipantId);
  const challenge = challengeById(participant.challengeId);
  return modalShell(
    "미션 제출",
    `
      <form class="form" data-form="submission">
        <label>미션 번호<input name="missionNumber" type="number" min="1" max="${challenge.totalMissionCount}" required value="1" /></label>
        <label>제출 제목<input name="title" required placeholder="예: 1일차 인증" /></label>
        <label class="full">콘텐츠 URL<input name="contentUrl" placeholder="https://..." /></label>
        <label>플랫폼 계정명<input name="platformAccount" placeholder="계정명 또는 채널명" /></label>
        <label>해시태그<input name="hashtags" placeholder="#챌린지 #브랜드" /></label>
        <label class="full">설명<textarea name="description" placeholder="제출 내용을 설명하세요."></textarea></label>
        <label class="full">인증 이미지<input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" /></label>
        <div class="full upload-note">JPG, PNG, WEBP 이미지를 10MB 이하로 업로드할 수 있습니다. 링크만 제출하는 것도 가능합니다.</div>
        <div class="full checks">
          <label><input type="checkbox" required /> 챌린지 기간 내 작성한 콘텐츠입니다.</label>
          <label><input type="checkbox" required /> 링크가 공개 상태입니다.</label>
          <label><input type="checkbox" required /> 필수 해시태그 또는 문구를 확인했습니다.</label>
          ${challenge.requiresAdDisclosure ? `<label><input type="checkbox" required /> 광고 표시 문구를 확인했습니다.</label>` : ""}
        </div>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-save-submission="${participant.id}">제출하기</button>`
  );
}

function historyModal() {
  const participant = participantById(form.historyParticipantId);
  const rows = state.submissions.filter((submission) => submission.participantId === participant.id);
  return modalShell(
    "제출 이력",
    rows.length
      ? `<div class="submission-cards">${rows
          .map(
            (submission) => `
              <article class="submission-card">
                <div><strong>${escapeHtml(submission.title)}</strong>${badge("submission", submission.status)}</div>
                <p>${escapeHtml(submission.description || "-")}</p>
                <div>${submissionImageHtml(submission)}</div>
                <small>미션 ${submission.missionNumber} · ${formatDate(submission.submittedAt)} · ${escapeHtml(submission.reviewReason || "")}</small>
                ${submission.status === "REJECTED" || submission.status === "NEEDS_REVISION" ? `<button class="btn ghost" data-new-dispute="${participant.id}" data-submission-id="${submission.id}">이의 신청</button>` : ""}
              </article>
            `
          )
          .join("")}</div>`
      : emptyState("제출 이력이 없습니다.", "미션을 제출하면 이곳에 표시됩니다."),
    `<button class="btn primary" data-close-modal>확인</button>`
  );
}

function disputeModal() {
  const participant = participantById(form.disputeParticipantId) || state.participants.find((row) => row.userId === currentUser().id);
  const challenge = participant ? challengeById(participant.challengeId) : null;
  const submissions = participant ? state.submissions.filter((row) => row.participantId === participant.id) : [];
  return modalShell(
    "이의 신청",
    `
      <form class="form" data-form="dispute">
        <label>챌린지<input value="${escapeHtml(challenge?.title || "-")}" disabled /></label>
        <label>유형<select name="type"><option>제출물 반려 이의</option><option>랭킹 이의</option><option>지급 상태 이의</option></select></label>
        <label class="full">관련 제출물<select name="submissionId"><option value="">선택 안 함</option>${submissions.map((submission) => `<option value="${submission.id}" ${submission.id === form.disputeSubmissionId ? "selected" : ""}>미션 ${submission.missionNumber} · ${submission.title}</option>`).join("")}</select></label>
        <label class="full">사유<textarea name="reason" required placeholder="검토가 필요한 이유와 증빙을 적어주세요."></textarea></label>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-save-dispute="${participant?.id || ""}">접수</button>`
  );
}

function answerDisputeModal() {
  const dispute = state.disputes.find((row) => row.id === form.answerDisputeId);
  return modalShell(
    `${STATUS.dispute[form.answerDisputeStatus]} 처리`,
    `
      <div class="detail">
        <p>${escapeHtml(dispute.reason)}</p>
      </div>
      <form class="form" data-form="answer-dispute">
        <label class="full">답변<textarea name="response" required>${escapeHtml(dispute.response || "")}</textarea></label>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-save-answer-dispute="${dispute.id}" data-status="${form.answerDisputeStatus}">저장</button>`
  );
}

function reviewModal() {
  const submission = state.submissions.find((row) => row.id === form.reviewId);
  const status = form.reviewStatus;
  const label = STATUS.submission[status];
  return modalShell(
    `${label} 처리`,
    `
      <div class="detail">
        <h3>${escapeHtml(submission.title)}</h3>
        <p>${escapeHtml(submission.description || "-")}</p>
        ${submission.contentUrl ? `<p><a href="${escapeHtml(submission.contentUrl)}" target="_blank" rel="noreferrer">제출 링크 열기</a></p>` : ""}
        ${submission.imageUrl ? `<div class="review-image"><a href="${escapeHtml(submission.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(submission.imageUrl)}" alt="${escapeHtml(submission.imageName || "인증 이미지")}" /></a></div>` : submission.imageName ? `<p>첨부 이미지: ${escapeHtml(submission.imageName)}</p>` : ""}
      </div>
      <form class="form" data-form="review">
        <label class="full">검수 사유<textarea name="reason" ${status === "APPROVED" ? "" : "required"} placeholder="반려 또는 보완 요청은 사유가 필수입니다.">${status === "APPROVED" ? "조건 충족" : ""}</textarea></label>
        <label class="check full"><input name="adChecked" type="checkbox" /> 광고 표시 필요 여부를 확인했습니다.</label>
      </form>
    `,
    `<button class="btn ghost" data-close-modal>취소</button><button class="btn primary" data-confirm-review="${submission.id}" data-status="${status}">저장</button>`
  );
}

function bindEvents() {
  document.querySelectorAll("[data-demo-login]").forEach((el) =>
    el.addEventListener("click", async () => {
      if (API_MODE) {
        const payload = await apiPost("/api/demo-login", { userId: el.dataset.demoLogin });
        state = payload.state;
        normalizeState();
        saveLocalOnly();
        render();
        return;
      }
      state.currentUserId = el.dataset.demoLogin;
      state.active = currentUser().role === "participant" ? "explore" : "dashboard";
      saveState();
      render();
    })
  );
  document.querySelector("[data-form='login']")?.addEventListener("submit", login);
  document.querySelector("[data-form='signup']")?.addEventListener("submit", signup);
  document.querySelectorAll("[data-auth-mode]").forEach((el) =>
    el.addEventListener("click", () => {
      form.authMode = el.dataset.authMode;
      render();
    })
  );
  document.querySelectorAll("[data-logout]").forEach((el) =>
    el.addEventListener("click", async () => {
      if (API_MODE) {
        await apiPost("/api/logout");
      }
      state.currentUserId = "";
      form = { authMode: "login" };
      saveLocalOnly();
      render();
    })
  );
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => {
      state.active = el.dataset.nav;
      if (el.dataset.focusChallenge) form.selectedChallengeId = el.dataset.focusChallenge;
      if (el.dataset.action === "new-challenge") openChallengeForm();
      else {
        saveState();
        render();
      }
    });
  });
  document.querySelectorAll("[data-switch-user]").forEach((el) => {
    el.addEventListener("change", () => {
      state.currentUserId = el.value;
      state.active = currentUser().role === "participant" ? "explore" : "dashboard";
      form = {};
      saveState();
      render();
    });
  });
  document.querySelector("[data-reset]")?.addEventListener("click", resetState);
  document.querySelector("[data-action='new-challenge']")?.addEventListener("click", () => openChallengeForm());
  document.querySelectorAll("[data-edit-challenge]").forEach((el) => el.addEventListener("click", () => openChallengeForm(el.dataset.editChallenge)));
  document.querySelectorAll("[data-detail]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "detail";
      form.detailId = el.dataset.detail;
      render();
    })
  );
  document.querySelectorAll("[data-join]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "join";
      form.joinId = el.dataset.join;
      render();
    })
  );
  document.querySelectorAll("[data-open-my]").forEach((el) =>
    el.addEventListener("click", () => {
      state.active = "my";
      saveState();
      render();
    })
  );
  document.querySelectorAll("[data-submit]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "submit";
      form.submitParticipantId = el.dataset.submit;
      render();
    })
  );
  document.querySelectorAll("[data-payment-proof]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "paymentProof";
      form.paymentProofParticipantId = el.dataset.paymentProof;
      render();
    })
  );
  document.querySelectorAll("[data-history]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "history";
      form.historyParticipantId = el.dataset.history;
      render();
    })
  );
  document.querySelectorAll("[data-new-dispute]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "dispute";
      form.disputeParticipantId = el.dataset.newDispute || "";
      form.disputeSubmissionId = el.dataset.submissionId || "";
      render();
    })
  );
  document.querySelectorAll("[data-answer-dispute]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "answerDispute";
      form.answerDisputeId = el.dataset.answerDispute;
      form.answerDisputeStatus = el.dataset.status;
      render();
    })
  );
  document.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));
  document.querySelector("[data-save-challenge]")?.addEventListener("click", saveChallenge);
  document.querySelector("[data-confirm-join]")?.addEventListener("click", (event) => confirmJoin(event.currentTarget.dataset.confirmJoin));
  document.querySelector("[data-save-payment-proof]")?.addEventListener("click", (event) => savePaymentProof(event.currentTarget.dataset.savePaymentProof));
  document.querySelector("[data-save-submission]")?.addEventListener("click", (event) => saveSubmission(event.currentTarget.dataset.saveSubmission));
  document.querySelector("[data-save-dispute]")?.addEventListener("click", (event) => saveDispute(event.currentTarget.dataset.saveDispute));
  document.querySelector("[data-save-answer-dispute]")?.addEventListener("click", (event) => saveDisputeAnswer(event.currentTarget.dataset.saveAnswerDispute, event.currentTarget.dataset.status));
  document.querySelectorAll("[data-pay]").forEach((el) => el.addEventListener("click", () => setPayment(el.dataset.pay, "PAID")));
  document.querySelectorAll("[data-refund]").forEach((el) => el.addEventListener("click", () => setPayment(el.dataset.refund, "REFUNDED")));
  document.querySelectorAll("[data-review]").forEach((el) =>
    el.addEventListener("click", () => {
      form.modal = "review";
      form.reviewId = el.dataset.review;
      form.reviewStatus = el.dataset.status;
      render();
    })
  );
  document.querySelector("[data-confirm-review]")?.addEventListener("click", (event) => confirmReview(event.currentTarget.dataset.confirmReview, event.currentTarget.dataset.status));
  document.querySelector("[data-bulk-approve]")?.addEventListener("click", bulkApproveSubmissions);
  document.querySelectorAll("[data-select-challenge]").forEach((el) =>
    el.addEventListener("change", () => {
      form.selectedChallengeId = el.value;
      render();
    })
  );
  document.querySelectorAll("[data-filter]").forEach((el) =>
    el.addEventListener("change", () => {
      filters[el.dataset.filter] = el.value;
      render();
    })
  );
  document.querySelectorAll("[data-filter-input]").forEach((el) => {
    const apply = () => {
      filters[el.dataset.filterInput] = el.value;
      render();
    };
    el.addEventListener("change", apply);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") apply();
    });
  });
  document.querySelectorAll("[data-lock-ranking]").forEach((el) => el.addEventListener("click", () => lockRanking(el.dataset.lockRanking)));
  document.querySelectorAll("[data-generate-payouts]").forEach((el) => el.addEventListener("click", () => generatePayouts(el.dataset.generatePayouts)));
  document.querySelectorAll("[data-payout-status]").forEach((el) => el.addEventListener("click", () => setPayoutStatus(el.dataset.payoutStatus, el.dataset.status)));
  document.querySelectorAll("[data-payout-amount]").forEach((el) => el.addEventListener("change", () => updatePayout(el.dataset.payoutAmount, "expectedAmount", el.value)));
  document.querySelectorAll("[data-payout-memo]").forEach((el) => el.addEventListener("change", () => updatePayout(el.dataset.payoutMemo, "payoutMemo", el.value)));
  document.querySelectorAll("[data-download-csv]").forEach((el) => el.addEventListener("click", () => downloadCsv(el.dataset.downloadCsv, el.dataset.csvType || "payouts")));
  document.querySelector("[data-backup-db]")?.addEventListener("click", backupDatabase);
  document.querySelector("[data-restore-db]")?.addEventListener("change", restoreDatabase);
  document.querySelector("[data-mark-read]")?.addEventListener("click", markNotificationsRead);
  document.querySelectorAll("[data-user-plan]").forEach((el) => el.addEventListener("change", () => updateUserPlan(el.dataset.userPlan, el.value)));
  document.querySelectorAll("[data-plan-inquiry]").forEach((el) =>
    el.addEventListener("click", () => {
      document.querySelector("input[name='plan']")?.setAttribute("value", el.dataset.planInquiry);
      document.querySelector("input[name='company']")?.focus();
    })
  );
  document.querySelector("[data-form='inquiry']")?.addEventListener("submit", saveInquiry);
}

function closeModal() {
  form.modal = "";
  render();
}

function getFormData(selector) {
  const node = document.querySelector(selector);
  const data = Object.fromEntries(new FormData(node).entries());
  node.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    data[checkbox.name] = checkbox.checked;
  });
  return data;
}

async function saveChallenge() {
  const data = getFormData("[data-form='challenge']");
  const total = Number(data.totalMissionCount);
  const required = Number(data.requiredApprovalCount);
  if (required > total) {
    alert("최소 승인 수는 총 미션 수보다 클 수 없습니다.");
    return;
  }
  if (data.recruitEndAt < data.recruitStartAt || data.challengeEndAt < data.challengeStartAt) {
    alert("기간 설정을 확인하세요.");
    return;
  }

  const challenge = {
    ...form.challenge,
    ...data,
    maxParticipants: Number(data.maxParticipants),
    totalMissionCount: total,
    requiredApprovalCount: required,
    requiresAdDisclosure: Boolean(data.requiresAdDisclosure),
    isPublic: Boolean(data.isPublic),
  };

  if (API_MODE) {
    try {
      const wasNew = !challenge.id;
      await apiAction("saveChallenge", { challenge });
      form.modal = "";
      state.active = "manage";
      render();
      if (wasNew) console.info("challenge created on server");
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (!challenge.id && !canCreateChallenge()) {
    const plan = planFor();
    alert(`${plan.name} 플랜의 챌린지 생성 한도를 초과했습니다.`);
    return;
  }

  if (challenge.id) {
    const index = state.challenges.findIndex((row) => row.id === challenge.id);
    audit("챌린지 수정", "challenge", challenge.id, state.challenges[index].title, challenge.title);
    state.challenges[index] = challenge;
  } else {
    challenge.id = uid("ch");
    challenge.createdAt = today();
    state.challenges.unshift(challenge);
    audit("챌린지 생성", "challenge", challenge.id, "-", challenge.title);
  }
  form.modal = "";
  state.active = "manage";
  saveState();
  render();
}

async function confirmJoin(challengeId) {
  const formNode = document.querySelector("[data-form='join']");
  if (!formNode.reportValidity()) return;
  if (API_MODE) {
    try {
      await apiAction("joinChallenge", { challengeId });
      form.modal = "";
      state.active = "my";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  if (participantFor(challengeId)) return;
  const challenge = challengeById(challengeId);
  if (!canAcceptParticipant(challenge)) {
    alert("챌린지 참가 가능 인원 또는 운영자 플랜 참가자 한도에 도달했습니다.");
    return;
  }
  const participant = {
    id: uid("pa"),
    challengeId,
    userId: currentUser().id,
    participantStatus: "PENDING_PAYMENT",
    paymentStatus: "PENDING_PAYMENT",
    joinedAt: nowIso(),
    paidAt: "",
    paymentProof: { payerName: "", amount: "", reference: "", memo: "", submittedAt: "", status: "" },
    finalResult: "",
    finalRank: "",
  };
  state.participants.push(participant);
  ["terms", "refund", "privacy", "ad"].forEach((type) =>
    state.auditLogs.unshift({
      id: uid("log"),
      actorId: currentUser().id,
      action: `동의 기록: ${type}`,
      targetType: "challenge",
      targetId: challengeId,
      beforeValue: "-",
      afterValue: "agreed-v1",
      createdAt: nowIso(),
    })
  );
  audit("참가 신청", "participant", participant.id, "-", "PENDING_PAYMENT");
  notify(challenge.organizerId, "새 참가 신청", `${currentUser().nickname}님이 ${challenge.title}에 참가 신청했습니다.`, "participants");
  form.modal = "";
  state.active = "my";
  saveState();
  render();
}

async function savePaymentProof(participantId) {
  const formNode = document.querySelector("[data-form='payment-proof']");
  if (!formNode.reportValidity()) return;
  const data = getFormData("[data-form='payment-proof']");
  const proof = {
    payerName: data.payerName.trim(),
    amount: data.amount.trim(),
    reference: data.reference.trim(),
    memo: data.memo.trim(),
  };
  if (API_MODE) {
    try {
      await apiAction("savePaymentProof", { participantId, proof });
      form.modal = "";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const participant = participantById(participantId);
  const challenge = challengeById(participant.challengeId);
  participant.paymentProof = { ...proof, submittedAt: nowIso(), status: "SUBMITTED" };
  audit("입금 정보 제출", "participant", participantId, "-", proof.amount);
  notify(challenge.organizerId, "입금 정보 제출", `${currentUser().nickname}님이 ${challenge.title} 입금 확인 정보를 제출했습니다.`, "participants");
  form.modal = "";
  saveState();
  render();
}

async function setPayment(participantId, status) {
  if (API_MODE) {
    try {
      await apiAction("setPayment", { participantId, status });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const participant = participantById(participantId);
  const challenge = challengeById(participant.challengeId);
  const before = participant.paymentStatus;
  participant.paymentStatus = status;
  if (status === "PAID") {
    participant.participantStatus = "JOINED";
    participant.paidAt = nowIso();
    participant.paymentProof.status = "CONFIRMED";
  } else if (["REFUNDED", "CANCELED"].includes(status)) {
    participant.paymentProof.status = status;
  }
  audit("결제 상태 변경", "participant", participantId, before, status);
  notify(participant.userId, "결제 상태 변경", `${challenge.title}의 결제 상태가 ${STATUS.payment[status]}로 변경되었습니다.`, "my");
  saveState();
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

async function saveSubmission(participantId) {
  const formNode = document.querySelector("[data-form='submission']");
  if (!formNode.reportValidity()) return;
  const data = getFormData("[data-form='submission']");
  const file = formNode.querySelector("input[name='imageFile']")?.files?.[0];
  if (file && file.size > 10 * 1024 * 1024) {
    alert("이미지는 10MB 이하만 업로드할 수 있습니다.");
    return;
  }
  if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    alert("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
    return;
  }
  if (!data.contentUrl && !file) {
    alert("링크 또는 이미지 중 하나는 필요합니다.");
    return;
  }
  if (file) {
    data.imageName = file.name;
    data.imageData = await readFileAsDataUrl(file);
  } else {
    data.imageName = "";
    data.imageData = "";
  }
  delete data.imageFile;
  if (API_MODE) {
    try {
      await apiAction("saveSubmission", { participantId, submission: data });
      form.modal = "";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const participant = participantById(participantId);
  const submission = {
    id: uid("su"),
    challengeId: participant.challengeId,
    participantId,
    missionNumber: Number(data.missionNumber),
    title: data.title,
    contentUrl: data.contentUrl,
    platformAccount: data.platformAccount,
    hashtags: data.hashtags,
    description: data.description,
    imageName: data.imageName,
    status: "SUBMITTED",
    submittedAt: nowIso(),
    reviewedAt: "",
    reviewerId: "",
    reviewReason: "",
    revisionGroupId: uid("rev"),
  };
  state.submissions.unshift(submission);
  audit("미션 제출", "submission", submission.id, "-", "SUBMITTED");
  form.modal = "";
  saveState();
  render();
}

async function confirmReview(submissionId, status) {
  const formNode = document.querySelector("[data-form='review']");
  if (!formNode.reportValidity()) return;
  const data = getFormData("[data-form='review']");
  if (API_MODE) {
    try {
      await apiAction("reviewSubmission", { submissionId, status, reason: data.reason || "" });
      form.modal = "";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const submission = state.submissions.find((row) => row.id === submissionId);
  const participant = participantById(submission.participantId);
  const challenge = challengeById(submission.challengeId);
  const before = submission.status;
  submission.status = status;
  submission.reviewedAt = nowIso();
  submission.reviewerId = currentUser().id;
  submission.reviewReason = data.reason || STATUS.submission[status];
  audit("검수 상태 변경", "submission", submissionId, before, status);
  notify(participant.userId, "검수 결과", `${challenge.title} 미션 ${submission.missionNumber}이 ${STATUS.submission[status]} 처리되었습니다.`, "my");
  form.modal = "";
  saveState();
  render();
}

async function bulkApproveSubmissions() {
  const ids = [...document.querySelectorAll("[data-bulk-submission]:checked")].map((node) => node.dataset.bulkSubmission);
  if (!ids.length) {
    alert("승인할 제출물을 선택하세요.");
    return;
  }
  if (!confirm(`${ids.length}개 제출물을 승인 처리할까요?`)) return;
  if (API_MODE) {
    try {
      await apiAction("bulkReviewSubmissions", { submissionIds: ids, status: "APPROVED", reason: "일괄 승인" });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const approvedAt = nowIso();
  ids.forEach((id) => {
    const submission = state.submissions.find((row) => row.id === id);
    if (!submission || !["SUBMITTED", "NEEDS_REVISION"].includes(submission.status)) return;
    const participant = participantById(submission.participantId);
    const challenge = challengeById(submission.challengeId);
    const before = submission.status;
    submission.status = "APPROVED";
    submission.reviewedAt = approvedAt;
    submission.reviewerId = currentUser().id;
    submission.reviewReason = "일괄 승인";
    audit("검수 상태 변경", "submission", submission.id, before, "APPROVED");
    notify(participant.userId, "검수 결과", `${challenge.title} 미션 ${submission.missionNumber}이 승인 처리되었습니다.`, "my");
  });
  audit("제출물 일괄 승인", "submission", ids.join("|"), "-", `${ids.length}건`);
  saveState();
  render();
}

async function lockRanking(challengeId) {
  if (API_MODE) {
    try {
      await apiAction("lockRanking", { challengeId });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const challenge = challengeById(challengeId);
  const rows = rankings(challengeId);
  rows.forEach((row) => {
    const participant = participantById(row.id);
    participant.finalRank = row.rank;
    participant.finalResult = row.progress.success ? "SUCCEEDED" : "FAILED";
    participant.participantStatus = participant.finalResult;
    notify(participant.userId, "랭킹 확정", `${challenge.title}의 최종 순위가 ${row.rank}위로 확정되었습니다.`, "my");
  });
  const before = challenge.rankingLockedAt || "-";
  challenge.rankingLockedAt = nowIso();
  challenge.status = "COMPLETED";
  audit("랭킹 확정", "challenge", challengeId, before, challenge.rankingLockedAt);
  saveState();
  render();
}

async function generatePayouts(challengeId) {
  if (API_MODE) {
    try {
      await apiAction("generatePayouts", { challengeId });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  state.payouts = state.payouts.filter((payout) => payout.challengeId !== challengeId);
  state.participants
    .filter((participant) => participant.challengeId === challengeId && participant.finalResult === "SUCCEEDED")
    .forEach((participant) => {
      state.payouts.push({
        id: uid("po"),
        challengeId,
        participantId: participant.id,
        expectedAmount: "",
        payoutStatus: "PENDING",
        payoutMemo: "",
        updatedBy: currentUser().id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    });
  audit("지급 대상자 생성", "challenge", challengeId, "-", `${state.payouts.filter((row) => row.challengeId === challengeId).length}명`);
  saveState();
  render();
}

async function updatePayout(id, field, value) {
  if (API_MODE) {
    try {
      await apiAction("updatePayout", { id, field, value });
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const payout = state.payouts.find((row) => row.id === id);
  payout[field] = value;
  payout.updatedAt = nowIso();
  payout.updatedBy = currentUser().id;
  saveState();
}

async function setPayoutStatus(id, status) {
  if (API_MODE) {
    try {
      await apiAction("setPayoutStatus", { id, status });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const payout = state.payouts.find((row) => row.id === id);
  const participant = participantById(payout.participantId);
  const challenge = challengeById(payout.challengeId);
  const before = payout.payoutStatus;
  payout.payoutStatus = status;
  payout.updatedAt = nowIso();
  payout.updatedBy = currentUser().id;
  audit("지급 상태 변경", "payout", id, before, status);
  notify(participant.userId, "지급 상태 변경", `${challenge.title}의 지급 상태가 ${STATUS.payout[status]}로 변경되었습니다.`, "my");
  saveState();
  render();
}

function csvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function buildParticipantCsv(challenge) {
  const header = ["challengeId", "challengeTitle", "participantId", "participantName", "participantEmail", "participantStatus", "paymentStatus", "payerName", "paymentAmount", "paymentReference", "paymentProofStatus", "approvedCount", "rejectedCount", "joinedAt", "paidAt"];
  const rows = state.participants.filter((participant) => participant.challengeId === challenge.id);
  const lines = rows.map((participant) => {
    const user = state.users.find((row) => row.id === participant.userId) || {};
    const progress = progressForParticipant(participant);
    const proof = participant.paymentProof || {};
    return [
      challenge.id,
      challenge.title,
      participant.id,
      user.name,
      user.email,
      participant.participantStatus,
      participant.paymentStatus,
      proof.payerName,
      proof.amount,
      proof.reference,
      proof.status,
      progress.approved,
      rejectedCount(participant.id),
      participant.joinedAt,
      participant.paidAt,
    ]
      .map(csvCell)
      .join(",");
  });
  return { header, lines, count: rows.length };
}

function buildSubmissionCsv(challenge) {
  const header = ["challengeId", "challengeTitle", "submissionId", "participantId", "participantName", "participantEmail", "missionNumber", "title", "status", "contentUrl", "imageUrl", "platformAccount", "hashtags", "submittedAt", "reviewedAt", "reviewReason"];
  const rows = state.submissions.filter((submission) => submission.challengeId === challenge.id);
  const lines = rows.map((submission) => {
    const participant = participantById(submission.participantId) || {};
    const user = state.users.find((row) => row.id === participant.userId) || {};
    return [
      challenge.id,
      challenge.title,
      submission.id,
      participant.id,
      user.name,
      user.email,
      submission.missionNumber,
      submission.title,
      submission.status,
      submission.contentUrl,
      submission.imageUrl,
      submission.platformAccount,
      submission.hashtags,
      submission.submittedAt,
      submission.reviewedAt,
      submission.reviewReason,
    ]
      .map(csvCell)
      .join(",");
  });
  return { header, lines, count: rows.length };
}

function buildPayoutCsv(challenge) {
  const header = ["challengeId", "challengeTitle", "participantId", "participantName", "participantEmail", "finalRank", "finalResult", "paymentStatus", "expectedAmount", "payoutStatus", "payoutMemo"];
  const rows = state.payouts.filter((payout) => payout.challengeId === challenge.id);
  const lines = rows.map((payout) => {
    const participant = participantById(payout.participantId);
    const user = state.users.find((row) => row.id === participant?.userId) || {};
    return [
      challenge.id,
      challenge.title,
      participant?.id,
      user.name,
      user.email,
      participant?.finalRank,
      participant?.finalResult,
      participant?.paymentStatus,
      payout.expectedAmount,
      payout.payoutStatus,
      payout.payoutMemo,
    ]
      .map(csvCell)
      .join(",");
  });
  return { header, lines, count: rows.length };
}

async function downloadCsv(challengeId, type = "payouts") {
  const plan = planFor();
  if (!plan.csv && currentUser().role !== "admin") {
    alert("CSV 다운로드는 Starter 이상 플랜에서 사용할 수 있습니다.");
    state.active = "pricing";
    saveState();
    render();
    return;
  }
  const challenge = challengeById(challengeId);
  const builders = {
    participants: buildParticipantCsv,
    submissions: buildSubmissionCsv,
    payouts: buildPayoutCsv,
  };
  const { header, lines, count } = (builders[type] || buildPayoutCsv)(challenge);
  const blob = new Blob([`\uFEFF${[header.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${challenge.title}-${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  if (API_MODE) {
    try {
      await apiAction("logCsvDownload", { challengeId, csvType: type, count });
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  audit("CSV 다운로드", "challenge", challengeId, "-", `${type}:${count}건`);
  saveState();
}

async function backupDatabase() {
  try {
    const response = await fetch("/api/backup");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "백업 다운로드에 실패했습니다.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challengeops-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const session = await fetch("/api/session").then((res) => res.json()).catch(() => null);
    if (session?.state) applyServerPayload(session);
  } catch (error) {
    alert(error.message);
  }
}

async function restoreDatabase(event) {
  const file = event.currentTarget.files?.[0];
  event.currentTarget.value = "";
  if (!file) return;
  if (!confirm("선택한 백업 파일로 DB를 복원할까요? 현재 데이터가 교체됩니다.")) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const result = await apiPost("/api/restore", payload);
    applyServerPayload(result);
    render();
  } catch (error) {
    alert(error.message || "복원에 실패했습니다.");
  }
}

async function saveInquiry(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (API_MODE) {
    try {
      await apiAction("saveInquiry", { inquiry: data });
      event.currentTarget.reset();
      alert("문의가 접수되었습니다. 관리자가 확인합니다.");
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  state.inquiries.unshift({ id: uid("inq"), ...data, createdAt: nowIso(), status: "접수" });
  audit("캠페인 문의 접수", "inquiry", state.inquiries[0].id, "-", data.company);
  state.users.filter((user) => user.role === "admin").forEach((admin) => notify(admin.id, "캠페인 문의 접수", `${data.company}에서 ${data.plan || "미정"} 플랜 문의를 접수했습니다.`, "inquiries"));
  event.currentTarget.reset();
  alert("문의가 접수되었습니다. MVP에서는 관리자가 수동으로 확인합니다.");
  saveState();
  render();
}

async function saveDispute(participantId) {
  const formNode = document.querySelector("[data-form='dispute']");
  if (!formNode.reportValidity()) return;
  const participant = participantById(participantId) || state.participants.find((row) => row.userId === currentUser().id);
  if (!participant) {
    alert("이의 신청할 참가 내역이 없습니다.");
    return;
  }
  const challenge = challengeById(participant.challengeId);
  const data = getFormData("[data-form='dispute']");
  if (API_MODE) {
    try {
      await apiAction("saveDispute", {
        participantId: participant.id,
        submissionId: data.submissionId || "",
        disputeType: data.type,
        reason: data.reason,
      });
      form.modal = "";
      state.active = "disputes";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const dispute = {
    id: uid("dp"),
    challengeId: participant.challengeId,
    participantId: participant.id,
    userId: currentUser().id,
    submissionId: data.submissionId || "",
    type: data.type,
    status: "OPEN",
    reason: data.reason,
    response: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.disputes.unshift(dispute);
  audit("이의 신청 접수", "dispute", dispute.id, "-", dispute.type);
  notify(challenge.organizerId, "이의 신청 접수", `${currentUser().nickname}님이 ${challenge.title}에 이의 신청을 접수했습니다.`, "disputes");
  form.modal = "";
  state.active = "disputes";
  saveState();
  render();
}

async function saveDisputeAnswer(disputeId, status) {
  const formNode = document.querySelector("[data-form='answer-dispute']");
  if (!formNode.reportValidity()) return;
  const data = getFormData("[data-form='answer-dispute']");
  if (API_MODE) {
    try {
      await apiAction("answerDispute", { disputeId, status, response: data.response });
      form.modal = "";
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const dispute = state.disputes.find((row) => row.id === disputeId);
  const before = dispute.status;
  dispute.status = status;
  dispute.response = data.response;
  dispute.updatedAt = nowIso();
  audit("이의 신청 상태 변경", "dispute", dispute.id, before, status);
  notify(dispute.userId, "이의 신청 처리", `${dispute.type} 상태가 ${STATUS.dispute[status]}로 변경되었습니다.`, "disputes");
  form.modal = "";
  saveState();
  render();
}

async function markNotificationsRead() {
  if (API_MODE) {
    try {
      await apiAction("markNotificationsRead");
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  state.notifications.forEach((row) => {
    if (row.userId === currentUser().id) row.read = true;
  });
  saveState();
  render();
}

async function updateUserPlan(userId, plan) {
  if (API_MODE) {
    try {
      await apiAction("updateUserPlan", { userId, plan });
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const user = state.users.find((row) => row.id === userId);
  const before = user.plan;
  user.plan = plan;
  audit("플랜 변경", "user", userId, before, plan);
  notify(userId, "플랜 변경", `관리자가 플랜을 ${plan}(으)로 변경했습니다.`, "pricing");
  saveState();
  render();
}

document.addEventListener("DOMContentLoaded", initialize);

async function login(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (API_MODE) {
    try {
      const payload = await apiPost("/api/login", data);
      state = payload.state;
      normalizeState();
      saveLocalOnly();
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  const user = state.users.find((row) => row.email === data.email && row.password === data.password);
  if (!user) {
    alert("이메일 또는 비밀번호를 확인하세요.");
    return;
  }
  state.currentUserId = user.id;
  state.active = user.role === "participant" ? "explore" : "dashboard";
  saveState();
  render();
}

async function signup(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (API_MODE) {
    try {
      const payload = await apiPost("/api/signup", data);
      state = payload.state;
      normalizeState();
      saveLocalOnly();
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  if (state.users.some((user) => user.email === data.email)) {
    alert("이미 가입된 이메일입니다.");
    return;
  }
  const user = {
    id: uid("u"),
    email: data.email,
    password: data.password,
    name: data.name,
    nickname: data.nickname,
    role: "participant",
    plan: "Free",
  };
  state.users.push(user);
  state.currentUserId = user.id;
  state.active = "explore";
  audit("회원가입", "user", user.id, "-", user.email);
  saveState();
  render();
}
