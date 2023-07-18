from flask import Flask, request, jsonify

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
@app.route('/')
def home():
    return "Welcome to the Raft consensus!"

@app.route('/requestVote', methods=['POST'])
def request_vote():
    request_body = request.json
    #term = request_body.get('term')
    #candidate_id = request_body.get('candidateId')
    #last_log_index = request_body.get('lastLogIndex')
    #last_log_term = request_body.get('lastLogTerm')
    response_body = {
        'term': 1,
        'voteGranted': True
    }
    return jsonify(response_body)

@app.route('/appendEntries', methods=['POST'])
def append_entries():
    request_body = request.json
    response_body = {
        "term": 1,
        "success": True
    }
    return jsonify(response_body)

@app.route('/executeCommand', methods=['POST'])
def execute_command():
    request_body = request.json
    command = request_body
    response_body = "OK"
    return jsonify(response_body)

if __name__ == '__main__':
    app.run()
