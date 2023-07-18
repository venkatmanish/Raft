from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello, World!'

@app.route('/requestVote', methods=['POST'])
def request_vote():
    try:
        request_body = request.json
        # TODO: implement actual logic to handle the request
        response_body = {
            "term": 1,
            "voteGranted": True
        }
        return jsonify(response_body)
    except Exception as e:
        print(e)
        return jsonify({"error": "Invalid request body."}), 400

@app.route('/appendEntries', methods=['POST'])
def append_entries():
    try:
        request_body = request.json
        # TODO: implement actual logic to handle the request
        response_body = {
            "term": 1,
            "success": True
        }
        return jsonify(response_body)
    except Exception as e:
        print(e)
        return jsonify({"error": "Invalid request body."}), 400

@app.route('/executeCommand', methods=['POST'])
def execute_command():
    try:
        request_body = request.json
        command = request_body
        # TODO: implement actual logic to handle the request
        response_body = "OK"
        return jsonify(response_body)
    except Exception as e:
        print(e)
        return jsonify({"error": "Invalid request body."}), 400

if __name__ == '__main__':
    app.run(debug=True)
