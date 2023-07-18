const express = require("express");
const bodyParser = require("body-parser");
const app = express();
//const port = 3000;

const args = process.argv.slice(2);
const port = parseInt(args[0]);
//node state
let currentTerm = 0;
let votedFor = null;
let leaderId = null;
let state = "follower";

//election timeout
let electionTimeoutId = null;
let minElectionTimeout = 1500;
let maxElectionTimeout = 3000;

//vote counting
let voteCount = 0;
let totalNodes = 3;

// Routes
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
    res.json({ term: currentTerm, success: true });
    leaderId = req.body.leaderId;
    state = "follower";
  }
});

app.post("/executeCommand", (req, res) => {
  res.json("OK");
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
  requestVotes();
}

function requestVotes() {
  voteCount = 1;
  const request = require("request");

  for (let i = 1; i <= totalNodes; i++) {
    if (i !== port - 3000) {
      const url = `http://localhost:${i + 3000}/requestVote`;

      const params = {
        candidateId: `node-${port - 3000}`,
        term: currentTerm,
        lastLogIndex: 10,
        lastLogTerm: 1,
      };

      request.post(
        {
          url: url,
          body: params,
          json: true,
        },
        function checkLeader(err, response, body) {
            if (err) {
              console.log(err);
            } else {
              const { term, voteGranted } = body;
              if (voteGranted) {
                voteCount += 1;
                if (voteCount > totalNodes / 2 && state !== "leader") {
                  state = "leader";
                  leaderId = port;
                  console.log(`Node ${port} is now the LEADER`);
                  sendHeartbeat();
                }
              } else if (term > currentTerm) {
                currentTerm = term;
                state = "follower";
                leaderId = null;
                votedFor = null;
                console.log(`Node ${port} became a FOLLOWER`);
              }
            }
          }
      )}; 