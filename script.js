const banks = {
  lowerBodyMuscles: typeof musclesData !== "undefined" ? musclesData : [],

  lowerBodyBones:
    typeof lowerBodyBonesData !== "undefined" ? lowerBodyBonesData : [],

  general: typeof generalData !== "undefined" ? generalData : [],

  footbones: typeof footData !== "undefined" ? footData : [],

  lowerBodyLigaments:
    typeof lowerBodyLigamentsData !== "undefined" ? lowerBodyLigamentsData : [],

  respiratorySystem:
    typeof respiratorySystemData !== "undefined" ? respiratorySystemData : [],

  nervousSystem:
    typeof nervousSystemData !== "undefined" ? nervousSystemData : [],

  circulatorySystem:
    typeof circulatorySystemData !== "undefined" ? circulatorySystemData : [],

  upperBodyData: typeof upperBodyData !== "undefined" ? upperBodyData : [],

  upperBodyMuscles:
    typeof upperBodyMusclesData !== "undefined" ? upperBodyMusclesData : [],
};

let isRandomMode = false;

let currentImageIndex = 0;
let currentFilter = "all";
let currentBank = [];
let currentIndex = 0;
let answerVisible = false;

let currentLanguage = localStorage.getItem("studyLanguage") || "en";

const topicSelect = document.getElementById("topicSelect");

const muscleName = document.getElementById("muscleName");
const subTitle = document.getElementById("subTitle");
const muscleImage = document.getElementById("muscleImage");

const answerBox = document.getElementById("answerBox");

const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const levelBadge = document.getElementById("levelBadge");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");

let allMuscles = banks[topicSelect.value] || [];

let muscleLevels = JSON.parse(localStorage.getItem("muscleLevels")) || {};

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitAnswer(answer = "") {
  const origin = answer.match(
    /(Origin|התחלה):\s*(.*?)(?=Insertion:|Actions:|Action:|אחיזה:|פעולות:|פעולה:|$)/is,
  );

  const insertion = answer.match(
    /(Insertion|אחיזה):\s*(.*?)(?=Actions:|Action:|פעולות:|פעולה:|$)/is,
  );

  const action = answer.match(/(Actions|Action|פעולות|פעולה):\s*(.*)$/is);

  return {
    origin: origin ? origin[2].trim() : "",
    insertion: insertion ? insertion[2].trim() : "",
    action: action ? action[2].trim() : answer,
  };
}

function getItemType(item) {
  if (item.type) return item.type;

  if (
    item.origin ||
    item.originHe ||
    item.originHebrew ||
    item.insertion ||
    item.insertionHe ||
    item.insertionHebrew ||
    item.actions ||
    item.actionsHe ||
    item.actionsHebrew ||
    item.recommendedExercises ||
    item.recommendedExercisesHe ||
    item.recommendedExercisesHebrew
  ) {
    return "muscle";
  }

  if (
    item.answer &&
    /Origin:|Insertion:|Actions:|Action:|התחלה:|אחיזה:|פעולות:|פעולה:/i.test(
      item.answer,
    )
  ) {
    return "muscle";
  }

  return "default";
}

function getTranslatedField(item, fieldName) {
  if (currentLanguage === "he") {
    return (
      item[`${fieldName}He`] ||
      item[`${fieldName}Hebrew`] ||
      item[fieldName] ||
      ""
    );
  }

  return item[fieldName] || "";
}

function getAnswerText(item) {
  if (currentLanguage === "he") {
    return item.answerHe || item.answerHebrew || item.answer || "";
  }

  return item.answer || "";
}

function getMainTitle(item) {
  return item.q || item.title || item.name || "שם הפריט";
}

function getSubtitle(item) {
  const type = getItemType(item);

  if (type === "muscle") {
    return (
      item.qHebrew ||
      item.qHe ||
      item.hebrewName ||
      item.nameHebrew ||
      item.subtopic ||
      "שריר"
    );
  }

  if (type === "system") {
    return item.subtopic || "מערכת אנטומית";
  }

  if (type === "bone") {
    return item.subtopic || "עצם";
  }

  if (type === "joint") {
    return item.subtopic || "מפרק";
  }

  if (type === "ligament") {
    return item.subtopic || "רצועה";
  }

  return item.subtopic || "";
}

function getLabels() {
  if (currentLanguage === "he") {
    return {
      description: "🧠 תיאור כללי:",
      explanation: "🧠 הסבר:",
      location: "📍 מיקום:",
      pathway: "🔄 מסלול / מעבר מידע:",
      functions: "⚡ תפקידים:",
      keyStructures: "🧩 מבנים מרכזיים:",
      influencingFactors: "🧪 גורמים משפיעים:",
      recommendedExercises: "📚 תרגול מומלץ:",

      origin: "📍 התחלה:",
      insertion: "🔗 אחיזה:",
      action: "⚡ פעולה:",
      exercises: "🏋️ תרגילים מומלצים:",

      answer: "📘 תשובה:",
    };
  }

  return {
    description: "🧠 General Description:",
    explanation: "🧠 Explanation:",
    location: "📍 Location:",
    pathway: "🔄 Pathway:",
    functions: "⚡ Functions:",
    keyStructures: "🧩 Key Structures:",
    influencingFactors: "🧪 Influencing Factors:",
    recommendedExercises: "📚 Study Practice:",

    origin: "📍 Origin:",
    insertion: "🔗 Insertion:",
    action: "⚡ Action:",
    exercises: "🏋️ Recommended Exercises:",

    answer: "📘 Answer:",
  };
}

function renderTranslateButton() {
  return `
    <div class="answer-toolbar">
      <button id="answerTranslateBtn" class="translate-btn" type="button">
        ${currentLanguage === "en" ? "עברית" : "English"}
      </button>
    </div>
  `;
}

function createInfoRow(labelClass, labelText, text) {
  if (!text) return "";

  return `
    <p class="answer-row">
      <strong class="${labelClass} answer-label">${escapeHTML(labelText)}</strong>
      <span class="answer-text">${escapeHTML(text)}</span>
    </p>
  `;
}

function renderSystemAnswer(item) {
  const labels = getLabels();

  const content = `
    ${createInfoRow(
      "origin-label",
      labels.explanation,
      getTranslatedField(item, "explanation"),
    )}

    ${createInfoRow(
      "insertion-label",
      labels.location,
      getTranslatedField(item, "location"),
    )}

    ${createInfoRow(
      "action-label",
      labels.pathway,
      getTranslatedField(item, "pathway"),
    )}

    ${createInfoRow(
      "action-label",
      labels.functions,
      getTranslatedField(item, "functions"),
    )}

    ${createInfoRow(
      "origin-label",
      labels.keyStructures,
      getTranslatedField(item, "keyStructures"),
    )}

    ${createInfoRow(
      "insertion-label",
      labels.influencingFactors,
      getTranslatedField(item, "influencingFactors"),
    )}

    ${createInfoRow(
      "exercise-label",
      labels.recommendedExercises,
      getTranslatedField(item, "recommendedExercises"),
    )}

    ${createInfoRow("origin-label", labels.answer, getAnswerText(item))}
  `;

  return content;
}

function renderMuscleAnswer(item) {
  const labels = getLabels();

  const answerParts = splitAnswer(getAnswerText(item));

  const description =
    getTranslatedField(item, "description") ||
    getTranslatedField(item, "generalDescription");

  const origin = getTranslatedField(item, "origin") || answerParts.origin;

  const insertion =
    getTranslatedField(item, "insertion") || answerParts.insertion;

  const action =
    getTranslatedField(item, "actions") ||
    getTranslatedField(item, "action") ||
    answerParts.action;

  const exercises =
    getTranslatedField(item, "recommendedExercises") ||
    getTranslatedField(item, "exercises");

  return `
    ${createInfoRow("description-label", labels.description, description)}

    ${createInfoRow("origin-label", labels.origin, origin)}

    ${createInfoRow("insertion-label", labels.insertion, insertion)}

    ${createInfoRow("action-label", labels.action, action)}

    ${createInfoRow("exercise-label", labels.exercises, exercises)}
  `;
}

function renderDefaultAnswer(item) {
  const labels = getLabels();

  const answer = getAnswerText(item);

  return `
    ${createInfoRow("origin-label", labels.answer, answer)}
  `;
}

function renderAnswer(item) {
  answerBox.innerHTML = "";

  const type = getItemType(item);

  answerBox.setAttribute("dir", currentLanguage === "he" ? "rtl" : "ltr");

  let content = "";

  if (type === "system") {
    content = renderSystemAnswer(item);
  } else if (type === "muscle") {
    content = renderMuscleAnswer(item);
  } else {
    content = renderDefaultAnswer(item);
  }

  answerBox.innerHTML = `
    ${renderTranslateButton()}
    ${content}
  `;
}

topicSelect.addEventListener("change", (e) => {
  allMuscles = banks[e.target.value] || [];

  currentFilter = "all";
  currentIndex = 0;
  currentImageIndex = 0;

  buildBank();
});

randomBtn.addEventListener("click", () => {
  isRandomMode = !isRandomMode;

  randomBtn.textContent = isRandomMode ? "לפי הסדר" : "רנדומלי";

  buildBank();
});

resetBtn.addEventListener("click", () => {
  allMuscles.forEach((item) => {
    delete muscleLevels[item.id];
  });

  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));

  currentFilter = "all";
  currentIndex = 0;
  currentImageIndex = 0;

  buildBank();
});

answerBox.addEventListener("click", (e) => {
  const translateButton = e.target.closest("#answerTranslateBtn");

  if (!translateButton) return;

  currentLanguage = currentLanguage === "en" ? "he" : "en";

  localStorage.setItem("studyLanguage", currentLanguage);

  const currentItem = currentBank[currentIndex];

  if (currentItem) {
    renderAnswer(currentItem);
    answerVisible = true;
    answerBox.classList.add("show");
  }
});

function buildBank() {
  let bank;

  if (currentFilter === "easy") {
    bank = allMuscles.filter((item) => muscleLevels[item.id] === "easy");
  } else if (currentFilter === "hard") {
    bank = allMuscles.filter((item) => muscleLevels[item.id] === "hard");
  } else if (currentFilter === "unmarked") {
    bank = allMuscles.filter((item) => !muscleLevels[item.id]);
  } else {
    bank = [...allMuscles];
  }

  currentBank = isRandomMode ? shuffleArray(bank) : bank;

  currentIndex = 0;
  currentImageIndex = 0;

  if (currentBank.length === 0) {
    muscleName.textContent = "אין שאלות במצב הזה";
    subTitle.textContent = "";
    muscleImage.src = "";
    muscleImage.alt = "";
    answerBox.innerHTML = "";
    progressText.textContent = "0 מתוך 0";
    progressBar.style.width = "0%";

    levelBadge.textContent = "";
    levelBadge.style.backgroundColor = "transparent";
    levelBadge.style.borderColor = "transparent";
    levelBadge.style.boxShadow = "none";

    return;
  }

  loadMuscle();
}

function setFilter(filterName) {
  currentFilter = filterName;
  buildBank();
}

function getImages(item) {
  if (item.images && Array.isArray(item.images)) {
    return item.images.filter(Boolean);
  }

  if (item.image) {
    return [item.image];
  }

  return [];
}

function loadMuscle() {
  const item = currentBank[currentIndex];
  if (!item) return;

  muscleName.textContent = getMainTitle(item);
  subTitle.textContent = getSubtitle(item);

  currentImageIndex = 0;

  const images = getImages(item);

  if (images.length > 0) {
    muscleImage.src = images[currentImageIndex];
    muscleImage.style.display = "block";
  } else {
    muscleImage.src = "";
    muscleImage.style.display = "none";
  }

  muscleImage.alt = getMainTitle(item);

  renderAnswer(item);

  answerVisible = false;
  answerBox.classList.remove("show");

  progressText.textContent = `כרטיס ${currentIndex + 1} מתוך ${currentBank.length}`;

  const percent = ((currentIndex + 1) / currentBank.length) * 100;
  progressBar.style.width = `${percent}%`;

  updateLevelBadge();
}

function nextMuscle() {
  if (currentIndex < currentBank.length - 1) {
    currentIndex++;
    currentImageIndex = 0;
    loadMuscle();
  }
}

function prevMuscle() {
  if (currentIndex > 0) {
    currentIndex--;
    currentImageIndex = 0;
    loadMuscle();
  }
}

function markEasy() {
  const item = currentBank[currentIndex];
  if (!item) return;

  const current = muscleLevels[item.id];

  if (current === "easy") {
    delete muscleLevels[item.id];
  } else {
    muscleLevels[item.id] = "easy";
  }

  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function markHard() {
  const item = currentBank[currentIndex];
  if (!item) return;

  const current = muscleLevels[item.id];

  if (current === "hard") {
    delete muscleLevels[item.id];
  } else {
    muscleLevels[item.id] = "hard";
  }

  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function updateLevelBadge() {
  const item = currentBank[currentIndex];
  if (!item) return;

  const level = muscleLevels[item.id];

  levelBadge.textContent = "";

  if (level === "easy") {
    levelBadge.style.backgroundColor = "#29d17d";
    levelBadge.style.borderColor = "#29d17d";
    levelBadge.style.boxShadow =
      "0 0 8px rgba(41,209,125,.8), 0 0 16px rgba(41,209,125,.4)";
  } else if (level === "hard") {
    levelBadge.style.backgroundColor = "#ff4d6d";
    levelBadge.style.borderColor = "#ff4d6d";
    levelBadge.style.boxShadow =
      "0 0 8px rgba(255,77,109,.8), 0 0 16px rgba(255,77,109,.4)";
  } else {
    levelBadge.style.backgroundColor = "transparent";
    levelBadge.style.borderColor = "rgba(255,255,255,.35)";
    levelBadge.style.boxShadow = "none";
  }
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (e.code === "Space") {
    e.preventDefault();

    answerVisible = !answerVisible;
    answerBox.classList.toggle("show", answerVisible);
  }

  if (e.key === "ArrowLeft") nextMuscle();
  if (e.key === "ArrowRight") prevMuscle();

  if (key === "e") markEasy();
  if (key === "h") markHard();
});

// לחיצה שמאלית על התמונה — תמונה הבאה
muscleImage.addEventListener("click", () => {
  const item = currentBank[currentIndex];
  if (!item) return;

  const images = getImages(item);
  if (images.length <= 1) return;

  currentImageIndex++;

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  muscleImage.src = images[currentImageIndex];
});

// לחיצה ימנית על התמונה — תמונה קודמת
muscleImage.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const item = currentBank[currentIndex];
  if (!item) return;

  const images = getImages(item);
  if (images.length <= 1) return;

  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = images.length - 1;
  }

  muscleImage.src = images[currentImageIndex];
});

buildBank();
