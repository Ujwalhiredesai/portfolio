# app.py
import os
from flask import Flask, render_template, request, jsonify
import openai   # optional: pip install openai
from datetime import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")

# --- Simple in-memory projects list (replace with DB or JSON) ---
PROJECTS = [
    {
        "id": "ai-vision",
        "title": "Neural Vision Suite",
        "summary": "Image classification + interpretability demos.",
        "tags": ["AI", "Computer Vision", "PyTorch"],
        "theme": "dark"
    },
    {
        "id": "ds-dashboard",
        "title": "DataSense Dashboard",
        "summary": "Interactive analytics with real-time charts.",
        "tags": ["Data Science", "Dashboards", "Pandas"],
        "theme": "purple"
    },
    {
        "id": "automation",
        "title": "AutoFlow",
        "summary": "Automation pipelines for ETL and orchestration.",
        "tags": ["Automation", "Python", "Airflow"],
        "theme": "green"
    }
]

# ---------- Helper: OpenAI client (optional) ----------
def get_openai_client():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return None
    openai.api_key = key
    return openai

# ---------- Routes ----------
@app.route("/")
def index():
    # pass projects and your name/tagline
    return render_template("index.html",
                           name="Ujwal Hiredesai — AI Engineer, Data Scien",
                           tagline="AI Engineer | Data Science | Automation | ML Ops",
                           projects=PROJECTS)

# Simple health endpoint
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat() + "Z"})

# ---------- AI Chatbot endpoint (proxy to OpenAI) ----------
@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Expects JSON: { "message": "<user message>" }
    Returns: { "reply": "..." }
    """
    data = request.get_json() or {}
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "no message sent"}), 400

    client = get_openai_client()
    if client is None:
        # fallback canned response for local/offline
        reply = ("[AI disabled] This demo reply simulates the assistant. "
                 "Set OPENAI_API_KEY to enable real AI replies.")
        return jsonify({"reply": reply})

    # Example chat completion (simple)
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",  # change to available model if needed
            messages=[
                {"role": "system", "content": "You are Ujwal's portfolio assistant. Be concise and professional."},
                {"role": "user", "content": message}
            ],
            max_tokens=300,
            temperature=0.2,
        )
        text = resp["choices"][0]["message"]["content"].strip()
        return jsonify({"reply": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- Simple project recommender ----------
@app.route("/api/recommend", methods=["POST"])
def recommend():
    """
    Expects JSON: { "intent": "I want something on computer vision" }
    Returns a recommended project id/title/summary
    """
    data = request.get_json() or {}
    intent = (data.get("intent") or "").lower()
    if not intent:
        return jsonify({"error": "no intent provided"}), 400

    # naive keyword match (replace with embeddings for robust recommendations)
    scores = []
    for p in PROJECTS:
        score = 0
        combined = (" ".join(p["tags"]) + " " + p["title"] + " " + p["summary"]).lower()
        for word in ["vision", "image", "ml", "automation", "etl", "dashboard", "data", "pandas"]:
            if word in intent and word in combined:
                score += 2
        # small boost when tags match any word in intent
        for tag in p["tags"]:
            if tag.lower() in intent:
                score += 1
        scores.append((score, p))

    # choose best
    scores.sort(key=lambda x: x[0], reverse=True)
    best = scores[0][1] if scores else PROJECTS[0]
    return jsonify({"project": best})

# ---------- Static file routes handled by Flask automatically ----------

if __name__ == "__main__":
    # for dev only
    app.run(debug=True, port=5000)
