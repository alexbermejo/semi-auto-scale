from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/auto-scale", methods=["POST"])
def auto_scale():
    try:
        data = request.get_json()
        print("Received data", data)  # para debug
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5050)
