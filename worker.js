const { parentPort, workerData } = require("worker_threads");
const axios = require("axios");

const { nodeId, totalNodes, currentTerm, votedFor, voteCount, state } =
  workerData;

const nodes = [];
for (let i = 1; i <= totalNodes; i++) {
  if (i !== nodeId) {
    nodes.push(`http://localhost:${3000 + i}`);
  }
}

function getRandomTimeout() {
  return Math.floor(Math.random() * 150) + 150;
}

function requestVote(node) {
  return axios
    .post(`${node}/requestVote`, {
      candidateId: nodeId,
      term: currentTerm,
      lastLogIndex: 0,
      lastLogTerm: 0,
    })
    .then((response) => {
      return response.data;
    });
}

function sendRequestVoteRequests() {
  const promises = nodes.map((node) => requestVote(node));
  Promise.all(promises).then((results) => {
    let voteGrantedCount = 0;
    let leaderFound = false;
    let leaderId = null;

    results.forEach((result) => {
      if (result.voteGranted) {
        voteGrantedCount++;
        if (voteGrantedCount > totalNodes / 2) {
          parentPort.postMessage({ type: "voteGranted" });
        }
      } else if (result.term > currentTerm) {
        leaderFound = true;
        leaderId = result.leaderId;
      }
    });

    if (leaderFound) {
      parentPort.postMessage({ type: "leaderFound", leaderId });
    } else {
      setTimeout(() => {
        parentPort.postMessage({ type: "electionTimeout" });
      }, getRandomTimeout());
    }
  });
}

sendRequestVoteRequests();
