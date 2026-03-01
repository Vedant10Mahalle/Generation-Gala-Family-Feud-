const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let gameState = {
  round: "faceoff",

  currentFaceoffQuestion: 0,
  currentFastQuestion: 0,

  faceoffTeams: {
    A: { name: "Team A", score: 0, strikes: 0 },
    B: { name: "Team B", score: 0, strikes: 0 }
  },

  fastMoneyTeams: {
    A: { name: "Team A", score: 0 },
    B: { name: "Team B", score: 0 }
  },

  revealedAnswers: [],
  controlTeam: null,
  announcement: "",

  fastMoney: {
    timer: 20,
    running: false,
    revealed: []
  }
};

io.on("connection", (socket) => {

  socket.emit("stateUpdate", gameState);

  socket.on("updateState", (newState) => {
    gameState = newState;
    io.emit("stateUpdate", gameState);
  });

});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});