let gameState = {
  round: "faceoff",

  currentFaceoffQuestion: 0,
  currentFastQuestion: 0,

  activeTeam: "A",

  teams: {
    A: { name: "Team A", score: 0, strikes: 0 },
    B: { name: "Team B", score: 0, strikes: 0 }
  },

  revealedAnswers: [],

  fastMoney: {
    timer: 20,
    totalPoints: 0
  }
};

function saveState() {
  localStorage.setItem("ggState", JSON.stringify(gameState));
}

function loadState() {
  const saved = localStorage.getItem("ggState");
  if (saved) gameState = JSON.parse(saved);
}