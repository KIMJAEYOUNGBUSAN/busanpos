const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "challengeops-db.json");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const sessions = new Map();

const plans = [
  { name: "Free", price: "0원", challengeLimit: 1, participantLimit: 10, csv: false, report: false },
  { name: "Starter", price: "월 29,000원", challengeLimit: 3, participantLimit: 100, csv: true, report: false },
  { name: "Pro", price: "월 99,000원", challengeLimit: 20, participantLimit: 1000, csv: true, report: true },
  { name: "Agency", price: "월 299,000원 이상", challengeLimit: 999, participantLimit: 9999, csv: true, report: true },
];

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function seedState() {
  return {
    active: "dashboard",
    currentUserId: "",
    users: [
      { id: "u-admin", email: "admin@challenge.local", passwordHash: hashPassword("1234"), name: "플랫폼 관리자", nickname: "관리자", role: "admin", plan: "Agency" },
      { id: "u-organizer", email: "brand@challenge.local", passwordHash: hashPassword("1234"), name: "브랜드 운영자", nickname: "브랜드팀", role: "organizer", plan: "Pro" },
      { id: "u-user", email: "user@challenge.local", passwordHash: hashPassword("1234"), name: "김챌린저", nickname: "콘텐츠러", role: "participant", plan: "Free" },
    ],
    plans,
    challenges: [
      {
        id: "ch-1",
        organizerId: "u-organizer",
        title: "블로그 7일 포스팅 챌린지",
        description: "7일 동안 블로그 콘텐츠를 꾸준히 발행하고 링크와 캡처 이미지로 인증하는 챌린지입니다.",
        platformType: "블로그",
        coverImage: "",
        recruitStartAt: "2026-06-01",
        recruitEndAt: "2026-06-30",
        challengeStartAt: "2026-06-21",
        challengeEndAt: "2026-07-05",
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
        createdAt: "2026-06-18",
      },
      {
        id: "ch-2",
        organizerId: "u-organizer",
        title: "유튜브 쇼츠 업로드 챌린지",
        description: "2주 동안 쇼츠 콘텐츠를 꾸준히 업로드하고 URL로 인증합니다.",
        platformType: "유튜브",
        coverImage: "",
        recruitStartAt: "2026-06-05",
        recruitEndAt: "2026-06-30",
        challengeStartAt: "2026-07-01",
        challengeEndAt: "2026-07-14",
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
        createdAt: "2026-06-18",
      },
    ],
    participants: [
      {
        id: "pa-1",
        challengeId: "ch-1",
        userId: "u-user",
        participantStatus: "JOINED",
        paymentStatus: "PAID",
        joinedAt: "2026-06-18T09:00:00.000Z",
        paidAt: "2026-06-18T09:20:00.000Z",
        paymentProof: {
          payerName: "김챌린저",
          amount: "10,000",
          reference: "샘플 입금",
          memo: "테스트 결제 확인",
          submittedAt: "2026-06-18T09:10:00.000Z",
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
        submittedAt: "2026-06-18T10:00:00.000Z",
        reviewedAt: "2026-06-18T11:00:00.000Z",
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
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) writeState(seedState());
}

function normalizeState(state) {
  state.plans ||= plans;
  state.disputes ||= [];
  state.notifications ||= [];
  state.inquiries ||= [];
  state.auditLogs ||= [];
  state.currentUserId = "";
  state.users.forEach((user) => {
    user.plan ||= user.role === "admin" ? "Agency" : "Free";
    if (!user.passwordHash) {
      user.passwordHash = hashPassword(user.password || "1234");
      delete user.password;
    }
  });
  state.participants.forEach((participant) => {
    participant.paymentProof ||= { payerName: "", amount: "", reference: "", memo: "", submittedAt: "", status: "" };
  });
  return state;
}

function readState() {
  ensureDb();
  return normalizeState(JSON.parse(fs.readFileSync(DB_PATH, "utf8").replace(/^\uFEFF/, "")));
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(normalizeState(state), null, 2));
}

function sanitizeState(state, userId = "") {
  const copy = JSON.parse(JSON.stringify(state));
  copy.currentUserId = userId;
  copy.users = copy.users.map(({ passwordHash, password, ...user }) => user);
  return copy;
}

function mergeClientState(incoming, existing) {
  const passwordMap = new Map(existing.users.map((user) => [user.id, user.passwordHash]));
  incoming.users = incoming.users.map((user) => ({
    ...user,
    passwordHash: passwordMap.get(user.id) || hashPassword(user.password || "1234"),
  }));
  incoming.currentUserId = "";
  return incoming;
}

function uid(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function saveDataUrlImage(dataUrl, originalName = "upload") {
  if (!dataUrl) return { imageName: originalName || "", imageUrl: "" };
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const extension = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" }[mimeType];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("이미지는 10MB 이하만 업로드할 수 있습니다.");
  const safeBase = path
    .basename(originalName || "upload", path.extname(originalName || ""))
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "-")
    .slice(0, 40);
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}${extension}`;
  const dir = path.join(UPLOAD_DIR, "submissions");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return { imageName: originalName || fileName, imageUrl: `/uploads/submissions/${fileName}` };
}

function cleanText(value, max = 300) {
  return String(value || "").trim().slice(0, max);
}

function requireUser(state, userId) {
  const user = state.users.find((row) => row.id === userId);
  if (!user) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }
  return user;
}

function forbidden(message = "권한이 없습니다.") {
  const error = new Error(message);
  error.status = 403;
  throw error;
}

function audit(state, actorId, action, targetType, targetId, beforeValue, afterValue) {
  state.auditLogs.unshift({
    id: uid("log"),
    actorId,
    action,
    targetType,
    targetId,
    beforeValue,
    afterValue,
    createdAt: nowIso(),
  });
}

function notify(state, userId, title, message, link = "") {
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

function challengeById(state, id) {
  return state.challenges.find((challenge) => challenge.id === id);
}

function participantById(state, id) {
  return state.participants.find((participant) => participant.id === id);
}

function submissionById(state, id) {
  return state.submissions.find((submission) => submission.id === id);
}

function isChallengeOwner(user, challenge) {
  return Boolean(challenge) && (user.role === "admin" || challenge.organizerId === user.id);
}

function planFor(state, user) {
  return state.plans.find((plan) => plan.name === user.plan) || state.plans[0];
}

function usageFor(state, userId) {
  const challenges = state.challenges.filter((challenge) => challenge.organizerId === userId);
  const challengeIds = challenges.map((challenge) => challenge.id);
  return {
    challenges: challenges.length,
    participants: state.participants.filter((participant) => challengeIds.includes(participant.challengeId)).length,
  };
}

function canCreateChallenge(state, user) {
  if (user.role === "admin") return true;
  return usageFor(state, user.id).challenges < planFor(state, user).challengeLimit;
}

function canAcceptParticipant(state, challenge) {
  const organizer = state.users.find((user) => user.id === challenge.organizerId);
  if (!organizer || organizer.role === "admin") return true;
  const currentCount = state.participants.filter((participant) => participant.challengeId === challenge.id).length;
  return currentCount < Math.min(Number(challenge.maxParticipants || 0), planFor(state, organizer).participantLimit);
}

function progressForParticipant(state, participant) {
  const challenge = challengeById(state, participant.challengeId);
  const approvedMissionNumbers = new Set(
    state.submissions
      .filter((submission) => submission.participantId === participant.id && submission.status === "APPROVED")
      .map((submission) => Number(submission.missionNumber))
  );
  const approved = approvedMissionNumbers.size;
  const total = Number(challenge?.totalMissionCount || 1);
  const required = Number(challenge?.requiredApprovalCount || total);
  return { approved, total, required, success: approved >= required };
}

function rejectedCount(state, participantId) {
  return state.submissions.filter((submission) => submission.participantId === participantId && submission.status === "REJECTED").length;
}

function lastApprovedAt(state, participantId) {
  return (
    state.submissions
      .filter((submission) => submission.participantId === participantId && submission.status === "APPROVED")
      .map((submission) => submission.reviewedAt || submission.submittedAt)
      .sort()
      .at(-1) || ""
  );
}

function rankings(state, challengeId) {
  return state.participants
    .filter((participant) => participant.challengeId === challengeId)
    .map((participant) => ({
      ...participant,
      progress: progressForParticipant(state, participant),
      rejected: rejectedCount(state, participant.id),
      lastApproved: lastApprovedAt(state, participant.id),
    }))
    .sort((a, b) => {
      if (b.progress.approved !== a.progress.approved) return b.progress.approved - a.progress.approved;
      if (a.lastApproved !== b.lastApproved) return (a.lastApproved || "9999").localeCompare(b.lastApproved || "9999");
      if (a.rejected !== b.rejected) return a.rejected - b.rejected;
      return a.joinedAt.localeCompare(b.joinedAt);
    })
    .map((participant, index) => ({ ...participant, rank: index + 1 }));
}

function handleAction(state, userId, type, payload) {
  const user = requireUser(state, userId);

  if (type === "saveChallenge") {
    if (!["organizer", "admin"].includes(user.role)) forbidden();
    const challenge = { ...payload.challenge };
    if (!challenge.title || !challenge.description) throw new Error("필수 항목이 누락되었습니다.");
    if (Number(challenge.requiredApprovalCount) > Number(challenge.totalMissionCount)) throw new Error("최소 승인 수는 총 미션 수보다 클 수 없습니다.");
    if (challenge.recruitEndAt < challenge.recruitStartAt || challenge.challengeEndAt < challenge.challengeStartAt) throw new Error("기간 설정을 확인하세요.");
    if (challenge.id) {
      const index = state.challenges.findIndex((row) => row.id === challenge.id);
      if (index < 0) throw new Error("챌린지를 찾을 수 없습니다.");
      if (!isChallengeOwner(user, state.challenges[index])) forbidden();
      const before = state.challenges[index].title;
      state.challenges[index] = { ...state.challenges[index], ...challenge, organizerId: state.challenges[index].organizerId };
      audit(state, user.id, "챌린지 수정", "challenge", challenge.id, before, challenge.title);
    } else {
      if (!canCreateChallenge(state, user)) throw new Error("현재 플랜의 챌린지 생성 한도를 초과했습니다.");
      challenge.id = uid("ch");
      challenge.organizerId = user.id;
      challenge.createdAt = nowIso().slice(0, 10);
      state.challenges.unshift(challenge);
      audit(state, user.id, "챌린지 생성", "challenge", challenge.id, "-", challenge.title);
    }
    return;
  }

  if (type === "joinChallenge") {
    if (user.role !== "participant") forbidden("참가자만 신청할 수 있습니다.");
    const challenge = challengeById(state, payload.challengeId);
    if (!challenge || !challenge.isPublic || challenge.status !== "RECRUITING") throw new Error("참가 신청할 수 없는 챌린지입니다.");
    if (state.participants.some((participant) => participant.challengeId === challenge.id && participant.userId === user.id)) throw new Error("이미 신청한 챌린지입니다.");
    if (!canAcceptParticipant(state, challenge)) throw new Error("참가 가능 인원 또는 운영자 플랜 한도에 도달했습니다.");
    const participant = {
      id: uid("pa"),
      challengeId: challenge.id,
      userId: user.id,
      participantStatus: "PENDING_PAYMENT",
      paymentStatus: "PENDING_PAYMENT",
      joinedAt: nowIso(),
      paidAt: "",
      finalResult: "",
      finalRank: "",
    };
    state.participants.push(participant);
    ["terms", "refund", "privacy", "ad"].forEach((consent) => audit(state, user.id, `동의 기록: ${consent}`, "challenge", challenge.id, "-", "agreed-v1"));
    audit(state, user.id, "참가 신청", "participant", participant.id, "-", "PENDING_PAYMENT");
    notify(state, challenge.organizerId, "새 참가 신청", `${user.nickname}님이 ${challenge.title}에 참가 신청했습니다.`, "participants");
    return;
  }

  if (type === "setPayment") {
    const participant = participantById(state, payload.participantId);
    const challenge = challengeById(state, participant?.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    const before = participant.paymentStatus;
    participant.paymentStatus = payload.status;
    if (payload.status === "PAID") {
      participant.participantStatus = "JOINED";
      participant.paidAt = nowIso();
      participant.paymentProof.status = "CONFIRMED";
    } else if (["REFUNDED", "CANCELED"].includes(payload.status)) {
      participant.paymentProof.status = payload.status;
    }
    audit(state, user.id, "결제 상태 변경", "participant", participant.id, before, payload.status);
    notify(state, participant.userId, "결제 상태 변경", `${challenge.title}의 결제 상태가 변경되었습니다.`, "my");
    return;
  }

  if (type === "savePaymentProof") {
    const participant = participantById(state, payload.participantId);
    if (!participant || participant.userId !== user.id) forbidden();
    if (participant.paymentStatus === "PAID") throw new Error("이미 결제 완료 처리된 참가 건입니다.");
    const proof = payload.proof || {};
    const payerName = cleanText(proof.payerName, 40);
    const amount = cleanText(proof.amount, 30);
    if (!payerName || !amount) throw new Error("입금자명과 입금액은 필수입니다.");
    participant.paymentProof = {
      payerName,
      amount,
      reference: cleanText(proof.reference, 80),
      memo: cleanText(proof.memo, 300),
      submittedAt: nowIso(),
      status: "SUBMITTED",
    };
    const challenge = challengeById(state, participant.challengeId);
    audit(state, user.id, "입금 정보 제출", "participant", participant.id, "-", amount);
    notify(state, challenge.organizerId, "입금 정보 제출", `${user.nickname}님이 ${challenge.title} 입금 확인 정보를 제출했습니다.`, "participants");
    return;
  }

  if (type === "saveSubmission") {
    const participant = participantById(state, payload.participantId);
    if (!participant || participant.userId !== user.id) forbidden();
    if (participant.paymentStatus !== "PAID") throw new Error("결제 완료 상태에서만 제출할 수 있습니다.");
    const image = saveDataUrlImage(payload.submission.imageData, payload.submission.imageName);
    if (!payload.submission.contentUrl && !image.imageUrl) throw new Error("링크 또는 이미지 중 하나는 필요합니다.");
    const submission = {
      id: uid("su"),
      challengeId: participant.challengeId,
      participantId: participant.id,
      missionNumber: Number(payload.submission.missionNumber),
      title: payload.submission.title,
      contentUrl: payload.submission.contentUrl,
      platformAccount: payload.submission.platformAccount,
      hashtags: payload.submission.hashtags,
      description: payload.submission.description,
      imageName: image.imageName,
      imageUrl: image.imageUrl,
      status: "SUBMITTED",
      submittedAt: nowIso(),
      reviewedAt: "",
      reviewerId: "",
      reviewReason: "",
      revisionGroupId: uid("rev"),
    };
    state.submissions.unshift(submission);
    audit(state, user.id, "미션 제출", "submission", submission.id, "-", "SUBMITTED");
    const challenge = challengeById(state, participant.challengeId);
    notify(state, challenge.organizerId, "새 제출물", `${user.nickname}님이 ${challenge.title} 미션 ${submission.missionNumber}을 제출했습니다.`, "submissions");
    return;
  }

  if (type === "reviewSubmission") {
    const submission = submissionById(state, payload.submissionId);
    const participant = participantById(state, submission?.participantId);
    const challenge = challengeById(state, submission?.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    if (!["APPROVED", "REJECTED", "NEEDS_REVISION"].includes(payload.status)) throw new Error("잘못된 검수 상태입니다.");
    if (payload.status !== "APPROVED" && !payload.reason) throw new Error("반려 또는 보완 요청은 사유가 필수입니다.");
    const before = submission.status;
    submission.status = payload.status;
    submission.reviewedAt = nowIso();
    submission.reviewerId = user.id;
    submission.reviewReason = payload.reason || "조건 충족";
    audit(state, user.id, "검수 상태 변경", "submission", submission.id, before, payload.status);
    notify(state, participant.userId, "검수 결과", `${challenge.title} 미션 ${submission.missionNumber} 검수 상태가 변경되었습니다.`, "my");
    return;
  }

  if (type === "bulkReviewSubmissions") {
    const submissionIds = Array.isArray(payload.submissionIds) ? [...new Set(payload.submissionIds)] : [];
    if (!submissionIds.length) throw new Error("승인할 제출물을 선택하세요.");
    if (payload.status !== "APPROVED") throw new Error("일괄 검수는 승인 처리만 지원합니다.");
    const reviewedAt = nowIso();
    let count = 0;
    submissionIds.forEach((id) => {
      const submission = submissionById(state, id);
      const participant = participantById(state, submission?.participantId);
      const challenge = challengeById(state, submission?.challengeId);
      if (!isChallengeOwner(user, challenge)) forbidden();
      if (!["SUBMITTED", "NEEDS_REVISION"].includes(submission.status)) return;
      const before = submission.status;
      submission.status = "APPROVED";
      submission.reviewedAt = reviewedAt;
      submission.reviewerId = user.id;
      submission.reviewReason = cleanText(payload.reason, 120) || "일괄 승인";
      count += 1;
      audit(state, user.id, "검수 상태 변경", "submission", submission.id, before, "APPROVED");
      notify(state, participant.userId, "검수 결과", `${challenge.title} 미션 ${submission.missionNumber} 검수 상태가 승인으로 변경되었습니다.`, "my");
    });
    audit(state, user.id, "제출물 일괄 승인", "submission", submissionIds.join("|"), "-", `${count}건`);
    return;
  }

  if (type === "lockRanking") {
    const challenge = challengeById(state, payload.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    const rows = rankings(state, challenge.id);
    rows.forEach((row) => {
      const participant = participantById(state, row.id);
      participant.finalRank = row.rank;
      participant.finalResult = row.progress.success ? "SUCCEEDED" : "FAILED";
      participant.participantStatus = participant.finalResult;
      notify(state, participant.userId, "랭킹 확정", `${challenge.title}의 최종 순위가 ${row.rank}위로 확정되었습니다.`, "my");
    });
    const before = challenge.rankingLockedAt || "-";
    challenge.rankingLockedAt = nowIso();
    challenge.status = "COMPLETED";
    audit(state, user.id, "랭킹 확정", "challenge", challenge.id, before, challenge.rankingLockedAt);
    return;
  }

  if (type === "generatePayouts") {
    const challenge = challengeById(state, payload.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    state.payouts = state.payouts.filter((payout) => payout.challengeId !== challenge.id);
    state.participants
      .filter((participant) => participant.challengeId === challenge.id && participant.finalResult === "SUCCEEDED")
      .forEach((participant) => {
        state.payouts.push({
          id: uid("po"),
          challengeId: challenge.id,
          participantId: participant.id,
          expectedAmount: "",
          payoutStatus: "PENDING",
          payoutMemo: "",
          updatedBy: user.id,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      });
    audit(state, user.id, "지급 대상자 생성", "challenge", challenge.id, "-", `${state.payouts.filter((row) => row.challengeId === challenge.id).length}명`);
    return;
  }

  if (type === "updatePayout") {
    const payout = state.payouts.find((row) => row.id === payload.id);
    const challenge = challengeById(state, payout?.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    if (!["expectedAmount", "payoutMemo"].includes(payload.field)) throw new Error("수정할 수 없는 필드입니다.");
    payout[payload.field] = payload.value;
    payout.updatedAt = nowIso();
    payout.updatedBy = user.id;
    return;
  }

  if (type === "setPayoutStatus") {
    const payout = state.payouts.find((row) => row.id === payload.id);
    const participant = participantById(state, payout?.participantId);
    const challenge = challengeById(state, payout?.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    const before = payout.payoutStatus;
    payout.payoutStatus = payload.status;
    payout.updatedAt = nowIso();
    payout.updatedBy = user.id;
    audit(state, user.id, "지급 상태 변경", "payout", payout.id, before, payload.status);
    notify(state, participant.userId, "지급 상태 변경", `${challenge.title}의 지급 상태가 변경되었습니다.`, "my");
    return;
  }

  if (type === "logCsvDownload") {
    const challenge = challengeById(state, payload.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    const csvType = cleanText(payload.csvType, 40) || "unknown";
    const count = cleanText(payload.count, 20);
    audit(state, user.id, "CSV 다운로드", "challenge", challenge.id, "-", `${csvType}:${count}건`);
    return;
  }

  if (type === "saveInquiry") {
    const inquiry = { id: uid("inq"), ...payload.inquiry, createdAt: nowIso(), status: "접수" };
    state.inquiries.unshift(inquiry);
    audit(state, user.id, "캠페인 문의 접수", "inquiry", inquiry.id, "-", inquiry.company);
    state.users.filter((row) => row.role === "admin").forEach((admin) => notify(state, admin.id, "캠페인 문의 접수", `${inquiry.company}에서 문의를 접수했습니다.`, "inquiries"));
    return;
  }

  if (type === "saveDispute") {
    const participant = participantById(state, payload.participantId);
    if (!participant || participant.userId !== user.id) forbidden();
    const challenge = challengeById(state, participant.challengeId);
    const dispute = {
      id: uid("dp"),
      challengeId: participant.challengeId,
      participantId: participant.id,
      userId: user.id,
      submissionId: payload.submissionId || "",
      type: payload.disputeType,
      status: "OPEN",
      reason: payload.reason,
      response: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.disputes.unshift(dispute);
    audit(state, user.id, "이의 신청 접수", "dispute", dispute.id, "-", dispute.type);
    notify(state, challenge.organizerId, "이의 신청 접수", `${user.nickname}님이 ${challenge.title}에 이의 신청을 접수했습니다.`, "disputes");
    return;
  }

  if (type === "answerDispute") {
    const dispute = state.disputes.find((row) => row.id === payload.disputeId);
    const challenge = challengeById(state, dispute?.challengeId);
    if (!isChallengeOwner(user, challenge)) forbidden();
    const before = dispute.status;
    dispute.status = payload.status;
    dispute.response = payload.response;
    dispute.updatedAt = nowIso();
    audit(state, user.id, "이의 신청 상태 변경", "dispute", dispute.id, before, payload.status);
    notify(state, dispute.userId, "이의 신청 처리", `${dispute.type} 상태가 변경되었습니다.`, "disputes");
    return;
  }

  if (type === "markNotificationsRead") {
    state.notifications.forEach((notification) => {
      if (notification.userId === user.id) notification.read = true;
    });
    return;
  }

  if (type === "updateUserPlan") {
    if (user.role !== "admin") forbidden();
    const target = state.users.find((row) => row.id === payload.userId);
    if (!target) throw new Error("사용자를 찾을 수 없습니다.");
    const before = target.plan;
    target.plan = payload.plan;
    audit(state, user.id, "플랜 변경", "user", target.id, before, payload.plan);
    notify(state, target.id, "플랜 변경", `관리자가 플랜을 ${payload.plan}(으)로 변경했습니다.`, "pricing");
    return;
  }

  throw new Error("알 수 없는 액션입니다.");
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
  );
}

function sessionUserId(req) {
  const sid = parseCookies(req).sid;
  return sid ? sessions.get(sid) || "" : "";
}

function setSession(res, userId) {
  const sid = crypto.randomUUID();
  sessions.set(sid, userId);
  res.setHeader("Set-Cookie", `sid=${sid}; HttpOnly; SameSite=Lax; Path=/`);
}

function clearSession(req, res) {
  const sid = parseCookies(req).sid;
  if (sid) sessions.delete(sid);
  res.setHeader("Set-Cookie", "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function sendDownload(res, fileName, body) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        error.status = 400;
        reject(error);
      }
    });
  });
}

async function handleApi(req, res) {
  try {
    const state = readState();
    const userId = sessionUserId(req);

    if (req.method === "GET" && req.url === "/api/session") {
      sendJson(res, 200, { userId, state: sanitizeState(state, userId) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/login") {
      const body = await readBody(req);
      const user = state.users.find((row) => row.email === body.email);
      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        sendJson(res, 401, { error: "이메일 또는 비밀번호를 확인하세요." });
        return;
      }
      setSession(res, user.id);
      sendJson(res, 200, { userId: user.id, state: sanitizeState(state, user.id) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/demo-login") {
      const body = await readBody(req);
      const user = state.users.find((row) => row.id === body.userId);
      if (!user) {
        sendJson(res, 404, { error: "사용자를 찾을 수 없습니다." });
        return;
      }
      setSession(res, user.id);
      sendJson(res, 200, { userId: user.id, state: sanitizeState(state, user.id) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/signup") {
      const body = await readBody(req);
      if (state.users.some((row) => row.email === body.email)) {
        sendJson(res, 409, { error: "이미 가입된 이메일입니다." });
        return;
      }
      const user = {
        id: `u-${crypto.randomUUID().slice(0, 8)}`,
        email: body.email,
        passwordHash: hashPassword(body.password),
        name: body.name,
        nickname: body.nickname,
        role: "participant",
        plan: "Free",
      };
      state.users.push(user);
      state.auditLogs.unshift({
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        actorId: user.id,
        action: "회원가입",
        targetType: "user",
        targetId: user.id,
        beforeValue: "-",
        afterValue: user.email,
        createdAt: new Date().toISOString(),
      });
      writeState(state);
      setSession(res, user.id);
      sendJson(res, 200, { userId: user.id, state: sanitizeState(state, user.id) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/logout") {
      clearSession(req, res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && req.url === "/api/backup") {
      const user = requireUser(state, userId);
      if (user.role !== "admin") forbidden();
      audit(state, user.id, "데이터 백업", "database", "challengeops-db", "-", "download");
      writeState(state);
      sendDownload(res, `challengeops-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(readState(), null, 2));
      return;
    }

    if (req.method === "POST" && req.url === "/api/restore") {
      const user = requireUser(state, userId);
      if (user.role !== "admin") forbidden();
      const body = await readBody(req);
      if (!body || !Array.isArray(body.users) || !Array.isArray(body.challenges) || !Array.isArray(body.participants)) {
        const error = new Error("복원 파일 형식이 올바르지 않습니다.");
        error.status = 400;
        throw error;
      }
      const restored = normalizeState(body);
      audit(restored, user.id, "데이터 복원", "database", "challengeops-db", "-", `${restored.challenges.length}개 챌린지`);
      writeState(restored);
      sendJson(res, 200, { state: sanitizeState(restored, userId) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/reset") {
      const user = requireUser(state, userId);
      if (user.role !== "admin") forbidden();
      const reset = seedState();
      audit(reset, user.id, "샘플 초기화", "database", "challengeops-db", "-", "seed");
      writeState(reset);
      sendJson(res, 200, { state: sanitizeState(reset, userId) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/action") {
      if (!userId) {
        sendJson(res, 401, { error: "로그인이 필요합니다." });
        return;
      }
      const body = await readBody(req);
      try {
        handleAction(state, userId, body.type, body.payload || {});
      } catch (error) {
        sendJson(res, error.status || 400, { error: error.message });
        return;
      }
      writeState(state);
      sendJson(res, 200, { state: sanitizeState(state, userId) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/state") {
      sendJson(res, 410, { error: "전체 상태 저장 API는 더 이상 사용하지 않습니다. /api/action을 사용하세요." });
      return;
    }

    sendJson(res, 404, { error: "API를 찾을 수 없습니다." });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message });
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const relative = urlPath === "/" ? "index.html" : urlPath.slice(1);
  const filePath = path.resolve(ROOT, relative);
  if (!filePath.startsWith(ROOT) || filePath.includes(`${path.sep}data${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (filePath.includes(`${path.sep}uploads${path.sep}`) && !filePath.startsWith(UPLOAD_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

ensureDb();

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
      handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`ChallengeOps server running at http://localhost:${PORT}`);
  });
