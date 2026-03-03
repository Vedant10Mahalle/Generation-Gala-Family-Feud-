const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

function createState() {
  return {
    currentQuestion: 0,
    revealed: [],
    controlTeam: null,
    teamA: { name: "Team A", score: 0, strikes: 0 },
    teamB: { name: "Team B", score: 0, strikes: 0 },
    announcement: ""
  };
}

let round1State = createState();
let round2State = createState();

/* ROUND 1 SOCKET */
io.on("connection", (socket) => {

  socket.emit("round1Update", round1State);
  socket.emit("round2Update", round2State);

  socket.on("round1Update", (state) => {
    round1State = state;
    io.emit("round1Update", round1State);
  });

  socket.on("round2Update", (state) => {
    round2State = state;
    io.emit("round2Update", round2State);
  });

  socket.on("round1Reset", () => {
    round1State = createState();
    io.emit("round1Update", round1State);
  });

  socket.on("round2Reset", () => {
    round2State = createState();
    io.emit("round2Update", round2State);
  });

});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("Server running on port 3000");
});