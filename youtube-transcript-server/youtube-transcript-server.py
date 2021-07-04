from flask import Flask, jsonify
from youtube_transcript_api import YouTubeTranscriptApi

app = Flask(__name__)


@app.route("/<id>")
def transcript(id):
    transcript = YouTubeTranscriptApi.get_transcript(id)
    return jsonify(transcript)

