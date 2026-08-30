/*
 * JEOPARDY GAME DATA
 *
 * Questions are loaded from questions.json when the page starts.
 * Edit that file to replace categories, clues, answers, values, and Final Jeopardy.
 */

let gameData = [];
let finalJeopardy = null;

let teams = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 }
];

let usedQuestions = new Set();
let activeQuestion = null;
let dailyDoubleKey = null;
let dailyDoubleTeamIndex = null;
let dailyDoubleWager = 0;
let finalStarted = false;
let finalWagers = [];
let finalResolved = [];

const $ = id => document.getElementById(id);

function formatMoney(value) {
  return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
}

function renderScoreboard() {
  const board = $("scoreboard");
  board.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `
      <div class="team-name">${escapeHtml(team.name)}</div>
      <div class="score">${formatMoney(team.score)}</div>
    `;
    board.appendChild(card);
  });
}

function renderBoard() {
  const board = $("board");
  board.innerHTML = "";

  gameData.forEach(category => {
    const header = document.createElement("div");
    header.className = "category";
    header.textContent = category.category;
    board.appendChild(header);
  });

  for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
    gameData.forEach((category, categoryIndex) => {
      const question = category.questions[questionIndex];
      const key = `${categoryIndex}-${questionIndex}`;
      const button = document.createElement("button");
      button.className = `cell ${usedQuestions.has(key) ? "used" : ""}`;
      button.textContent = usedQuestions.has(key) ? "" : `$${question.value}`;
      button.disabled = usedQuestions.has(key);
      button.setAttribute("aria-label", `${category.category}, ${question.value} dollars`);
      button.addEventListener("click", () => openQuestion(categoryIndex, questionIndex));
      board.appendChild(button);
    });
  }
}

function assignDailyDouble() {
  const possibleKeys = [];
  gameData.forEach((category, categoryIndex) => {
    category.questions.forEach((question, questionIndex) => {
      possibleKeys.push(`${categoryIndex}-${questionIndex}`);
    });
  });
  dailyDoubleKey = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
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
  // For this single-board game, allow a true Daily Double up to the team's
  // positive score, with the highest board value as the minimum maximum.
  const highestClueValue = Math.max(...gameData.flatMap(category => category.questions.map(q => q.value)));
  return Math.max(highestClueValue, Math.max(0, teams[teamIndex].score));
}

function updateDailyDoubleLimit() {
  const teamIndex = Number($("dailyDoubleTeamSelect").value || 0);
  const maxWager = getDailyDoubleMax(teamIndex);
  $("dailyDoubleWager").max = String(maxWager);
  if (Number($("dailyDoubleWager").value) > maxWager) {
    $("dailyDoubleWager").value = String(maxWager);
  }
  $("dailyDoubleLimit").textContent = `Maximum wager: ${formatMoney(maxWager)}`;
}

function openQuestion(categoryIndex, questionIndex) {
  const key = `${categoryIndex}-${questionIndex}`;
  const isDailyDouble = key === dailyDoubleKey;
  activeQuestion = { categoryIndex, questionIndex, key, isDailyDouble };
  usedQuestions.add(key);

  const category = gameData[categoryIndex];
  const question = category.questions[questionIndex];

  $("modalCategory").textContent = category.category;
  $("modalValue").textContent = isDailyDouble ? "" : formatMoney(question.value);
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
    $("dailyDoubleWager").value = String(Math.min(question.value, getDailyDoubleMax(0)));
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

  if (activeQuestion.isDailyDouble) {
    $("scoringTeamLabel").classList.add("hidden");
  } else {
    $("scoringTeamLabel").classList.remove("hidden");
  }
}

function scoreQuestion(result) {
  if (!activeQuestion) return;

  const question = gameData[activeQuestion.categoryIndex].questions[activeQuestion.questionIndex];
  let teamIndex;
  let pointValue;

  if (activeQuestion.isDailyDouble) {
    if (dailyDoubleTeamIndex === null) return;
    teamIndex = dailyDoubleTeamIndex;
    pointValue = dailyDoubleWager;
  } else {
    teamIndex = Number($("scoringTeamSelect").value);
    pointValue = question.value;
  }

  if (result === "correct") {
    teams[teamIndex].score += pointValue;
  } else if (result === "incorrect") {
    teams[teamIndex].score -= pointValue;
  }

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

function setupTeamInputs() {
  const count = Number($("teamCountSelect").value);
  const container = $("teamNamesContainer");
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "team-input";
    wrapper.innerHTML = `
      <label for="teamName${i}">Team ${i + 1} Name</label>
      <input id="teamName${i}" type="text" maxlength="30" value="${escapeAttribute(teams[i]?.name || `Team ${i + 1}`)}">
    `;
    container.appendChild(wrapper);
  }
}

function openSettings() {
  $("teamCountSelect").value = String(teams.length);
  setupTeamInputs();
  $("settingsModal").classList.remove("hidden");
}

function saveSettings() {
  const count = Number($("teamCountSelect").value);
  const newTeams = [];

  for (let i = 0; i < count; i++) {
    const input = $(`teamName${i}`);
    newTeams.push({
      name: input?.value.trim() || `Team ${i + 1}`,
      score: teams[i]?.score || 0
    });
  }

  teams = newTeams;
  renderScoreboard();
  $("settingsModal").classList.add("hidden");
}

function resetFinalJeopardy() {
  finalStarted = false;
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
  usedQuestions.clear();
  activeQuestion = null;
  assignDailyDouble();
  resetFinalJeopardy();
  $("board").classList.remove("hidden");
  renderScoreboard();
  renderBoard();
}

function renderFinalWagers() {
  const container = $("finalWagers");
  container.innerHTML = "";

  teams.forEach((team, index) => {
    const maxWager = Math.max(0, team.score);
    const row = document.createElement("div");
    row.className = "final-wager-row";
    row.innerHTML = `
      <div>
        <div class="final-score-team">${escapeHtml(team.name)}: ${formatMoney(team.score)}</div>
        <div class="final-wager-note">Maximum wager: ${formatMoney(maxWager)}</div>
      </div>
      <input id="finalWager${index}" type="number" min="0" max="${maxWager}" step="100" value="0" inputmode="numeric" ${maxWager === 0 ? "disabled" : ""}>
    `;
    container.appendChild(row);
  });
}

function openFinalJeopardy() {
  finalStarted = true;
  finalWagers = teams.map(() => 0);
  finalResolved = teams.map(() => false);

  $("board").classList.add("hidden");
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
    const input = $(`finalWager${i}`);
    const maxWager = Math.max(0, teams[i].score);
    const wager = input?.disabled ? 0 : Number(input?.value);

    if (!Number.isFinite(wager) || wager < 0 || wager > maxWager) {
      window.alert(`${teams[i].name}'s wager must be between $0 and ${formatMoney(maxWager)}.`);
      return;
    }
    wagers.push(wager);
  }

  finalWagers = wagers;
  $("finalWagerSection").classList.add("hidden");
  $("finalClue").classList.remove("hidden");
  $("showFinalAnswerBtn").classList.remove("hidden");
}

function renderFinalScoring() {
  const container = $("finalScoring");
  container.innerHTML = "";

  teams.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = `final-score-row ${finalResolved[index] ? "resolved" : ""}`;

    const resultText = finalResolved[index]
      ? `<div class="final-result-note">Scored. Current total: ${formatMoney(team.score)}</div>`
      : `<div class="final-result-note">Wager: ${formatMoney(finalWagers[index])}</div>`;

    row.innerHTML = `
      <div>
        <div class="final-score-team">${escapeHtml(team.name)}</div>
        ${resultText}
      </div>
      <div class="final-score-actions">
        <button class="correct-btn" data-final-team="${index}" data-result="correct" ${finalResolved[index] ? "disabled" : ""}>Correct ✓</button>
        <button class="incorrect-btn" data-final-team="${index}" data-result="incorrect" ${finalResolved[index] ? "disabled" : ""}>Incorrect ✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("button[data-final-team]").forEach(button => {
    button.addEventListener("click", () => {
      scoreFinalTeam(Number(button.dataset.finalTeam), button.dataset.result);
    });
  });
}

function showFinalAnswer() {
  $("finalAnswer").classList.remove("hidden");
  $("showFinalAnswerBtn").classList.add("hidden");
  $("finalScoring").classList.remove("hidden");
  renderFinalScoring();
}

function scoreFinalTeam(teamIndex, result) {
  if (finalResolved[teamIndex]) return;

  const wager = finalWagers[teamIndex] || 0;
  if (result === "correct") {
    teams[teamIndex].score += wager;
  } else {
    teams[teamIndex].score -= wager;
  }

  finalResolved[teamIndex] = true;
  renderScoreboard();
  renderFinalScoring();

  if (finalResolved.every(Boolean)) {
    $("returnToBoardBtn").classList.remove("hidden");
  }
}

function returnToBoard() {
  $("finalJeopardyPanel").classList.add("hidden");
  $("board").classList.remove("hidden");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(text) {
  return escapeHtml(text);
}

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
$("confirmNewGameBtn").addEventListener("click", () => {
  startNewGame();
  $("newGameModal").classList.add("hidden");
});

$("finalJeopardyBtn").addEventListener("click", openFinalJeopardy);
$("lockFinalWagersBtn").addEventListener("click", lockFinalWagers);
$("showFinalAnswerBtn").addEventListener("click", showFinalAnswer);
$("returnToBoardBtn").addEventListener("click", returnToBoard);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!$("clueModal").classList.contains("hidden")) closeQuestion();
    if (!$("settingsModal").classList.contains("hidden")) $("settingsModal").classList.add("hidden");
    if (!$("newGameModal").classList.contains("hidden")) $("newGameModal").classList.add("hidden");
  }
});

// Host shortcut: F = Final Jeopardy.
document.addEventListener("keydown", event => {
  if (event.key.toLowerCase() === "f" &&
      $("clueModal").classList.contains("hidden") &&
      $("settingsModal").classList.contains("hidden") &&
      $("newGameModal").classList.contains("hidden")) {
    openFinalJeopardy();
  }
});

async function loadGameData() {
  const response = await fetch("questions.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load questions.json (HTTP ${response.status}).`);
  }

  const data = await response.json();
  validateGameData(data);
  gameData = data.categories;
  finalJeopardy = data.finalJeopardy;
}

function validateGameData(data) {
  if (!data || !Array.isArray(data.categories) || data.categories.length === 0) {
    throw new Error("questions.json must contain a non-empty 'categories' array.");
  }

  const expectedQuestionCount = 5;
  data.categories.forEach((category, categoryIndex) => {
    if (!category || typeof category.category !== "string" || !category.category.trim()) {
      throw new Error(`Category ${categoryIndex + 1} is missing a valid 'category' name.`);
    }
    if (!Array.isArray(category.questions) || category.questions.length !== expectedQuestionCount) {
      throw new Error(`${category.category} must contain exactly ${expectedQuestionCount} questions.`);
    }

    category.questions.forEach((question, questionIndex) => {
      const label = `${category.category}, question ${questionIndex + 1}`;
      if (!Number.isFinite(question?.value) || question.value < 0) {
        throw new Error(`${label} needs a non-negative numeric 'value'.`);
      }
      if (typeof question?.clue !== "string" || !question.clue.trim()) {
        throw new Error(`${label} is missing a valid 'clue'.`);
      }
      if (typeof question?.answer !== "string" || !question.answer.trim()) {
        throw new Error(`${label} is missing a valid 'answer'.`);
      }
    });
  });

  if (!data.finalJeopardy ||
      typeof data.finalJeopardy.category !== "string" ||
      typeof data.finalJeopardy.clue !== "string" ||
      typeof data.finalJeopardy.answer !== "string" ||
      !data.finalJeopardy.category.trim() ||
      !data.finalJeopardy.clue.trim() ||
      !data.finalJeopardy.answer.trim()) {
    throw new Error("questions.json must contain a valid 'finalJeopardy' object with category, clue, and answer.");
  }
}

function showLoadError(error) {
  console.error(error);
  $("board").innerHTML = `
    <div class="load-error">
      <strong>Unable to load game questions.</strong>
      <span>${escapeHtml(error.message)}</span>
      <span>If you opened index.html directly from your computer, run the game through a local web server or GitHub Pages so the browser can load questions.json.</span>
    </div>
  `;
}

async function initializeGame() {
  renderScoreboard();
  $("board").innerHTML = '<div class="loading-message">Loading questions...</div>';

  try {
    await loadGameData();
    assignDailyDouble();
    renderBoard();
  } catch (error) {
    showLoadError(error);
  }
}

initializeGame();
