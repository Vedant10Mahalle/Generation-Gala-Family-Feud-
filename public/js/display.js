const socket = io();
let questions;

fetch("data/questions.json")
  .then(res => res.json())
  .then(data => questions = data);

socket.on("stateUpdate", (state) => {

  if (!questions) return;

  let html = "";

  function renderBoard(questionObj, revealedArray, teams, showStrikes) {

    if (!questionObj) {
      html += "<h1>Round Complete</h1>";
      return;
    }

    html += `<h2>${questionObj.question}</h2>`;

    questionObj.answers.forEach((ans, i) => {
      if (revealedArray.includes(i)) {
        html += `<div>${ans.text} - ${ans.points}</div>`;
      } else {
        html += `<div>______</div>`;
      }
    });

    html += `
      <hr>
      <h2>${teams.A.name}: ${teams.A.score}</h2>
      <h2>${teams.B.name}: ${teams.B.score}</h2>
    `;

    /* SHOW CONTROL */
    if (state.round === "faceoff" && state.controlTeam) {

      const controlName =
        teams[state.controlTeam].name;

      html += `
        <div style="margin-top:15px;
                    font-size:24px;
                    color:gold;
                    font-weight:bold;">
          🎤 Control: ${controlName}
        </div>
      `;
    }

    /* STRIKES */
    if (showStrikes) {
      html += `
        <div style="color:red;margin-top:10px;">
          ${teams.A.name} Strikes: ${"❌ ".repeat(teams.A.strikes)}
        </div>
        <div style="color:red;">
          ${teams.B.name} Strikes: ${"❌ ".repeat(teams.B.strikes)}
        </div>
      `;
    }

    /* TIMER */
    if (state.round === "fastmoney") {
      html += `
        <div style="font-size:40px;margin-top:20px;color:red;">
          ⏱ ${state.fastMoney.timer}
        </div>
      `;
    }

    /* ANNOUNCEMENT */
    if (state.announcement) {
      html += `
        <div style="margin-top:20px;font-size:22px;color:orange;">
          ${state.announcement}
        </div>
      `;
    }
  }

  if (state.round === "faceoff") {
    renderBoard(
      questions.faceoff[state.currentFaceoffQuestion],
      state.revealedAnswers,
      state.faceoffTeams,
      true
    );
  }

  if (state.round === "fastmoney") {
    renderBoard(
      questions.fastmoney[state.currentFastQuestion],
      state.fastMoney.revealed,
      state.fastMoneyTeams,
      false
    );
  }

  document.getElementById("displayContent").innerHTML = html;
});