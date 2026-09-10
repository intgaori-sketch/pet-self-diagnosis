const path = require("node:path");
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5173);
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "1mb" }));

function normalizeQuestions(value) {
  if (!Array.isArray(value)) return [];
  const questions = value
    .filter((question) => question && ["choice", "multi", "boolean", "text"].includes(question.type) && typeof question.title === "string")
    .slice(0, 8)
    .map((question) => ({
      type: question.type,
      title: question.title.slice(0, 180),
      options: Array.isArray(question.options) ? question.options.filter((option) => typeof option === "string").slice(0, 6).map((option) => option.slice(0, 80)) : undefined,
      placeholder: typeof question.placeholder === "string" ? question.placeholder.slice(0, 120) : undefined
    }))
    .filter((question) => question.type === "text" || (question.options && question.options.length >= 2));
  const seen = new Set();
  return questions.filter((question) => {
    const key = question.title.replace(/\s+/g, " ").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function contextualFallbackQuestions(input) {
  const selected = input?.symptoms?.selected || [];
  const questions = [];
  if (selected.includes("구토")) {
    questions.push({ type: "choice", title: "최근 24시간 동안 구토를 몇 번 했나요?", options: ["1회", "2~3회", "4회 이상", "정확히 모르겠어요"] });
  } else if (selected.includes("설사")) {
    questions.push({ type: "choice", title: "설사는 언제부터 시작되었고 오늘 몇 번 했나요?", options: ["오늘 1회", "오늘 2~3회", "오늘 4회 이상", "어제 이전부터"] });
  } else if (selected.includes("호흡 곤란")) {
    questions.push({ type: "boolean", title: "쉬고 있을 때도 호흡이 힘들어 보이나요?", options: ["예", "아니요", "잘 모르겠어요"] });
  } else if (selected.includes("식욕 저하")) {
    questions.push({ type: "choice", title: "마지막으로 평소처럼 식사한 때는 언제인가요?", options: ["오늘", "어제", "2~3일 전", "그보다 오래됐어요"] });
  } else {
    questions.push({ type: "text", title: "증상이 시작된 시각과 이후 변화는 어떤가요?", placeholder: "예: 어제 저녁부터 시작했고 점점 심해졌어요." });
  }
  return questions;
}

function fallbackAssessment() {
  return {
    confidence: "low",
    urgency: "관찰하며 빠른 시일 내 상담",
    alert: "AI 분석을 완료하지 못했어요. 증상이 있으면 결과를 기다리지 말고 수의사와 상담하세요.",
    conditions: [{ name: "원인 미정 증상", likelihood: "추가 확인 필요" }],
    actions: ["물을 마실 수 있는지 확인하세요.", "증상의 변화와 횟수를 기록하세요.", "상태가 악화되거나 응급 신호가 보이면 즉시 동물병원에 연락하세요."],
    vetRecommendation: "증상이 지속되거나 악화되면 가까운 동물병원에서 진료를 받으세요.",
    summary: "현재 입력된 정보만으로는 특정 질환을 신뢰도 있게 좁히기 어렵습니다.",
    redFlags: ["호흡 곤란", "의식 저하", "반복되는 구토·설사", "출혈"],
    monitoring: ["증상의 횟수와 시작 시각", "식사량과 물 섭취량", "활력과 호흡 상태"],
    vetPreparation: ["증상 시작 시각", "복용 중인 약과 과거 병력", "촬영한 사진·영상"],
    needsMoreInfo: false,
    questions: [],
    mediaRequest: null
  };
}

function normalizeAssessment(value) {
  if (!value || typeof value !== "object") return fallbackAssessment();
  const fallback = fallbackAssessment();
  const conditions = Array.isArray(value.conditions) ? value.conditions
    .filter((condition) => condition && typeof condition.name === "string")
    .slice(0, 4)
    .map((condition) => ({
      name: condition.name.slice(0, 100),
      likelihood: typeof condition.likelihood === "string" ? condition.likelihood.slice(0, 40) : "추가 확인 필요",
      reasoning: typeof condition.reasoning === "string" ? condition.reasoning.slice(0, 220) : "입력된 증상과 답변을 종합한 참고 의견입니다."
    })) : [];
  const toTextList = (items, limit = 8) => Array.isArray(items) ? items.filter((item) => typeof item === "string").slice(0, limit).map((item) => item.slice(0, 220)) : [];
  const actions = toTextList(value.actions);
  const result = {
    confidence: ["low", "medium", "high"].includes(value.confidence) ? value.confidence : "low",
    urgency: typeof value.urgency === "string" && value.urgency !== "none" ? value.urgency.slice(0, 80) : fallback.urgency,
    alert: typeof value.alert === "string" ? value.alert.slice(0, 300) : fallback.alert,
    summary: typeof value.summary === "string" ? value.summary.slice(0, 700) : fallback.summary,
    conditions: conditions.length ? conditions : fallback.conditions,
    actions: actions.length ? actions : fallback.actions,
    vetRecommendation: typeof value.vetRecommendation === "string" ? value.vetRecommendation.slice(0, 300) : fallback.vetRecommendation,
    redFlags: toTextList(value.redFlags).length ? toTextList(value.redFlags) : fallback.redFlags,
    monitoring: toTextList(value.monitoring).length ? toTextList(value.monitoring) : fallback.monitoring,
    vetPreparation: toTextList(value.vetPreparation).length ? toTextList(value.vetPreparation) : fallback.vetPreparation,
    needsMoreInfo: Boolean(value.needsMoreInfo),
    questions: normalizeQuestions(value.questions),
    mediaRequest: value.mediaRequest && value.mediaRequest.requested === true && typeof value.mediaRequest.label === "string" ? {
      requested: true,
      label: value.mediaRequest.label.slice(0, 100),
      reason: typeof value.mediaRequest.reason === "string" ? value.mediaRequest.reason.slice(0, 180) : "상태를 더 정확히 확인하기 위해 필요해요."
    } : null
  };
  const recommendationText = `${result.alert} ${result.summary} ${result.vetRecommendation}`;
  const asksForMoreInfo = /추가|더 확인|정보가 부족|판단하기 어렵|확인할 필요/.test(recommendationText);
  result.needsMoreInfo = result.confidence === "low" || Boolean(value.needsMoreInfo) || asksForMoreInfo;
  if (!result.needsMoreInfo) result.mediaRequest = null;
  return result;
}

app.post("/api/follow-up-questions", async (req, res) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai-api-key")) {
    return res.json({ questions: [], source: "fallback" });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const petContext = JSON.stringify(req.body, null, 2).slice(0, 12000);
  const systemPrompt = [
    "당신은 반려동물 건강 문진을 돕는 한국어 질문 설계 AI입니다.",
    "사용자가 입력한 반려동물 정보와 증상을 참고해 의심되는 질환을 직접 진단하거나 병명을 화면에 말하지 말고, 감별에 도움이 되는 추가 질문만 만들어 주세요.",
    "추가 질문은 0~3개로 만들고, 이미 입력된 내용으로 판단할 수 있으면 반드시 빈 배열을 반환하세요.",
    "종, 나이, 품종, 기존 질환, 선택된 증상과 직접 관련된 질문만 우선순위 순서로 만드세요.",
    "한 질문은 한 가지 정보만 확인하고, 같은 의미의 질문을 반복하지 마세요.",
    "질문 type은 choice(하나 선택), multi(여러 개 선택), boolean(예/아니오), text(직접 입력) 중 하나만 사용하세요.",
    "choice, multi, boolean에는 options 배열을 넣으세요. boolean options는 [\"예\", \"아니요\", \"잘 모르겠어요\"]로 고정하세요.",
    "이미 제공된 정보와 중복되거나 모든 사용자에게 해당하는 고정 질문을 만들지 마세요.",
    "반드시 JSON 객체 {\"questions\":[...]}만 반환하세요. 마크다운과 설명은 금지합니다."
  ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `다음은 홈부터 세 번째 페이지까지 사용자가 입력한 정보입니다. 빈 값은 이미 모르는 정보이므로 같은 내용을 다시 묻지 말고, 진단에 꼭 필요한 경우에만 질문하세요.\n${petContext}` }
      ]
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const questions = normalizeQuestions(parsed.questions);
    if (questions.length === 0) {
      return res.json({ questions: [], source: "openai" });
    }
    return res.json({ questions, source: "openai" });
  } catch (error) {
    console.error("OpenAI follow-up question error:", error.message);
    return res.json({ questions: [], source: "fallback" });
  }
});

app.post("/api/assessment-result", async (req, res) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai-api-key")) {
    return res.json({ ...fallbackAssessment(), source: "fallback" });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const assessmentContext = JSON.stringify(req.body, null, 2).slice(0, 16000);
  const systemPrompt = [
    "당신은 수의사를 대신하지 않는 반려동물 건강 문진 보조 AI입니다.",
    "사용자가 제공한 반려동물 정보, 증상, 4페이지 추가 질문 답변을 종합해 참고용 평가를 작성하세요.",
    "확정 진단을 가장하지 말되, 입력된 증상과 답변에 근거해 가장 가능성 높은 반려동물 질환 또는 상태를 최대 4개까지 구체적으로 제시하세요.",
    "각 conditions 항목에는 name, likelihood, reasoning을 넣고 reasoning에는 어떤 입력 증상과 답변이 그 가능성을 높였는지 설명하세요.",
    "summary에는 현재 상황을 보호자가 이해하기 쉬운 한 문단으로 요약하세요.",
    "redFlags에는 즉시 병원에 가야 하는 악화 신호, monitoring에는 집에서 관찰할 항목, vetPreparation에는 병원에 가져갈 정보와 준비사항을 넣으세요.",
    "응급 신호가 있으면 confidence를 high로 하더라도 즉시 동물병원 방문을 명확히 권고하세요.",
    "대략적인 상태를 판단할 수 있으면 confidence를 medium 또는 high로 하고 needsMoreInfo를 false로 설정하세요. 이 경우 추가 질문이나 추가 업로드를 절대 요청하지 마세요.",
    "정말 핵심 정보가 부족할 때만 confidence를 low로 하고 needsMoreInfo를 true로 설정하세요. 이미 답변된 내용이나 일반적인 질문은 반복하지 말고, 판단에 꼭 필요한 질문만 1~3개 생성하세요.",
    "구토물, 변, 피부, 호흡처럼 시각 자료가 실제로 판단에 도움이 될 때만 mediaRequest를 사용하세요. 그 외에는 mediaRequest를 null로 반환하세요.",
    "mediaRequest를 사용할 때 label은 구체적으로 작성하세요. 예: '토사물 사진을 올려주세요', '변 상태가 보이는 사진을 올려주세요', '피부 이상 부위 사진을 올려주세요'.",
    "needsMoreInfo가 false이면 questions는 빈 배열이고 mediaRequest는 null이어야 합니다.",
    "질문 type은 choice, multi, boolean, text 중 하나이며 choice, multi, boolean에는 options를 포함하세요.",
    "반드시 JSON 객체만 반환하세요: {confidence, urgency, alert, summary, conditions, actions, redFlags, monitoring, vetPreparation, vetRecommendation, needsMoreInfo, questions, mediaRequest}.",
    "결과에 '이 결과는 참고용이며 수의사의 진료를 대체하지 않는다'는 의미가 포함되어야 합니다."
  ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `다음 문진 데이터를 평가하세요.\n${assessmentContext}` }
      ]
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const assessment = normalizeAssessment(parsed);
    if (assessment.needsMoreInfo && assessment.questions.length === 0 && !assessment.mediaRequest) {
      assessment.questions = contextualFallbackQuestions(req.body);
    }
    return res.json({ ...assessment, source: "openai" });
  } catch (error) {
    console.error("OpenAI assessment error:", error.message);
    return res.json({ ...fallbackAssessment(), source: "fallback" });
  }
});

async function startServer() {
  if (isProduction) {
    app.use(express.static(path.join(__dirname, "dist")));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true, hmr: true } });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Pet care app running at http://127.0.0.1:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
