import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

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

def analyse_video(video_path: str) -> dict:
    cap = cv2.VideoCapture(video_path)
    frame_data = []

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
                landmarks = results.pose_landmarks.landmark

                def get_point(idx):
                    lm = landmarks[idx]
                    return [lm.x, lm.y]

                left_hip = get_point(mp_pose.PoseLandmark.LEFT_HIP.value)
                right_hip = get_point(mp_pose.PoseLandmark.RIGHT_HIP.value)
                left_shoulder = get_point(mp_pose.PoseLandmark.LEFT_SHOULDER.value)
                right_shoulder = get_point(mp_pose.PoseLandmark.RIGHT_SHOULDER.value)
                left_elbow = get_point(mp_pose.PoseLandmark.LEFT_ELBOW.value)
                left_wrist = get_point(mp_pose.PoseLandmark.LEFT_WRIST.value)
                right_elbow = get_point(mp_pose.PoseLandmark.RIGHT_ELBOW.value)
                right_wrist = get_point(mp_pose.PoseLandmark.RIGHT_WRIST.value)

                hip_rotation = abs(left_hip[0] - right_hip[0]) * 100
                shoulder_tilt = calculate_angle(
                    left_shoulder, right_shoulder,
                    [right_shoulder[0], 0]
                )
                elbow_angle = calculate_angle(
                    left_shoulder, left_elbow, left_wrist
                )
                backswing_height = (
                    1 - min(left_wrist[1], right_wrist[1])
                ) * 100
                follow_through = calculate_angle(
                    left_hip, left_shoulder, left_wrist
                )
                wrist_snap = calculate_angle(
                    left_elbow, left_wrist,
                    [left_wrist[0], left_wrist[1] + 0.1]
                )

                frame_data.append({
                    "hip_rotation": hip_rotation,
                    "shoulder_tilt": shoulder_tilt,
                    "elbow_angle": elbow_angle,
                    "backswing_height": backswing_height,
                    "follow_through": follow_through,
                    "wrist_snap": wrist_snap,
                })

    cap.release()

    if not frame_data:
        return {}

    averaged = {}
    for key in frame_data[0].keys():
        raw = np.mean([f[key] for f in frame_data])
        averaged[key] = min(100, max(0, round(float(raw))))

    return averaged