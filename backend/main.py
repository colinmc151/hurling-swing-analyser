from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os, json
from analyser import analyse_video
from baselines import BASELINES
from anthropic import Anthropic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic()

LABELS = {
    "hip_rotation": "Hip rotation",
    "shoulder_tilt": "Shoulder tilt",
    "elbow_angle": "Elbow angle",
    "backswing_height": "Backswing height",
    "follow_through": "Follow-through",
    "wrist_snap": "Wrist snap",
}

@app.get("/")
def root():
    return {"status": "SwingCoach API running"}

@app.post("/analyse")
async def analyse(
    video: UploadFile = File(...),
    player: str = Form(default="Henry Shefflin"),
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        content = await video.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        result = analyse_video(tmp_path)
    finally:
        os.unlink(tmp_path)

    if not result:
        return {"error": "Could not detect pose in video. Make sure the full body is visible."}

    raw_scores = result["metrics"]
    phases = result["phases"]

    baseline = BASELINES.get(player, BASELINES["Henry Shefflin"])
    metrics = {}
    for key in baseline:
        user_val = raw_scores.get(key, 50)
        pro_val = baseline[key]
        score = round(min(100, (user_val / pro_val) * 100))
        metrics[key] = {
            "your_score": score,
            "pro_score": pro_val,
            "difference": score - pro_val,
        }

    overall = round(sum(m["your_score"] for m in metrics.values()) / len(metrics))
    tips = generate_tips_ai(metrics, player)

    return {
        "overall_score": overall,
        "metrics": metrics,
        "tips": tips,
        "player_compared": player,
        "phases": phases,
    }


def generate_tips_ai(metrics, player):
    sorted_metrics = sorted(metrics.items(), key=lambda x: x[1]["difference"])[:3]

    summary_lines = []
    for key, data in sorted_metrics:
        summary_lines.append(
            f"- {LABELS.get(key, key)}: user scored {data['your_score']}/100, "
            f"pro ({player}) scored {data['pro_score']}/100 "
            f"(difference {data['difference']:+d})"
        )
    summary = "\n".join(summary_lines)

    keys_list = ", ".join(k for k, _ in sorted_metrics)
    prompt = (
        f"You are a hurling coach analysing a player's swing compared to {player}.\n"
        f"Here are the 3 weakest areas:\n\n{summary}\n\n"
        "For each of the 3 areas, write ONE specific, actionable coaching tip "
        "(1-2 sentences max, plain language, no jargon).\n"
        "Respond ONLY with a JSON array of 3 objects, each with a \"key\" "
        "(the metric name in snake_case) and \"body\" (your coaching tip). "
        "Example: [{\"key\":\"hip_rotation\",\"body\":\"...\"}]\n"
        f"Use these exact keys: {keys_list}"
    )

    ai_map = {}
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        ai_tips = json.loads(text.strip())
        ai_map = {t["key"]: t["body"] for t in ai_tips}
    except Exception as e:
        print(f"Claude API failed: {e}")

    tips = []
    for key, data in sorted_metrics:
        diff = data["difference"]
        tag_type = "bad" if diff < -15 else "warn" if diff < 0 else "good"
        body = ai_map.get(key) or f"Work on your {LABELS.get(key, key).lower()}."
        tips.append({
            "title": LABELS.get(key, key),
            "body": body,
            "tag": f"{diff:+d} pts",
            "tag_type": tag_type,
        })
    return tips
