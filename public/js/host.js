const socket = io();
let state = null;
let questions = null;
let timerInterval = null;

/* ================= LOAD QUESTIONS ================= */

fetch("data/questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
  });

/* ================= RECEIVE STATE ================= */

socket.on("stateUpdate", (newState) => {
  state = newState;
  if (questions) render();
});

function updateServer() {
  socket.emit("updateState", state);
}

/* ================= ACTIVE TEAM SELECTOR ================= */

function getActiveTeams() {
  return state.round === "faceoff"
    ? state.faceoffTeams
    : state.fastMoneyTeams;
}

/* ================= ROUND SWITCH ================= */

function setRound(r) {
  state.round = r;

  state.revealedAnswers = [];
  state.fastMoney.revealed = [];
  state.announcement = "";

  updateServer();
}

/* ================= TEAM UPDATES ================= */

function updateFaceTeams() {
  const A = document.getElementById("faceA").value.trim();
  const B = document.getElementById("faceB").value.trim();

  if (A) state.faceoffTeams.A.name = A;
  if (B) state.faceoffTeams.B.name = B;

  updateServer();
}

function updateFastTeams() {
  const A = document.getElementById("fastA").value.trim();
  const B = document.getElementById("fastB").value.trim();

  if (A) state.fastMoneyTeams.A.name = A;
  if (B) state.fastMoneyTeams.B.name = B;

  updateServer();
}

/* ================= RESET TEAMS ================= */

function resetFaceTeams() {
  state.faceoffTeams.A = { name: "Team A", score: 0, strikes: 0 };
  state.faceoffTeams.B = { name: "Team B", score: 0, strikes: 0 };
  state.revealedAnswers = [];
  state.announcement = "";
  updateServer();
}

function resetFastTeams() {
  state.fastMoneyTeams.A = { name: "Team A", score: 0 };
  state.fastMoneyTeams.B = { name: "Team B", score: 0 };
  state.fastMoney.timer = 20;
  state.fastMoney.revealed = [];
  state.fastMoney.running = false;
  updateServer();
}

/* ================= RENDER ================= */

function render() {

  const teams = getActiveTeams();

  document.getElementById("scores").innerText =
    `${teams.A.name}: ${teams.A.score} | ${teams.B.name}: ${teams.B.score}`;

  if (state.round === "faceoff") {
    renderBoard(
      questions.faceoff[state.currentFaceoffQuestion],
      state.revealedAnswers
    );
  }

  if (state.round === "fastmoney") {
    renderBoard(
      questions.fastmoney[state.currentFastQuestion],
      state.fastMoney.revealed
    );
  }
}

/* ================= BOARD ================= */

function renderBoard(questionObj, revealedArray) {

  if (!questionObj) {
    document.getElementById("question").innerText = "Round Complete";
    document.getElementById("answers").innerHTML = "";
    return;
  }

  document.getElementById("question").innerText = questionObj.question;

  let html = "";

  questionObj.answers.forEach((ans, i) => {

    if (!revealedArray.includes(i)) {

      html += `<button onclick="reveal(${i})">
                Reveal: ${ans.text} (${ans.points})
              </button><br>`;

    } else {

      html += `<div>
                ${ans.text} (${ans.points})
                <button onclick="awardSpecific('A', ${ans.points})">
                  +${ans.points} A
                </button>
                <button onclick="awardSpecific('B', ${ans.points})">
                  +${ans.points} B
                </button>
              </div>`;
    }
  });

  if (state.round === "fastmoney") {
    html += `<h2>⏱ ${state.fastMoney.timer}</h2>`;
  }

  document.getElementById("answers").innerHTML = html;
}

/* ================= REVEAL ================= */

function reveal(i) {

  if (state.round === "faceoff") {
    if (!state.revealedAnswers.includes(i))
      state.revealedAnswers.push(i);
  }

  if (state.round === "fastmoney") {
    if (!state.fastMoney.revealed.includes(i))
      state.fastMoney.revealed.push(i);
  }

  updateServer();
}

/* ================= MANUAL SCORING (FIXED) ================= */

function awardSpecific(team, pts) {
  const teams = getActiveTeams();
  teams[team].score += Number(pts);
  updateServer();
}

function awardPoints(team) {
  const value = document.getElementById("manualPoints").value;
  const pts = Number(value);

  if (!isNaN(pts) && value !== "") {
    const teams = getActiveTeams();
    teams[team].score += pts;
    document.getElementById("manualPoints").value = "";
    updateServer();
  }
}

function deductPoints(team) {
  const value = document.getElementById("manualPoints").value;
  const pts = Number(value);

  if (!isNaN(pts) && value !== "") {
    const teams = getActiveTeams();
    teams[team].score -= pts;
    document.getElementById("manualPoints").value = "";
    updateServer();
  }
}

/* ================= STRIKES ================= */

function addStrike(team) {
  if (state.round !== "faceoff") return;

  const teams = state.faceoffTeams;
  if (teams[team].strikes >= 3) return;

  teams[team].strikes++;
  state.announcement =
    `❌ ${teams[team].name} - Strike ${teams[team].strikes}`;

  updateServer();
}

function resetStrikes() {
  state.faceoffTeams.A.strikes = 0;
  state.faceoffTeams.B.strikes = 0;
  state.announcement = "";
  updateServer();
}

function nextFaceoffQuestion() {
  state.currentFaceoffQuestion++;
  state.revealedAnswers = [];
  resetStrikes();
}

/* ================= FAST MONEY TIMER ================= */

function startTimer() {
  if (state.fastMoney.running) return;

  state.fastMoney.running = true;

  timerInterval = setInterval(() => {
    if (state.fastMoney.timer <= 0) {
      clearInterval(timerInterval);
      state.fastMoney.running = false;
      playBuzzer();
    } else {
      state.fastMoney.timer--;
    }
    updateServer();
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  state.fastMoney.timer = 20;
  state.fastMoney.running = false;
  updateServer();
}

function nextFastQuestion() {
  state.currentFastQuestion++;
  state.fastMoney.revealed = [];
  state.fastMoney.timer = 20;
  state.fastMoney.running = false;
  clearInterval(timerInterval);
  updateServer();
}

/* ================= BUZZER ================= */

function playBuzzer() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.6, ctx.currentTime);

  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}
/* ================= CONTROL ================= */

function giveControl(team) {

  if (state.round !== "faceoff") return;

  state.controlTeam = team;

  const teamName = state.faceoffTeams[team].name;

  state.announcement = `🎤 ${teamName} takes control!`;

  updateServer();
}