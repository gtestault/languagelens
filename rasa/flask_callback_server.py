from flask import Flask, request

app = Flask(__name__)

@app.route("/bot")
def print_response():
    """Print bot response to the console."""
    bot_response = request.json.get("text")
    print("result")
    print(f"\n{bot_response}")

    body = {"status": "message sent"}
    return body
