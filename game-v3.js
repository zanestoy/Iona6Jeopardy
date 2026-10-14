let rounds = [];
let finalJeopardy = null;

let teams = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 }
];

let currentRoundIndex = 0;
let round2Multiplier = 2;
let roundTimerSettings = [
  { enabled: false, minutes: 10 },
  { enabled: false, minutes: 10 }
];
let roundTimerRemainingSeconds = 0;
let roundTimerRunning = false;
let roundTimerInterval = null;
let roundTimerDeadline = null;
let usedQuestions = new Set();
let activeQuestion = null;
let dailyDoubleKeys = new Set();
let dailyDoubleTeamIndex = null;
let dailyDoubleWager = 0;
let finalWagers = [];
let finalResolved = [];

const $ = id => document.getElementById(id);

function currentRound() {
  return rounds[currentRoundIndex];
}

function currentCategories() {
  return currentRound()?.categories || [];
}

function displayedValue(question) {
  return question.value * (currentRoundIndex === 1 ? round2Multiplier : 1);
}

function formatMoney(value) {
  return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
}

function renderRoundStatus() {
  const round = currentRound();
  if (!round) return;
  $("roundTitle").textContent = round.name.toUpperCase();
  $("roundSubtitle").textContent = currentRoundIndex === 1
    ? (round2Multiplier === 2 ? "Double values • 2 Daily Doubles" : "Standard values • 2 Daily Doubles")
    : "Standard values • 1 Daily Double";
  $("advanceRoundBtn").textContent = currentRoundIndex === 0 ? "Next: Double Jeopardy" : "Next: Final Jeopardy";
  $("advanceRoundBtn").classList.remove("hidden");
  renderRoundTimer();
}

function currentTimerSetting() {
  return roundTimerSettings[currentRoundIndex] || { enabled: false, minutes: 10 };
}

function configuredRoundSeconds(roundIndex = currentRoundIndex) {
  const setting = roundTimerSettings[roundIndex] || { minutes: 10 };
  return Math.max(60, Math.round(Number(setting.minutes || 10) * 60));
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderRoundTimer() {
  const panel = $("roundTimerPanel");
  const setting = currentTimerSetting();
  if (!setting.enabled) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  $("roundTimerDisplay").textContent = formatTimer(roundTimerRemainingSeconds);
  panel.classList.toggle("warning", roundTimerRemainingSeconds > 0 && roundTimerRemainingSeconds <= 60);
  $("roundTimerBtn").textContent = roundTimerRunning ? "Pause Timer" : (roundTimerRemainingSeconds <= 0 ? "Restart Timer" : "Start Round Timer");
}

function stopRoundTimer() {
  if (roundTimerInterval !== null) window.clearInterval(roundTimerInterval);
  roundTimerInterval = null;
  roundTimerDeadline = null;
  roundTimerRunning = false;
}

function resetRoundTimer() {
  stopRoundTimer();
  roundTimerRemainingSeconds = configuredRoundSeconds();
  renderRoundTimer();
}

function updateRoundTimerFromClock() {
  if (!roundTimerRunning || roundTimerDeadline === null) return;
  roundTimerRemainingSeconds = Math.max(0, Math.ceil((roundTimerDeadline - Date.now()) / 1000));
  renderRoundTimer();
  if (roundTimerRemainingSeconds <= 0) {
    stopRoundTimer();
    renderRoundTimer();
    if (!$("clueModal").classList.contains("hidden")) {
      $("clueModal").classList.add("hidden");
      activeQuestion = null;
      dailyDoubleTeamIndex = null;
      dailyDoubleWager = 0;
    }
    advanceRound();
  }
}

function toggleRoundTimer() {
  if (!currentTimerSetting().enabled) return;
  if (roundTimerRunning) {
    updateRoundTimerFromClock();
    stopRoundTimer();
    renderRoundTimer();
    return;
  }
  if (roundTimerRemainingSeconds <= 0) roundTimerRemainingSeconds = configuredRoundSeconds();
  roundTimerDeadline = Date.now() + roundTimerRemainingSeconds * 1000;
  roundTimerRunning = true;
  roundTimerInterval = window.setInterval(updateRoundTimerFromClock, 250);
  renderRoundTimer();
}

function renderScoreboard() {
  const board = $("scoreboard");
  board.innerHTML = "";
  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `<div class="team-name">${escapeHtml(team.name)}</div><div class="score">${formatMoney(team.score)}</div>`;
    board.appendChild(card);
  });
}

function questionKey(categoryIndex, questionIndex) {
  return `${categoryIndex}-${questionIndex}`;
}

function renderBoard() {
  const board = $("board");
  board.innerHTML = "";
  const categories = currentCategories();

  categories.forEach(category => {
    const header = document.createElement("div");
    header.className = "category";
    header.textContent = category.category;
    board.appendChild(header);
  });

  for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
    categories.forEach((category, categoryIndex) => {
      const question = category.questions[questionIndex];
      const key = questionKey(categoryIndex, questionIndex);
      const button = document.createElement("button");
      button.className = `cell ${usedQuestions.has(key) ? "used" : ""}`;
      button.textContent = usedQuestions.has(key) ? "" : formatMoney(displayedValue(question));
      button.disabled = usedQuestions.has(key);
      button.setAttribute("aria-label", `${category.category}, ${displayedValue(question)} dollars`);
      button.addEventListener("click", () => openQuestion(categoryIndex, questionIndex));
      board.appendChild(button);
    });
  }

  renderRoundStatus();
}

function assignDailyDoubles() {
  const allKeys = [];
  currentCategories().forEach((category, categoryIndex) => {
    category.questions.forEach((question, questionIndex) => allKeys.push(questionKey(categoryIndex, questionIndex)));
  });

  const count = currentRoundIndex === 0 ? 1 : 2;
  dailyDoubleKeys = new Set();
  while (dailyDoubleKeys.size < count && allKeys.length > 0) {
    dailyDoubleKeys.add(allKeys[Math.floor(Math.random() * allKeys.length)]);
  }
}

function populateTeamSelect(selectElement, selectedIndex = 0) {
  selectElement.innerHTML = "";
  teams.forEach((team, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = team.name;
    option.selected = index === selectedIndex;
    selectElement.appendChild(option);
  });
}

function getDailyDoubleMax(teamIndex) {
  const highestClueValue = Math.max(...currentCategories().flatMap(category => category.questions.map(displayedValue)));
  return Math.max(highestClueValue, Math.max(0, teams[teamIndex].score));
}

function updateDailyDoubleLimit() {
  const teamIndex = Number($("dailyDoubleTeamSelect").value || 0);
  const maxWager = getDailyDoubleMax(teamIndex);
  $("dailyDoubleWager").max = String(maxWager);
  if (Number($("dailyDoubleWager").value) > maxWager) $("dailyDoubleWager").value = String(maxWager);
  $("dailyDoubleLimit").textContent = `Maximum wager: ${formatMoney(maxWager)}`;
}

function openQuestion(categoryIndex, questionIndex) {
  const key = questionKey(categoryIndex, questionIndex);
  const isDailyDouble = dailyDoubleKeys.has(key);
  activeQuestion = { categoryIndex, questionIndex, key, isDailyDouble };
  usedQuestions.add(key);

  const category = currentCategories()[categoryIndex];
  const question = category.questions[questionIndex];
  const clueValue = displayedValue(question);

  $("modalCategory").textContent = category.category;
  $("modalValue").textContent = isDailyDouble ? "" : formatMoney(clueValue);
  $("modalClue").textContent = question.clue;
  $("modalAnswer").textContent = question.answer;
  $("modalAnswer").classList.add("hidden");
  $("scoringArea").classList.add("hidden");
  $("dailyDoubleBanner").classList.toggle("hidden", !isDailyDouble);
  $("dailyDoubleSetup").classList.toggle("hidden", !isDailyDouble);

  if (isDailyDouble) {
    $("modalClue").classList.add("hidden");
    $("showAnswerBtn").classList.add("hidden");
    populateTeamSelect($("dailyDoubleTeamSelect"));
    $("dailyDoubleWager").value = String(Math.min(clueValue, getDailyDoubleMax(0)));
    dailyDoubleTeamIndex = null;
    dailyDoubleWager = 0;
    updateDailyDoubleLimit();
  } else {
    $("modalClue").classList.remove("hidden");
    $("showAnswerBtn").classList.remove("hidden");
    populateTeamSelect($("scoringTeamSelect"));
    $("scoringTeamLabel").classList.remove("hidden");
  }

  $("clueModal").classList.remove("hidden");
  renderBoard();
}

function lockDailyDouble() {
  if (!activeQuestion?.isDailyDouble) return;
  const teamIndex = Number($("dailyDoubleTeamSelect").value);
  const wager = Number($("dailyDoubleWager").value);
  const maxWager = getDailyDoubleMax(teamIndex);

  if (!Number.isFinite(wager) || wager < 0 || wager > maxWager) {
    window.alert(`Enter a wager from $0 to ${formatMoney(maxWager)}.`);
    return;
  }

  dailyDoubleTeamIndex = teamIndex;
  dailyDoubleWager = wager;
  $("dailyDoubleSetup").classList.add("hidden");
  $("modalClue").classList.remove("hidden");
  $("modalValue").textContent = `${teams[teamIndex].name} wagered ${formatMoney(wager)}`;
  $("showAnswerBtn").classList.remove("hidden");
}

function showAnswer() {
  if (!activeQuestion) return;
  $("modalAnswer").classList.remove("hidden");
  $("showAnswerBtn").classList.add("hidden");
  $("scoringArea").classList.remove("hidden");
  $("scoringTeamLabel").classList.toggle("hidden", activeQuestion.isDailyDouble);
}

function scoreQuestion(result) {
  if (!activeQuestion) return;

  const question = currentCategories()[activeQuestion.categoryIndex].questions[activeQuestion.questionIndex];
  let teamIndex;
  let pointValue;

  if (activeQuestion.isDailyDouble) {
    if (dailyDoubleTeamIndex === null) return;
    teamIndex = dailyDoubleTeamIndex;
    pointValue = dailyDoubleWager;
  } else {
    teamIndex = Number($("scoringTeamSelect").value);
    pointValue = displayedValue(question);
  }

  if (result === "correct") teams[teamIndex].score += pointValue;
  if (result === "incorrect") teams[teamIndex].score -= pointValue;

  renderScoreboard();
  closeQuestion();
}

function closeQuestion() {
  $("clueModal").classList.add("hidden");
  activeQuestion = null;
  dailyDoubleTeamIndex = null;
  dailyDoubleWager = 0;
  renderBoard();
}

function isRoundComplete() {
  const total = currentCategories().reduce((sum, category) => sum + category.questions.length, 0);
  return total > 0 && usedQuestions.size >= total;
}

function startRound(roundIndex) {
  stopRoundTimer();
  currentRoundIndex = roundIndex;
  usedQuestions.clear();
  activeQuestion = null;
  assignDailyDoubles();
  $("finalJeopardyPanel").classList.add("hidden");
  $("board").classList.remove("hidden");
  resetRoundTimer();
  renderBoard();
}

function advanceRound() {
  stopRoundTimer();
  if (currentRoundIndex === 0) {
    startRound(1);
  } else {
    openFinalJeopardy();
  }
}

function setupTeamInputs() {
  const count = Number($("teamCountSelect").value);
  const container = $("teamNamesContainer");
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "team-input";
    wrapper.innerHTML = `<label for="teamName${i}">Team ${i + 1} Name</label><input id="teamName${i}" type="text" maxlength="30" value="${escapeAttribute(teams[i]?.name || `Team ${i + 1}`)}">`;
    container.appendChild(wrapper);
  }
}

function openSettings() {
  $("teamCountSelect").value = String(teams.length);
  $("round2ValueMode").value = round2Multiplier === 2 ? "double" : "same";
  $("round1TimerEnabled").checked = roundTimerSettings[0].enabled;
  $("round1TimerMinutes").value = String(roundTimerSettings[0].minutes);
  $("round2TimerEnabled").checked = roundTimerSettings[1].enabled;
  $("round2TimerMinutes").value = String(roundTimerSettings[1].minutes);
  setupTeamInputs();
  $("settingsModal").classList.remove("hidden");
}

function saveSettings() {
  const count = Number($("teamCountSelect").value);
  const newTeams = [];
  for (let i = 0; i < count; i++) {
    const input = $(`teamName${i}`);
    newTeams.push({ name: input?.value.trim() || `Team ${i + 1}`, score: teams[i]?.score || 0 });
  }
  teams = newTeams;
  round2Multiplier = $("round2ValueMode").value === "double" ? 2 : 1;

  const timerInputs = [
    { enabled: $("round1TimerEnabled").checked, minutes: Number($("round1TimerMinutes").value) },
    { enabled: $("round2TimerEnabled").checked, minutes: Number($("round2TimerMinutes").value) }
  ];
  for (const setting of timerInputs) {
    if (!Number.isFinite(setting.minutes) || setting.minutes < 1 || setting.minutes > 120) {
      window.alert("Round timer duration must be between 1 and 120 minutes.");
      return;
    }
  }
  roundTimerSettings = timerInputs;
  resetRoundTimer();
  renderScoreboard();
  renderBoard();
  $("settingsModal").classList.add("hidden");
}

function resetFinalJeopardy() {
  finalWagers = teams.map(() => 0);
  finalResolved = teams.map(() => false);
  $("finalJeopardyPanel").classList.add("hidden");
  $("finalClue").classList.add("hidden");
  $("finalAnswer").classList.add("hidden");
  $("finalScoring").classList.add("hidden");
  $("showFinalAnswerBtn").classList.add("hidden");
  $("returnToBoardBtn").classList.add("hidden");
}

function startNewGame() {
  teams.forEach(team => team.score = 0);
  resetFinalJeopardy();
  startRound(0);
  renderScoreboard();
}

function renderFinalWagers() {
  const container = $("finalWagers");
  container.innerHTML = "";
  teams.forEach((team, index) => {
    const maxWager = Math.max(0, team.score);
    const row = document.createElement("div");
    row.className = "final-wager-row";
    row.innerHTML = `
      <div><div class="final-score-team">${escapeHtml(team.name)}: ${formatMoney(team.score)}</div><div class="final-wager-note">Maximum wager: ${formatMoney(maxWager)}</div></div>
      <input id="finalWager${index}" type="number" min="0" max="${maxWager}" step="100" value="0" inputmode="numeric" ${maxWager === 0 ? "disabled" : ""}>
    `;
    container.appendChild(row);
  });
}

function openFinalJeopardy() {
  stopRoundTimer();
  finalWagers = teams.map(() => 0);
  finalResolved = teams.map(() => false);
  $("board").classList.add("hidden");
  $("advanceRoundBtn").classList.add("hidden");
  $("finalJeopardyPanel").classList.remove("hidden");
  $("finalCategory").textContent = finalJeopardy.category;
  $("finalClue").textContent = finalJeopardy.clue;
  $("finalAnswer").textContent = finalJeopardy.answer;
  $("finalWagerSection").classList.remove("hidden");
  $("finalClue").classList.add("hidden");
  $("finalAnswer").classList.add("hidden");
  $("finalScoring").classList.add("hidden");
  $("showFinalAnswerBtn").classList.add("hidden");
  $("returnToBoardBtn").classList.add("hidden");
  renderFinalWagers();
}

function lockFinalWagers() {
  const wagers = [];
  for (let i = 0; i < teams.length; i++) {
    const maxWager = Math.max(0, teams[i].score);
    const input = $(`finalWager${i}`);
    const wager = input?.disabled ? 0 : Number(input?.value);
    if (!Number.isFinite(wager) || wager < 0 || wager > maxWager) {
      window.alert(`${teams[i].name} must wager between $0 and ${formatMoney(maxWager)}.`);
      return;
    }
    wagers.push(wager);
  }
  finalWagers = wagers;
  $("finalWagerSection").classList.add("hidden");
  $("finalClue").classList.remove("hidden");
  $("showFinalAnswerBtn").classList.remove("hidden");
}

function showFinalAnswer() {
  $("finalAnswer").classList.remove("hidden");
  $("showFinalAnswerBtn").classList.add("hidden");
  $("finalScoring").classList.remove("hidden");
  renderFinalScoring();
}

function renderFinalScoring() {
  const container = $("finalScoring");
  container.innerHTML = "";
  teams.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "final-score-row";
    const resolved = finalResolved[index];
    row.innerHTML = `
      <div><strong>${escapeHtml(team.name)}</strong> • Wager ${formatMoney(finalWagers[index] || 0)}</div>
      <div class="scoring-buttons">
        <button class="correct-btn" data-final-index="${index}" data-result="correct" ${resolved ? "disabled" : ""}>Correct ✓</button>
        <button class="incorrect-btn" data-final-index="${index}" data-result="incorrect" ${resolved ? "disabled" : ""}>Incorrect ✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("button[data-final-index]").forEach(button => {
    button.addEventListener("click", () => scoreFinalTeam(Number(button.dataset.finalIndex), button.dataset.result));
  });

  if (finalResolved.every(Boolean)) $("returnToBoardBtn").classList.remove("hidden");
}

function scoreFinalTeam(index, result) {
  if (finalResolved[index]) return;
  const wager = finalWagers[index] || 0;
  teams[index].score += result === "correct" ? wager : -wager;
  finalResolved[index] = true;
  renderScoreboard();
  renderFinalScoring();
}

function returnToBoard() {
  $("finalJeopardyPanel").classList.add("hidden");
  $("board").classList.remove("hidden");
  renderBoard();
}

function escapeHtml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function escapeAttribute(text) { return escapeHtml(text); }

$("showAnswerBtn").addEventListener("click", showAnswer);
$("correctBtn").addEventListener("click", () => scoreQuestion("correct"));
$("incorrectBtn").addEventListener("click", () => scoreQuestion("incorrect"));
$("noScoreBtn").addEventListener("click", closeQuestion);
$("closeModalBtn").addEventListener("click", closeQuestion);
$("lockDailyDoubleBtn").addEventListener("click", lockDailyDouble);
$("dailyDoubleTeamSelect").addEventListener("change", updateDailyDoubleLimit);
$("settingsBtn").addEventListener("click", openSettings);
$("closeSettingsBtn").addEventListener("click", () => $("settingsModal").classList.add("hidden"));
$("teamCountSelect").addEventListener("change", setupTeamInputs);
$("saveSettingsBtn").addEventListener("click", saveSettings);
$("newGameBtn").addEventListener("click", () => $("newGameModal").classList.remove("hidden"));
$("cancelNewGameBtn").addEventListener("click", () => $("newGameModal").classList.add("hidden"));
$("confirmNewGameBtn").addEventListener("click", () => { startNewGame(); $("newGameModal").classList.add("hidden"); });
$("advanceRoundBtn").addEventListener("click", advanceRound);
$("roundTimerBtn").addEventListener("click", toggleRoundTimer);
$("lockFinalWagersBtn").addEventListener("click", lockFinalWagers);
$("showFinalAnswerBtn").addEventListener("click", showFinalAnswer);
$("returnToBoardBtn").addEventListener("click", returnToBoard);

$("finalJeopardyBtn").addEventListener("click", openFinalJeopardy);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!$("clueModal").classList.contains("hidden")) closeQuestion();
    if (!$("settingsModal").classList.contains("hidden")) $("settingsModal").classList.add("hidden");
    if (!$("newGameModal").classList.contains("hidden")) $("newGameModal").classList.add("hidden");
  }
});

async function loadGameData() {
  const response = await fetch("questions-v2.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load questions-v2.json (HTTP ${response.status}).`);
  const data = await response.json();
  validateGameData(data);
  rounds = data.rounds;
  finalJeopardy = data.finalJeopardy;
}

function validateGameData(data) {
  if (!data || !Array.isArray(data.rounds) || data.rounds.length !== 2) throw new Error("questions-v2.json must contain exactly two rounds.");
  data.rounds.forEach((round, roundIndex) => {
    if (!round || typeof round.name !== "string" || !round.name.trim()) throw new Error(`Round ${roundIndex + 1} is missing a valid name.`);
    if (!Array.isArray(round.categories) || round.categories.length !== 6) throw new Error(`${round.name} must contain exactly six categories.`);
    round.categories.forEach(category => {
      if (!category || typeof category.category !== "string" || !category.category.trim()) throw new Error(`${round.name} contains a category without a valid name.`);
      if (!Array.isArray(category.questions) || category.questions.length !== 5) throw new Error(`${category.category} must contain exactly five questions.`);
      category.questions.forEach((question, questionIndex) => {
        const label = `${round.name} / ${category.category} / clue ${questionIndex + 1}`;
        if (!Number.isFinite(question?.value) || question.value <= 0) throw new Error(`${label} needs a positive numeric value.`);
        if (typeof question?.clue !== "string" || !question.clue.trim()) throw new Error(`${label} is missing a clue.`);
        if (typeof question?.answer !== "string" || !question.answer.trim()) throw new Error(`${label} is missing an answer.`);
      });
    });
  });
  if (!data.finalJeopardy || !data.finalJeopardy.category?.trim() || !data.finalJeopardy.clue?.trim() || !data.finalJeopardy.answer?.trim()) {
    throw new Error("questions-v2.json must contain a valid finalJeopardy object.");
  }
}

function showLoadError(error) {
  console.error(error);
  $("board").innerHTML = `<div class="load-error"><strong>Unable to load game questions.</strong><span>${escapeHtml(error.message)}</span><span>Run the game through a local web server or GitHub Pages so the browser can load questions-v2.json.</span></div>`;
}

async function initializeGame() {
  renderScoreboard();
  $("board").innerHTML = '<div class="loading-message">Loading questions...</div>';
  try {
    await loadGameData();
    startRound(0);
  } catch (error) {
    showLoadError(error);
  }
}

initializeGame();
