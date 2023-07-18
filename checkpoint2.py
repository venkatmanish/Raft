import random
from collections import defaultdict
from typing import Dict

from flask import Flask, request, jsonify

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
node_id = random.randint(1, 1000)

# node states
FOLLOWER = 'follower'
CANDIDATE = 'candidate'
LEADER = 'leader'

# timeout ranges in milliseconds
MIN_TIMEOUT = 1500
MAX_TIMEOUT = 3000

# voting states
GRANTED = 'granted'
DENIED = 'denied'

# leader heartbeats
HEARTBEAT_INTERVAL = 100  # in milliseconds


class Node:
    def __init__(self, id):
        self.id = id
        self.state = FOLLOWER
        self.current_term = 0
        self.voted_for = None
        self.votes = defaultdict(lambda: DENIED)

    def reset_election_timeout(self):
        self.election_timeout = random.randint(MIN_TIMEOUT, MAX_TIMEOUT) / 1000

    def increment_term(self):
        self.current_term += 1
        self.voted_for = None

    def request_vote(self):
        self.increment_term()
        self.votes = defaultdict(lambda: DENIED)
        self.voted_for = self.id
        vote_count = 1  # start with one vote for self
        total_nodes = len(nodes)
        for node in nodes:
            if node.id == self.id:
                continue
            response = node.vote_request(self.current_term, self.id)
            if response['term'] > self.current_term:
                self.state = FOLLOWER
                break
            if response['vote_granted']:
                vote_count += 1
                if vote_count > total_nodes / 2:
                    self.state = LEADER
                    return
        self.reset_election_timeout()

    def vote_request(self, term, candidate_id):
        response = {
            'term': self.current_term,
            'vote_granted': False
        }
        if term < self.current_term:
            return response
        if (self.voted_for is None or self.voted_for == candidate_id) and self.state == FOLLOWER:
            self.voted_for = candidate_id
            response['vote_granted'] = True
            self.reset_election_timeout()
        return response

    def send_heartbeat(self):
        for node in nodes:
            if node.id != self.id:
                node.heartbeat(self.current_term, self.id)

    def heartbeat(self, term, leader_id):
        if term >= self.current_term:
            self.current_term = term
            self.voted_for = None
            self.state = FOLLOWER
        self.reset_election_timeout()

    def process_timeout(self):
        if self.state == FOLLOWER:
            self.reset_election_timeout()
            return
        if self.state == CANDIDATE:
            self.request_vote()
            return
        if self.state == LEADER:
            self.send_heartbeat()

    def __repr__(self):
        return f"Node {self.id} ({self.state}, term {self.current_term})"


nodes: Dict[int, Node] = {}
for i in range(5):
    nodes[i] = Node(i)


@app.route('/')
def home():
    return 'Hello, World!'


@app.route('/requestVote', methods=['POST'])
def request_vote():
    request_body = request.json
    candidate_id = request_body.get('candidateId')
    term = request_body.get('term')
    candidate_node = nodes.get(candidate_id)
    if candidate_node is None:
        return jsonify({'error': f'Node with id {candidate_id} not found'}), 400
    else:
        return candidate_id
    #candidate_node.increment_term

if __name__ == '__main__':
    app.run()