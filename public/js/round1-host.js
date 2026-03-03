const socket = io();
let state = null;
let questions = null;

fetch("/data/round1.json")
  .then(res => res.json())
  .then(data => questions = data.questions);

socket.on("round1Update", (s) => {
  state = s;
  render();
});

function updateServer() {
  socket.emit("round1Update", state);
}

function render() {
  if (!state || !questions) return;

  const q = questions[state.currentQuestion];
  document.getElementById("question").innerText = q.question;

  document.getElementById("scoreboard").innerText =
    `${state.teamA.name} (${state.teamA.strikes}❌): ${state.teamA.score} | ${state.teamB.name} (${state.teamB.strikes}❌): ${state.teamB.score}`;

  document.getElementById("controlDisplay").innerText =
    `Control: ${state.controlTeam || "None"}`;

  let html = "";

  q.answers.forEach((ans, i) => {
    if (!state.revealed.includes(i)) {
      html += `<button onclick="reveal(${i})">Reveal ${i + 1}</button><br>`;
    } else {
      html += `<div>${ans.text} - ${ans.points}</div>`;
    }
  });

  document.getElementById("answers").innerHTML = html;
}

function reveal(i) {
  if (state.revealed.includes(i)) return;
  state.revealed.push(i);

  const pts = questions[state.currentQuestion].answers[i].points;

  if (state.controlTeam === "A") state.teamA.score += pts;
  if (state.controlTeam === "B") state.teamB.score += pts;

  updateServer();
}

function giveControl(team) {
  state.controlTeam = team;
  updateServer();
}

function addStrike(team) {
  playBuzzer();
  state[`team${team}`].strikes++;

  if (state[`team${team}`].strikes >= 3) {
    state[`team${team}`].strikes = 0;
    state.controlTeam = team === "A" ? "B" : "A";
  }

  updateServer();
}

function resetStrikes() {
  state.teamA.strikes = 0;
  state.teamB.strikes = 0;
  updateServer();
}

function awardPoints(team) {
  const val = Number(document.getElementById("manualPoints").value);
  state[`team${team}`].score += val;
  updateServer();
}

function deductPoints(team) {
  const val = Number(document.getElementById("manualPoints").value);
  state[`team${team}`].score -= val;
  updateServer();
}

function updateTeams() {
  state.teamA.name = document.getElementById("teamAName").value || state.teamA.name;
  state.teamB.name = document.getElementById("teamBName").value || state.teamB.name;
  updateServer();
}

function nextQuestion() {
  if (state.currentQuestion < questions.length - 1) {
    state.currentQuestion++;
    state.revealed = [];
    resetStrikes();
  }
}

function prevQuestion() {
  if (state.currentQuestion > 0) {
    state.currentQuestion--;
    state.revealed = [];
    resetStrikes();
  }
}

function resetGame() {
  socket.emit("round1Reset");
}

function playBuzzer() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 200;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}