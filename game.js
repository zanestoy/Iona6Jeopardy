/*
 * JEOPARDY GAME DATA
 * Replace the sample categories/questions below with your own.
 *
 * Each category needs exactly five questions:
 * 100, 200, 300, 400, 500
 */

const gameData = [
  {
    category: "Science",
    questions: [
      { value: 100, clue: "This planet is known as the Red Planet.", answer: "What is Mars?" },
      { value: 200, clue: "This force keeps objects attracted to Earth.", answer: "What is gravity?" },
      { value: 300, clue: "This gas makes up most of Earth's atmosphere.", answer: "What is nitrogen?" },
      { value: 400, clue: "This is the process plants use to convert light into chemical energy.", answer: "What is photosynthesis?" },
      { value: 500, clue: "This subatomic particle has a negative electric charge.", answer: "What is an electron?" }
    ]
  },
  {
    category: "History",
    questions: [
      { value: 100, clue: "This ancient civilization built the pyramids at Giza.", answer: "Who were the ancient Egyptians?" },
      { value: 200, clue: "This document begins with the words 'We the People.'", answer: "What is the U.S. Constitution?" },
      { value: 300, clue: "This explorer's 1492 voyage reached the Americas.", answer: "Who was Christopher Columbus?" },
      { value: 400, clue: "This wall fell in 1989, symbolizing the end of an era in Europe.", answer: "What is the Berlin Wall?" },
      { value: 500, clue: "This battle in 1066 established Norman rule over England.", answer: "What is the Battle of Hastings?" }
    ]
  },
  {
    category: "Geography",
    questions: [
      { value: 100, clue: "This is the largest continent by land area.", answer: "What is Asia?" },
      { value: 200, clue: "This river flows through Egypt and is one of the world's longest.", answer: "What is the Nile?" },
      { value: 300, clue: "This country has the city of Sydney and the Great Barrier Reef.", answer: "What is Australia?" },
      { value: 400, clue: "This mountain range includes Mount Everest.", answer: "What are the Himalayas?" },
      { value: 500, clue: "This landlocked country is completely surrounded by South Africa.", answer: "What is Lesotho?" }
    ]
  },
  {
    category: "Literature",
    questions: [
      { value: 100, clue: "This fictional detective lives at 221B Baker Street.", answer: "Who is Sherlock Holmes?" },
      { value: 200, clue: "This Shakespeare play features the characters Romeo and Juliet.", answer: "What is Romeo and Juliet?" },
      { value: 300, clue: "George Orwell wrote this novel about a dystopian society ruled by Big Brother.", answer: "What is Nineteen Eighty-Four (1984)?" },
      { value: 400, clue: "This epic poem is traditionally attributed to Homer and follows Odysseus's long journey home.", answer: "What is The Odyssey?" },
      { value: 500, clue: "Mary Shelley wrote this novel about a scientist who creates life.", answer: "What is Frankenstein?" }
    ]
  },
  {
    category: "Movies & TV",
    questions: [
      { value: 100, clue: "This animated ogre lives in a swamp.", answer: "Who is Shrek?" },
      { value: 200, clue: "In Star Wars, this character is Luke Skywalker's father.", answer: "Who is Darth Vader?" },
      { value: 300, clue: "This television series follows the employees of Dunder Mifflin's Scranton branch.", answer: "What is The Office?" },
      { value: 400, clue: "This 1997 film features Jack and Rose aboard the RMS Titanic.", answer: "What is Titanic?" },
      { value: 500, clue: "This director made the films Jaws, E.T., and Jurassic Park.", answer: "Who is Steven Spielberg?" }
    ]
  },
  {
    category: "Miscellaneous",
    questions: [
      { value: 100, clue: "There are this many sides on a standard hexagon.", answer: "What is six?" },
      { value: 200, clue: "This instrument typically has 88 keys.", answer: "What is a piano?" },
      { value: 300, clue: "This sport uses terms such as birdie, eagle, and bogey.", answer: "What is golf?" },
      { value: 400, clue: "This board game includes properties such as Boardwalk and Park Place.", answer: "What is Monopoly?" },
      { value: 500, clue: "This element has the chemical symbol Au.", answer: "What is gold?" }
    ]
  }
];

const finalJeopardy = {
  category: "Final Jeopardy",
  clue: "This is the only U.S. state whose name contains just one syllable.",
  answer: "What is Maine?"
};

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

assignDailyDouble();
renderScoreboard();
renderBoard();
