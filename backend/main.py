from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os
from analyser import analyse_video
from baselines import BASELINES

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        raw_scores = analyse_video(tmp_path)
    finally:
        os.unlink(tmp_path)

    if not raw_scores:
        return {"error": "Could not detect pose in video. Make sure the full body is visible."}

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
    tips = generate_tips(metrics)

    return {
        "overall_score": overall,
        "metrics": metrics,
        "tips": tips,
        "player_compared": player,
    }

def generate_tips(metrics):
    sorted_metrics = sorted(metrics.items(), key=lambda x: x[1]["difference"])
    labels = {
        "hip_rotation": "Hip rotation",
        "shoulder_tilt": "Shoulder tilt",
        "elbow_angle": "Elbow angle",
        "backswing_height": "Backswing height",
        "follow_through": "Follow-through",
        "wrist_snap": "Wrist snap",
    }
    advice = {
        "hip_rotation": "Lead with your left hip earlier in the downswing to generate more power.",
        "shoulder_tilt": "Keep your back shoulder lower at the start of your swing.",
        "elbow_angle": "Keep your lead elbow closer to your body during the backswing.",
        "backswing_height": "Bring the hurl higher in your backswing, aim above shoulder height.",
        "follow_through": "Extend your follow-through fully toward your target after contact.",
        "wrist_snap": "Delay your wrist release until the hurl reaches knee height.",
    }
    tips = []
    for key, data in sorted_metrics[:3]:
        diff = data["difference"]
        tag_type = "bad" if diff < -15 else "warn" if diff < 0 else "good"
        tips.append({
            "title": labels.get(key, key),
            "body": advice.get(key, "Focus on this area."),
            "tag": f"{diff:+d} pts",
            "tag_type": tag_type,
        })
    return tips