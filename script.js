const allMuscles = musclesData;
let currentImageIndex = 0;
let currentFilter = "all";
let currentBank = [...allMuscles];
const exerciseText = document.getElementById("exerciseText");
let currentIndex = 0;
let answerVisible = false;

const muscleName = document.getElementById("muscleName");
const muscleImage = document.getElementById("muscleImage");

const answerBox = document.getElementById("answerBox");
const originText = document.getElementById("originText");
const insertionText = document.getElementById("insertionText");
const actionText = document.getElementById("actionText");

const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const levelBadge = document.getElementById("levelBadge");

let muscleLevels = JSON.parse(localStorage.getItem("muscleLevels")) || {};

function splitAnswer(answer) {
  const origin = answer.match(/Origin:\s*(.*?)(?=Insertion:|Actions:|$)/i);
  const insertion = answer.match(/Insertion:\s*(.*?)(?=Actions:|$)/i);
  const action = answer.match(/Actions:\s*(.*)$/i);

  return {
    origin: origin ? origin[1].trim() : "",
    insertion: insertion ? insertion[1].trim() : "",
    action: action ? action[1].trim() : answer,
  };
}

function buildBank() {
  if (currentFilter === "easy") {
    currentBank = allMuscles.filter((m) => muscleLevels[m.id] === "easy");
  } else if (currentFilter === "hard") {
    currentBank = allMuscles.filter((m) => muscleLevels[m.id] === "hard");
  } else if (currentFilter === "unmarked") {
    currentBank = allMuscles.filter((m) => !muscleLevels[m.id]);
  } else {
    currentBank = [...allMuscles];
  }

  currentIndex = 0;

  if (currentBank.length === 0) {
    muscleName.textContent = "אין שאלות במצב הזה";
    muscleImage.src = "";
    originText.textContent = "";
    insertionText.textContent = "";
    actionText.textContent = "";
    progressText.textContent = "0 מתוך 0";
    progressBar.style.width = "0%";
    levelBadge.textContent = "אין נתונים";
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

  const parts = splitAnswer(muscle.answer);

  muscleName.textContent = muscle.q;
  currentImageIndex = 0;
  exerciseText.textContent =
    muscle.recommendedExercises || "No exercises listed";

  const images = muscle.images || [muscle.image];
  muscleImage.src = images[currentImageIndex];
  muscleImage.alt = muscle.q;

  originText.textContent = parts.origin;
  insertionText.textContent = parts.insertion;
  actionText.textContent = parts.action;

  answerVisible = false;
  answerBox.classList.remove("show");

  progressText.textContent = `שריר ${currentIndex + 1} מתוך ${currentBank.length}`;

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

  muscleLevels[muscle.id] = "easy";
  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function markHard() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  muscleLevels[muscle.id] = "hard";
  localStorage.setItem("muscleLevels", JSON.stringify(muscleLevels));
  updateLevelBadge();
}

function updateLevelBadge() {
  const muscle = currentBank[currentIndex];
  if (!muscle) return;

  const level = muscleLevels[muscle.id];

  if (level === "easy") {
    levelBadge.textContent = "קל";
    levelBadge.style.color = "#29d17d";
  } else if (level === "hard") {
    levelBadge.textContent = "קשה";
    levelBadge.style.color = "#ff4d6d";
  } else {
    levelBadge.textContent = "לא סומן";
    levelBadge.style.color = "#bdeaff";
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

buildBank();
