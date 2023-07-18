const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http");
const { Worker } = require("worker_threads");

const args = process.argv.slice(2);
const port = parseInt(args[0]);

let currentTerm = 0;
let votedFor = null;
let leaderId = null;
let state = "follower";

let electionTimeoutId = null;
let minElectionTimeout = 1500;
let maxElectionTimeout = 3000;

let voteCount = 0;
let totalNodes = 3;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/requestVote", (req, res) => {
  const { candidateId, term, lastLogIndex, lastLogTerm } = req.body;

  if (term < currentTerm) {
    res.json({ term: currentTerm, voteGranted: false });
  } else if (votedFor === null || votedFor === candidateId) {
    if (lastLogTerm >= currentTerm && lastLogIndex >= 0) {
      currentTerm = term;
      votedFor = candidateId;
      clearTimeout(electionTimeoutId);
      electionTimeoutId = setTimeout(startElection, getRandomTimeout());
      res.json({ term: currentTerm, voteGranted: true });
    } else {
      res.json({ term: currentTerm, voteGranted: false });
    }
  } else {
    res.json({ term: currentTerm, voteGranted: false });
  }
});

app.post("/appendEntries", (req, res) => {
  const { leaderId, term, prevLogIndex, prevLogTerm, entries, leaderCommit } =
    req.body;

  if (term < currentTerm) {
    res.json({ term: currentTerm, success: false });
  } else {
    currentTerm = term;
    clearTimeout(electionTimeoutId);
    electionTimeoutId = setTimeout(startElection, getRandomTimeout());
    leaderId = req.body.leaderId;
    state = "follower";
    res.json({ term: currentTerm, success: true });
  }
});

app.post("/executeCommand", (req, res) => {
  res.json("OK");
});

app.get("/leader", (req, res) => {
  res.json({ leaderId });
});

function getRandomTimeout() {
  return Math.floor(
    Math.random() * (maxElectionTimeout - minElectionTimeout + 1) +
      minElectionTimeout
  );
}

function startElection() {
  state = "candidate";
  currentTerm += 1;
  votedFor = null;
  voteCount = 1;

  const worker = new Worker("./worker.js", {
    workerData: {
      nodeId: port,
      totalNodes,
      currentTerm,
      votedFor,
      voteCount,
      state,
    },
  });

  worker.on("message", (message) => {
    if (message.type === "voteGranted") {
      voteCount++;
      if (voteCount > totalNodes / 2) {
        state = "leader";
        leaderId = port;
        console.log(`Node ${port} elected as leader.`);
        clearTimeout(electionTimeoutId);
      }
    } else if (message.type === "leaderFound") {
      leaderId = message.leaderId;
      state = "follower";
      clearTimeout(electionTimeoutId);
    } else if (message.type === "electionTimeout") {
      startElection();
    }
  });
}

function sendHeartbeat() {
  if (state === "leader") {
    const options = {
      hostname: "localhost",
      port: port,
      path: "/appendEntries",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leaderId: port,
        term: currentTerm,
        prevLogIndex: 0,
        prevLogTerm: 0,
        entries: [],
        leaderCommit: 0,
      }),
    };

    for (let i = 0; i < totalNodes; i++) {
      if (i + 1 !== port) {
        const req = http.request(
          {
            ...options,
            port: i + 1,
          },
          (res) => {
            res.on("data", (chunk) => {
              console.log(chunk.toString());
            });
          }
        );
        req.write(options.body);
        req.end();
      }
    }
  }
}

setInterval(sendHeartbeat, 1000);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
