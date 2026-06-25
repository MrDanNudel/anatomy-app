const banks = {
  lowerBodyMuscles: musclesData,
  lowerBodyBones: lowerBodyBonesData,
  general: generalData,
  footbones: footData,
  lowerBodyLigaments: lowerBodyLigamentsData,
  respiratorySystem: respiratorySystemData,
  nervousSystem: nervousSystemData,
};

let isRandomMode = false;
let allMuscles = banks.lowerBodyMuscles;

let currentImageIndex = 0;
let currentFilter = "all";
let currentBank = [...allMuscles];
let currentIndex = 0;
let answerVisible = false;

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
    /Origin:\s*(.*?)(?=Insertion:|Actions:|Action:|$)/i,
  );
  const insertion = answer.match(/Insertion:\s*(.*?)(?=Actions:|Action:|$)/i);
  const action = answer.match(/Actions?:\s*(.*)$/i);

  return {
    origin: origin ? origin[1].trim() : "",
    insertion: insertion ? insertion[1].trim() : "",
    action: action ? action[1].trim() : answer,
  };
}

function createInfoRow(labelClass, labelText, text) {
  if (!text) return "";

  return `
    <p>
      <strong class="${labelClass}">${labelText}</strong>
      <span>${text}</span>
    </p>
  `;
}

function renderAnswer(item) {
  answerBox.innerHTML = "";

  if (item.type === "system") {
    answerBox.innerHTML = `
      ${createInfoRow("origin-label", "🧠 Explanation:", item.explanation)}

      ${createInfoRow("insertion-label", "📍 Location:", item.location)}

      ${createInfoRow("action-label", "🔄 Pathway:", item.pathway)}

      ${createInfoRow("action-label", "⚡ Functions:", item.functions)}

      ${createInfoRow("origin-label", "🧩 Key Structures:", item.keyStructures)}

      ${createInfoRow(
        "insertion-label",
        "🧪 Influencing Factors:",
        item.influencingFactors,
      )}

      ${createInfoRow(
        "exercise-label",
        "📚 Study Practice:",
        item.recommendedExercises,
      )}
    `;

    return;
  }

  const parts = splitAnswer(item.answer || "");

  answerBox.innerHTML = `
    ${createInfoRow("origin-label", "📍 Origin:", parts.origin)}

    ${createInfoRow("insertion-label", "🔗 Insertion:", parts.insertion)}

    ${createInfoRow("action-label", "⚡ Action:", parts.action)}

    ${createInfoRow(
      "exercise-label",
      "🏋️ Recommended Exercises:",
      item.recommendedExercises || "No exercises listed",
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
