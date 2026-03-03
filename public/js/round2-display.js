const socket = io();
let questions = null;

fetch("/data/round2.json")
  .then(res => res.json())
  .then(data => questions = data.questions);

socket.on("round2Update", (state) => {

  if (!questions) return;

  const q = questions[state.currentQuestion];

  let html = `<h2>${q.question}</h2>`;

  q.answers.forEach((ans, i) => {
    if (state.revealed.includes(i)) {
      html += `<div>${ans.text} - ${ans.points}</div>`;
    } else {
      html += `<div>______</div>`;
    }
  });

  html += `
    <hr>
    <h2>${state.teamA.name} (${state.teamA.strikes}❌): ${state.teamA.score}</h2>
    <h2>${state.teamB.name} (${state.teamB.strikes}❌): ${state.teamB.score}</h2>
    <h3>Control: ${state.controlTeam || "None"}</h3>
  `;

  document.getElementById("board").innerHTML = html;
});