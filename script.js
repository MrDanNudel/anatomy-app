const banks = {
  lowerBodyMuscles: musclesData,
  lowerBodyBones: lowerBodyBonesData,
  general: generalData,
  footbones: footData,
  lowerBodyLigaments: lowerBodyLigamentsData,
  respiratorySystem: respiratorySystemData,
  nervousSystem: nervousSystemData,
  circulatorySystem: circulatorySystemData,
};

let isRandomMode = false;
let allMuscles = banks.lowerBodyMuscles;

let currentImageIndex = 0;
let currentFilter = "all";
let currentBank = [...allMuscles];
let currentIndex = 0;
let answerVisible = false;

let currentLanguage = localStorage.getItem("studyLanguage") || "en";

const muscleName = document.getElementById("muscleName");
const muscleImage = document.getElementById("muscleImage");

const answerBox = document.getElementById("answerBox");

const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const levelBadge = document.getElementById("levelBadge");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");

let muscleLevels = JSON.parse(localStorage.getItem("muscleLevels")) || {};

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function splitAnswer(answer = "") {
  const origin = answer.match(
    /(Origin|התחלה):\s*(.*?)(?=Insertion:|Actions:|Action:|אחיזה:|פעולות:|פעולה:|$)/i,
  );

  const insertion = answer.match(
    /(Insertion|אחיזה):\s*(.*?)(?=Actions:|Action:|פעולות:|פעולה:|$)/i,
  );

  const action = answer.match(/(Actions|Action|פעולות|פעולה):\s*(.*)$/i);

  return {
    origin: origin ? origin[2].trim() : "",
    insertion: insertion ? insertion[2].trim() : "",
    action: action ? action[2].trim() : answer,
  };
}

function getTranslatedField(item, fieldName) {
  if (currentLanguage === "he") {
    return item[`${fieldName}He`] || item[fieldName] || "";
  }

  return item[fieldName] || "";
}

function getAnswerText(item) {
  if (currentLanguage === "he") {
    return item.answerHe || item.answer || "";
  }

  return item.answer || "";
}

function getLabels() {
  if (currentLanguage === "he") {
    return {
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
    };
  }

  return {
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
      <strong class="${labelClass} answer-label">${labelText}</strong>
      <span class="answer-text">${text}</span>
    </p>
  `;
}

function renderAnswer(item) {
  answerBox.innerHTML = "";

  const labels = getLabels();

  answerBox.setAttribute("dir", currentLanguage === "he" ? "rtl" : "ltr");

  if (item.type === "system") {
    answerBox.innerHTML = `
      ${renderTranslateButton()}

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
    `;

    return;
  }

  const parts = splitAnswer(getAnswerText(item));

  answerBox.innerHTML = `
    ${renderTranslateButton()}

    ${createInfoRow("origin-label", labels.origin, parts.origin)}

    ${createInfoRow("insertion-label", labels.insertion, parts.insertion)}

    ${createInfoRow("action-label", labels.action, parts.action)}

    ${createInfoRow(
      "exercise-label",
      labels.exercises,
      getTranslatedField(item, "recommendedExercises") || "No exercises listed",
    )}
  `;
}

document.getElementById("topicSelect").addEventListener("change", (e) => {
  allMuscles = banks[e.target.value] || [];

  currentFilter = "all";
  currentIndex = 0;

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
    bank = allMuscles.filter((m) => muscleLevels[m.id] === "easy");
  } else if (currentFilter === "hard") {
    bank = allMuscles.filter((m) => muscleLevels[m.id] === "hard");
  } else if (currentFilter === "unmarked") {
    bank = allMuscles.filter((m) => !muscleLevels[m.id]);
  } else {
    bank = [...allMuscles];
  }

  currentBank = isRandomMode ? shuffleArray(bank) : bank;

  currentIndex = 0;

  if (currentBank.length === 0) {
    muscleName.textContent = "אין שאלות במצב הזה";
    muscleImage.src = "";
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

function loadMuscle() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  muscleName.textContent = muscle.q;
  currentImageIndex = 0;

  const images = muscle.images || [muscle.image];

  if (images && images[0]) {
    muscleImage.src = images[currentImageIndex];
  } else {
    muscleImage.src = "";
  }

  muscleImage.alt = muscle.q;

  renderAnswer(muscle);

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
    loadMuscle();
  }
}

function prevMuscle() {
  if (currentIndex > 0) {
    currentIndex--;
    loadMuscle();
  }
}

function markEasy() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const current = muscleLevels[muscle.id];

  if (current === "easy") {
    delete muscleLevels[muscle.id];
  } else if (current === "hard") {
    delete muscleLevels[muscle.id];
    muscleLevels[muscle.id] = "easy";
  } else {
    muscleLevels[muscle.id] = "easy";
  }

  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function markHard() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const current = muscleLevels[muscle.id];

  if (current === "hard") {
    delete muscleLevels[muscle.id];
  } else if (current === "easy") {
    delete muscleLevels[muscle.id];
    muscleLevels[muscle.id] = "hard";
  } else {
    muscleLevels[muscle.id] = "hard";
  }

  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function updateLevelBadge() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const level = muscleLevels[muscle.id];

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
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const images = muscle.images || [muscle.image];
  if (!images || images.length <= 1) return;

  currentImageIndex++;

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  muscleImage.src = images[currentImageIndex];
});

// לחיצה ימנית על התמונה — תמונה קודמת
muscleImage.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const images = muscle.images || [muscle.image];
  if (!images || images.length <= 1) return;

  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = images.length - 1;
  }

  muscleImage.src = images[currentImageIndex];
});

buildBank();
