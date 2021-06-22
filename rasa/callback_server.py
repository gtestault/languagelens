from sanic import Sanic, response
from sanic.request import Request
from sanic.response import HTTPResponse, empty, text
import aiohttp
import requests


def create_app() -> Sanic:
    bot_app: Sanic = Sanic(__name__, configure_logging=False)

    @bot_app.listener('before_server_start')
    def init(app: Sanic, loop):
        app.aiohttp_session = aiohttp.ClientSession(loop=loop)

    @bot_app.listener('after_server_stop')
    def finish(app: Sanic, loop):
        loop.run_until_complete(app.aiohttp_session.close())
        loop.close()

    @bot_app.post("/bot")
    def print_response(request: Request) -> HTTPResponse:
        """Print bot response to the console."""
        bot_response = request.json.get("text")
        print("result")
        print(f"\n{bot_response}")

        body = {"status": "message sent"}
        return response.json(body, status=200)

    @bot_app.post("/user_message")
    def user_message(request: Request) -> HTTPResponse:
        message = request.json.get("message")
        sender = request.json.get("sender")
        if sender == "" or message == "":
            return empty(status=400)

        requests.post("http://localhost:5005/webhooks/callback/webhook", json={"message": message, "sender": sender}, timeout = 5)

        url = "https://api.github.com/repos/channelcat/sanic"
        session: aiohttp.ClientSession = app.aiohttp_session
        res = await session.post("http://localhost:5005/webhooks/callback/webhook", json={"message": message, "sender": sender})
        if res.status > 200:
            print("failed to proxy user message to rasa")
            return empty(status=500)
        return empty()

    return bot_app


if __name__ == "__main__":
    app = create_app()
    port = 5034

    print(f"Starting callback server on port {port}.")
    app.run("0.0.0.0", port)
