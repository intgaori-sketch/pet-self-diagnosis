const breedsBySpecies = {
  강아지: ["포메라니안", "치와와", "골든 리트리버", "말티즈", "푸들", "시바견", "기타"],
  고양이: ["코리안 숏헤어", "페르시안", "러시안 블루", "먼치킨", "스코티시 폴드", "기타"],
  거북이: ["붉은귀거북", "레오파드 육지거북", "그리스 육지거북", "설가타 육지거북", "기타"],
  토끼: ["네덜란드 드워프", "미니 렉스", "롭이어", "라이언헤드", "기타"],
  햄스터: ["골든 햄스터", "드워프 햄스터", "로보로브스키", "기타"],
  기타: ["기타"]
};

const speciesSelect = document.querySelector("#species");
const breedGroup = document.querySelector("#breed-group");
const breedSelect = document.querySelector("#breed");
const breedSelectWrap = document.querySelector("#breed-select-wrap");
const otherInputWrap = document.querySelector("#other-input-wrap");
const otherBreedInput = document.querySelector("#other-breed");
const continueButton = document.querySelector("#continue-button");
const fieldHint = document.querySelector("#field-hint");
const introPanel = document.querySelector("#intro-panel");
const firstStep = document.querySelector("#first-step");
const secondStep = document.querySelector("#second-step");
const selectedPet = document.querySelector("#selected-pet");
const vaccineList = document.querySelector("#vaccine-list");
const vaccineProgress = document.querySelector("#vaccine-progress");
const backButton = document.querySelector("#back-button");
const finishButton = document.querySelector("#finish-button");
const basicError = document.querySelector("#basic-error");
const thirdStep = document.querySelector("#third-step");
const symptomPet = document.querySelector("#symptom-pet");
const symptomBackButton = document.querySelector("#symptom-back-button");
const symptomFinishButton = document.querySelector("#symptom-finish-button");
const symptomError = document.querySelector("#symptom-error");
const symptomProgress = document.querySelector("#symptom-progress");
const mediaUpload = document.querySelector("#media-upload");
const mediaPreview = document.querySelector("#media-preview");
const fourthStep = document.querySelector("#fourth-step");
const questionPet = document.querySelector("#question-pet");
const questionList = document.querySelector("#question-list");
const questionProgress = document.querySelector("#question-progress");
const questionBackButton = document.querySelector("#question-back-button");
const questionFinishButton = document.querySelector("#question-finish-button");
const questionStatus = document.querySelector("#question-status");
const fifthStep = document.querySelector("#fifth-step");
const resultPet = document.querySelector("#result-pet");
const resultLoading = document.querySelector("#result-loading");
const resultContent = document.querySelector("#result-content");
const resultAlert = document.querySelector("#result-alert");
const resultSummary = document.querySelector("#result-summary");
const resultConditions = document.querySelector("#result-conditions");
const resultActions = document.querySelector("#result-actions");
const resultRedFlags = document.querySelector("#result-red-flags");
const resultMonitoring = document.querySelector("#result-monitoring");
const resultVet = document.querySelector("#result-vet");
const resultVetPreparation = document.querySelector("#result-vet-preparation");
const uncertainPanel = document.querySelector("#uncertain-panel");
const moreQuestionList = document.querySelector("#more-question-list");
const moreMediaUpload = document.querySelector("#more-media-upload");
const moreMediaPreview = document.querySelector("#more-media-preview");
const mediaRequest = document.querySelector("#media-request");
const mediaRequestCopy = document.querySelector("#media-request-copy");
const mediaUploadLabel = document.querySelector("#media-upload-label");
const noMoreMedia = document.querySelector("#no-more-media");
const reanalyzeButton = document.querySelector("#reanalyze-button");
const newAssessmentButton = document.querySelector("#new-assessment-button");

const vaccinesBySpecies = {
  강아지: ["종합백신 (DHPPL)", "광견병 예방접종", "코로나 장염 예방접종", "켄넬코프 예방접종"],
  고양이: ["종합백신 (FVRCP)", "광견병 예방접종", "고양이 백혈병 예방접종"],
  거북이: ["구충 검사 및 관리", "비타민·칼슘 건강 점검", "정기 건강검진"],
  토끼: ["RHDV 출혈병 예방접종", "정기 건강검진", "구충 검사 및 관리"],
  햄스터: ["정기 건강검진", "구충 검사 및 관리"],
  기타: ["정기 건강검진", "필요 예방접종 확인"]
};

function setBreedOptions(species) {
  const options = breedsBySpecies[species] || [];
  breedSelect.innerHTML = '<option value="">품종을 선택해주세요</option>';
  options.forEach((breed) => {
    const option = document.createElement("option");
    option.value = breed;
    option.textContent = breed;
    breedSelect.append(option);
  });
  breedSelect.disabled = options.length === 0;
  breedGroup.hidden = !species;
  otherInputWrap.hidden = true;
  breedSelectWrap.hidden = false;
  otherBreedInput.value = "";
  fieldHint.textContent = species === "기타" ? "반려동물의 종과 품종을 직접 입력해주세요." : "가장 흔한 품종을 모아두었어요.";
  updateButtonState();
}

function updateButtonState() {
  const customBreed = !otherInputWrap.hidden && otherBreedInput.value.trim();
  continueButton.disabled = !speciesSelect.value || (!breedSelect.value && !customBreed);
}

function renderVaccines(species) {
  const vaccines = vaccinesBySpecies[species] || vaccinesBySpecies.기타;
  vaccineList.innerHTML = vaccines.map((vaccine, index) => `
    <label class="vaccine-item">
      <input type="checkbox" name="vaccine-${index}" value="${vaccine}" />
      <span>${vaccine}</span>
    </label>
  `).join("");
  vaccineProgress.textContent = `0 / ${vaccines.length}`;
  vaccineList.querySelectorAll("input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checkedCount = vaccineList.querySelectorAll("input:checked").length;
      vaccineProgress.textContent = `${checkedCount} / ${vaccines.length}`;
    });
  });
}

function showSecondStep() {
  const species = speciesSelect.value;
  const breed = otherInputWrap.hidden ? breedSelect.value : otherBreedInput.value.trim();
  selectedPet.textContent = `${species} · ${breed}`;
  renderVaccines(species);
  introPanel.hidden = true;
  firstStep.hidden = true;
  secondStep.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("#pet-name").focus();
}

function showThirdStep() {
  symptomPet.textContent = selectedPet.textContent;
  secondStep.hidden = true;
  thirdStep.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("#symptom-description").focus();
}

function validateBasicInfo() {
  const requiredFields = [
    ["#pet-age", "나이를 입력해주세요."],
    ["#pet-weight", "몸무게를 입력해주세요."],
    ["#pet-sex", "성별을 선택해주세요."],
    ["#neutered", "중성화 여부를 선택해주세요."],
    ["#living-space", "주 생활 환경을 선택해주세요."]
  ];
  const missingField = requiredFields.find(([selector]) => !document.querySelector(selector).value.trim());
  basicError.hidden = !missingField;
  if (missingField) {
    basicError.textContent = missingField[1];
    document.querySelector(missingField[0]).focus();
    return false;
  }
  return true;
}

function collectAssessmentData() {
  return {
    pet: {
      species: speciesSelect.value,
      breed: otherInputWrap.hidden ? breedSelect.value : otherBreedInput.value.trim(),
      name: document.querySelector("#pet-name").value.trim(),
      age: document.querySelector("#pet-age").value,
      weightKg: document.querySelector("#pet-weight").value,
      sex: document.querySelector("#pet-sex").value,
      neutered: document.querySelector("#neutered").value,
      livingSpace: document.querySelector("#living-space").value,
      healthHistory: document.querySelector("#health-history").value.trim(),
      medications: document.querySelector("#medications").value.trim(),
      lastVetVisit: document.querySelector("#vet-visit").value,
      vaccinesCompleted: [...vaccineList.querySelectorAll("input:checked")].map((input) => input.value)
    },
    symptoms: {
      description: document.querySelector("#symptom-description").value.trim(),
      selected: [...document.querySelectorAll('input[name="symptom"]:checked')].map((input) => input.value),
      media: [...mediaUpload.files].slice(0, 5).map((file) => ({ name: file.name, type: file.type, size: file.size }))
    }
  };
}

function collectQuestionAnswers(container) {
  return [...container.querySelectorAll(".question-card")].map((card) => {
    const title = card.querySelector("h3")?.textContent?.replace(/^\d+/, "").trim() || "";
    const selected = [...card.querySelectorAll("input:checked")].map((input) => input.value);
    const text = [...card.querySelectorAll('input[type="text"], input[type="number"]')].map((input) => input.value.trim()).filter(Boolean);
    return { question: title, answer: selected.length ? selected : text };
  }).filter((answer) => answer.answer.length);
}

function fileMetadata(input) {
  return [...input.files].slice(0, 5).map((file) => ({ name: file.name, type: file.type, size: file.size }));
}

function renderQuestionCards(container, questions) {
  container.innerHTML = questions.map((question, index) => {
    const questionNumber = String(index + 1).padStart(2, "0");
    const title = String(question.title || "추가 정보를 알려주세요").replace(/[<>]/g, "");
    if (question.type === "text") {
      const placeholder = String(question.placeholder || "답변을 입력해주세요").replace(/[<>]/g, "");
      return `<div class="question-card"><h3><span class="question-number">${questionNumber}</span>${title}</h3><input type="text" placeholder="${placeholder}" /></div>`;
    }
    const inputType = question.type === "multi" ? "checkbox" : "radio";
    const options = (question.options || []).map((option) => {
      const safeOption = String(option).replace(/[<>]/g, "");
      return `<label class="answer-option"><input type="${inputType}" name="follow-up-${index}" value="${safeOption}" /><span>${safeOption}</span></label>`;
    }).join("");
    return `<div class="question-card"><h3><span class="question-number">${questionNumber}</span>${title}</h3><div class="answer-options">${options}</div></div>`;
  }).join("");
}

function updateQuestionProgress() {
  const cards = [...questionList.querySelectorAll(".question-card")];
  const answered = cards.filter((card) => card.querySelector('input:checked') || [...card.querySelectorAll('input[type="text"], input[type="number"]')].some((input) => input.value.trim())).length;
  questionProgress.textContent = `${answered} / ${cards.length} 답변`;
}

function renderFollowUpQuestions(questions) {
  renderQuestionCards(questionList, questions);
  questionList.querySelectorAll("input").forEach((input) => input.addEventListener("change", updateQuestionProgress));
  questionList.querySelectorAll('input[type="text"], input[type="number"]').forEach((input) => input.addEventListener("input", updateQuestionProgress));
  questionProgress.textContent = `0 / ${questions.length} 답변`;
}

function renderMediaPreviews(input, target) {
  target.innerHTML = "";
  [...input.files].slice(0, 5).forEach((file) => {
    const preview = document.createElement("div");
    preview.className = "media-thumb";
    const media = document.createElement(file.type.startsWith("video/") ? "video" : "img");
    media.src = URL.createObjectURL(file);
    if (media.tagName === "VIDEO") media.muted = true;
    const typeLabel = document.createElement("span");
    typeLabel.textContent = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
    preview.append(media, typeLabel);
    target.append(preview);
  });
}

async function requestAssessment(extraAnswers = [], extraMedia = []) {
  const response = await fetch("/api/assessment-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...collectAssessmentData(),
      followUpAnswers: collectQuestionAnswers(questionList),
      additionalAnswers: extraAnswers,
      additionalMedia: extraMedia,
      additionalMediaUnavailable: noMoreMedia.checked
    })
  });
  if (!response.ok) throw new Error("Assessment unavailable");
  return response.json();
}

function renderAssessment(result) {
  resultLoading.hidden = true;
  resultContent.hidden = false;
  resultAlert.textContent = `${result.urgency || "상태 확인 필요"} · ${result.alert || "현재 정보는 참고용입니다."}`;
  resultAlert.classList.toggle("urgent", /즉시|응급|지금/.test(result.urgency || "") || /즉시|응급/.test(result.alert || ""));
  resultSummary.textContent = result.summary || "입력된 정보와 증상을 종합한 참고 요약입니다.";
  resultConditions.innerHTML = "";
  (result.conditions || []).forEach((condition) => {
    const card = document.createElement("div");
    card.className = "condition-card";
    const name = document.createElement("strong");
    name.textContent = condition.name;
    const likelihood = document.createElement("span");
    likelihood.textContent = condition.likelihood || "추가 확인 필요";
    const reasoning = document.createElement("p");
    reasoning.textContent = condition.reasoning || "입력된 증상과 답변을 종합한 참고 의견입니다.";
    card.append(name, likelihood, reasoning);
    resultConditions.append(card);
  });
  resultActions.innerHTML = "";
  (result.actions || []).forEach((action) => {
    const item = document.createElement("li");
    item.textContent = action;
    resultActions.append(item);
  });
  const renderList = (target, values) => {
    target.innerHTML = "";
    (values || []).forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      target.append(item);
    });
  };
  renderList(resultRedFlags, result.redFlags);
  renderList(resultMonitoring, result.monitoring);
  renderList(resultVetPreparation, result.vetPreparation);
  resultVet.textContent = result.vetRecommendation || "상태가 지속되면 수의사와 상담하세요.";
  uncertainPanel.hidden = !result.needsMoreInfo;
  newAssessmentButton.hidden = Boolean(result.needsMoreInfo);
  if (result.needsMoreInfo) {
    renderQuestionCards(moreQuestionList, result.questions || []);
    const hasQuestions = Array.isArray(result.questions) && result.questions.length > 0;
    const hasMediaRequest = result.mediaRequest?.requested === true;
    mediaRequest.hidden = !hasMediaRequest;
    if (hasMediaRequest) {
      mediaRequestCopy.textContent = result.mediaRequest.reason || "이 자료가 있으면 상태를 더 정확히 확인할 수 있어요.";
      mediaUploadLabel.textContent = result.mediaRequest.label;
    }
    if (!hasQuestions && !hasMediaRequest) {
      uncertainPanel.hidden = true;
      newAssessmentButton.hidden = false;
    }
  }
}

async function showFifthStep() {
  questionPet.textContent = selectedPet.textContent;
  resultPet.textContent = selectedPet.textContent;
  fourthStep.hidden = true;
  fifthStep.hidden = false;
  resultLoading.hidden = false;
  resultContent.hidden = true;
  newAssessmentButton.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  try {
    const result = await requestAssessment();
    renderAssessment(result);
  } catch (error) {
    renderAssessment({ ...fallbackAssessmentForClient(), needsMoreInfo: true });
  }
}

function fallbackAssessmentForClient() {
  return {
    urgency: "추가 확인 필요",
    alert: "현재 정보만으로는 원인을 확정하기 어려워요.",
    summary: "현재 AI 분석을 완료하지 못했습니다.",
    conditions: [{ name: "원인 미정 증상", likelihood: "추가 확인 필요", reasoning: "분석 서버의 응답이 없어 원인을 좁힐 수 없습니다." }],
    actions: ["물을 마실 수 있는지 확인하세요.", "증상의 변화와 횟수를 기록하세요."],
    redFlags: ["호흡 곤란", "의식 저하", "출혈", "반복되는 구토·설사"],
    monitoring: ["증상 횟수", "식사와 물 섭취", "활력과 호흡"],
    vetPreparation: ["증상 시작 시각과 사진·영상", "복용 약과 과거 병력"],
    vetRecommendation: "증상이 지속되거나 악화되면 동물병원에서 진료를 받으세요.",
    needsMoreInfo: false,
    questions: []
  };
}

async function showFourthStep() {
  questionPet.textContent = selectedPet.textContent;
  thirdStep.hidden = true;
  fourthStep.hidden = false;
  questionStatus.textContent = "AI가 입력 내용을 살펴보고 있어요...";
  questionProgress.textContent = "질문 준비 중";
  questionList.innerHTML = '<div class="question-loading">입력하신 정보를 바탕으로 필요한 질문을 준비하고 있어요.</div>';
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const response = await fetch("/api/follow-up-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectAssessmentData())
    });
    if (!response.ok) throw new Error("AI API unavailable");
    const result = await response.json();
    if (!Array.isArray(result.questions) || result.questions.length === 0) {
      questionStatus.textContent = "추가 질문 없이 바로 분석합니다.";
      await showFifthStep();
      return;
    }
    renderFollowUpQuestions(result.questions);
    questionStatus.textContent = "AI가 현재 증상에 필요한 질문만 준비했어요.";
  } catch (error) {
    questionStatus.textContent = "추가 질문 없이 바로 분석합니다.";
    showFifthStep();
    return;
  }
}

speciesSelect.addEventListener("change", (event) => setBreedOptions(event.target.value));
breedSelect.addEventListener("change", (event) => {
  const isOther = event.target.value === "기타";
  otherInputWrap.hidden = !isOther;
  if (isOther) otherBreedInput.focus();
  updateButtonState();
});
otherBreedInput.addEventListener("input", updateButtonState);
continueButton.addEventListener("click", () => {
  showSecondStep();
});

backButton.addEventListener("click", () => {
  secondStep.hidden = true;
  introPanel.hidden = false;
  firstStep.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

finishButton.addEventListener("click", () => {
  if (validateBasicInfo()) showThirdStep();
});

symptomBackButton.addEventListener("click", () => {
  thirdStep.hidden = true;
  secondStep.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelectorAll('input[name="symptom"]').forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const count = document.querySelectorAll('input[name="symptom"]:checked').length;
    symptomProgress.textContent = `${count}개 선택`;
  });
});

mediaUpload.addEventListener("change", () => renderMediaPreviews(mediaUpload, mediaPreview));

symptomFinishButton.addEventListener("click", showFourthStep);
symptomFinishButton.addEventListener("click", (event) => {
  const hasDescription = document.querySelector("#symptom-description").value.trim();
  const hasSelectedSymptom = document.querySelector('input[name="symptom"]:checked');
  if (!hasDescription && !hasSelectedSymptom) {
    event.stopImmediatePropagation();
    symptomError.hidden = false;
    symptomError.textContent = "현재 상황을 글로 적거나 증상을 하나 이상 선택해주세요.";
    document.querySelector("#symptom-description").focus();
  } else {
    symptomError.hidden = true;
  }
}, true);

questionBackButton.addEventListener("click", () => {
  fourthStep.hidden = true;
  thirdStep.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

questionFinishButton.addEventListener("click", showFifthStep);
moreMediaUpload.addEventListener("change", () => renderMediaPreviews(moreMediaUpload, moreMediaPreview));
noMoreMedia.addEventListener("change", () => {
  moreMediaUpload.disabled = noMoreMedia.checked;
  if (noMoreMedia.checked) {
    moreMediaUpload.value = "";
    moreMediaPreview.innerHTML = "";
  }
});
reanalyzeButton.addEventListener("click", async () => {
  reanalyzeButton.disabled = true;
  reanalyzeButton.querySelector("span").textContent = "다시 분석하고 있어요...";
  try {
    const result = await requestAssessment(collectQuestionAnswers(moreQuestionList), fileMetadata(moreMediaUpload));
    renderAssessment(result);
  } catch (error) {
    resultAlert.textContent = "분석을 완료하지 못했어요. 잠시 후 다시 시도하거나 동물병원에 문의하세요.";
  } finally {
    reanalyzeButton.disabled = false;
    reanalyzeButton.querySelector("span").textContent = "추가 정보로 다시 분석하기";
  }
});

newAssessmentButton.addEventListener("click", () => window.location.reload());
