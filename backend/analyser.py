import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

# Landmark indices we care about for the stick figure
KEY_LANDMARKS = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
}


def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - \
              np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle


def extract_pose_points(landmarks):
    """Return a dict of {name: [x, y, z]} for the key joints."""
    return {
        name: [landmarks[idx].x, landmarks[idx].y, landmarks[idx].z]
        for name, idx in KEY_LANDMARKS.items()
    }


def compute_metrics(pts):
    """Compute the 6 swing metrics from a single frame's pose points."""
    left_hip = pts["left_hip"][:2]
    right_hip = pts["right_hip"][:2]
    left_shoulder = pts["left_shoulder"][:2]
    right_shoulder = pts["right_shoulder"][:2]
    left_elbow = pts["left_elbow"][:2]
    left_wrist = pts["left_wrist"][:2]
    right_wrist = pts["right_wrist"][:2]

    return {
        "hip_rotation": abs(left_hip[0] - right_hip[0]) * 100,
        "shoulder_tilt": calculate_angle(
            left_shoulder, right_shoulder, [right_shoulder[0], 0]
        ),
        "elbow_angle": calculate_angle(
            left_shoulder, left_elbow, left_wrist
        ),
        "backswing_height": (1 - min(left_wrist[1], right_wrist[1])) * 100,
        "follow_through": calculate_angle(
            left_hip, left_shoulder, left_wrist
        ),
        "wrist_snap": calculate_angle(
            left_elbow, left_wrist,
            [left_wrist[0], left_wrist[1] + 0.1]
        ),
    }


def analyse_video(video_path: str) -> dict:
    """Return metrics averaged across frames, plus landmarks at 4 key phases."""
    cap = cv2.VideoCapture(video_path)
    all_frames = []  # list of (metrics, pose_points, wrist_y)

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image)
            if results.pose_landmarks:
                pts = extract_pose_points(results.pose_landmarks.landmark)
                metrics = compute_metrics(pts)
                wrist_y = min(pts["left_wrist"][1], pts["right_wrist"][1])
                all_frames.append((metrics, pts, wrist_y))
    cap.release()

    if not all_frames:
        return {}

    # Average metrics across all frames
    averaged = {}
    for key in all_frames[0][0].keys():
        raw = np.mean([f[0][key] for f in all_frames])
        averaged[key] = min(100, max(0, round(float(raw))))

    # Identify phase frames
    n = len(all_frames)
    # setup: first frame
    setup_idx = 0
    # backswing: frame with highest wrists (lowest y value, since 0 is top)
    backswing_idx = min(range(n), key=lambda i: all_frames[i][2])
    # contact: frame with lowest wrists (highest y value) — ideally after backswing
    after_backswing = list(range(backswing_idx, n))
    if after_backswing:
        contact_idx = max(after_backswing, key=lambda i: all_frames[i][2])
    else:
        contact_idx = n // 2
    # follow_through: last frame
    follow_idx = n - 1

    phases = {
        "setup": all_frames[setup_idx][1],
        "backswing": all_frames[backswing_idx][1],
        "contact": all_frames[contact_idx][1],
        "follow_through": all_frames[follow_idx][1],
    }

    return {
        "metrics": averaged,
        "phases": phases,
    }
