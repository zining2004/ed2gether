from flask import Flask, request, jsonify, session
from flask_cors import CORS
from PyPDF2 import PdfReader
from gtts import gTTS
import os
import requests
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Load .env
load_dotenv()
NOVITA_API_KEY = os.getenv("NOVITA_API_KEY", "").strip()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

print("[DEBUG] NOVITA_API_KEY loaded:", NOVITA_API_KEY[:10], "..." if NOVITA_API_KEY else "❌ MISSING")

# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Flask setup
app = Flask(__name__, static_folder='static')
app.secret_key = 'your-secret-key'
CORS(app)
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['document']
    username = request.form.get('username', 'guest')
    session['username'] = username

    local_path = f"uploads/{file.filename}"
    file.save(local_path)

    # Read PDF
    reader = PdfReader(local_path)
    all_text = "".join([page.extract_text() + "\n" for page in reader.pages if page.extract_text()])

    summary_raw = summaryfunction(all_text)
    key_points = extract_key_points(summary_raw)
    print(f"[DEBUG] Extracted {len(key_points)} key points: {key_points}")
    video_paths = generate_videos(key_points)
    script = audiofunction(summary_raw)
    generateaudio(script)

    return jsonify({
        'summary': summary_raw,
        'videoPaths': video_paths,
        'audioPath': '/static/output.mp3',
    })

# --- AI Functions ---

def summaryfunction(text):
    try:
        prompt = f"Summarize the following text:\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"(Gemini error: {e})"

def extract_key_points(summary, count=3):
    try:
        prompt = f"""
        Extract exactly {count} distinct key points from the summary below.
        Return each point on a new line, numbered like 1., 2., 3.

        Summary:
        {summary}
        """
        response = model.generate_content(prompt)
        lines = response.text.strip().split("\n")
        points = [line.strip("-\u20221234567890. ").strip() for line in lines if line.strip()]
        return points[:count]
    except Exception as e:
        print(f"[ERROR] Key point extraction failed: {e}")
        return []

def visualize_prompt(point):
    try:
        prompt = (
            f"Describe the following educational concept purely in visual terms, with no text, labels, or narration. "
            f"Use objects, characters, settings, or scenes to convey the idea to a student audience:\n\n{point}"
            f"limit the description to 1500 characters."
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[ERROR] Visual description generation failed: {e}")
        return f"A concept illustration with no text: {point}"

def generate_videos(key_points):
    url = "https://api.novita.ai/v3/async/wan-t2v"
    headers = {
        "Authorization": f"Bearer {NOVITA_API_KEY}",
        "Content-Type": "application/json"
    }

    video_paths = []

    if not key_points:
        print("[ERROR] No key points to generate video.")
        return video_paths

    point = key_points[0]
    try:
        visual_description = visualize_prompt(point)
        print(f"\n[VISUAL PROMPT 1]\n{visual_description}\n")

        payload = {
            "prompt": f"A cinematic, animated 3D video visually explaining this concept with no text or narration: {visual_description}",
            "width": 1280,
            "height": 720,
            "enable_safety_checker": True,
            "fast_mode": True
        }

        print(f"[DEBUG] Requesting video for key point 1")
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            print(f"[ERROR] Failed to request video: {res.status_code} {res.text}")
            return video_paths

        task_id = res.json().get("task_id")
        print(f"[INFO] Task ID: {task_id}")
        result_url = f"https://api.novita.ai/v3/async/task-result?task_id={task_id}"

        for attempt in range(30):
            status_res = requests.get(result_url, headers=headers)
            data = status_res.json()
            status = data.get("task", {}).get("status")
            if status == "TASK_STATUS_SUCCEED":
                video_url = data["videos"][0]["video_url"]
                video_data = requests.get(video_url)
                path = "static/output_0.mp4"
                with open(path, "wb") as f:
                    f.write(video_data.content)
                video_paths.append(f"/{path}")
                print(f"[INFO] Saved video to {path}")
                break
            elif status in ["TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"]:
                print(f"[ERROR] Video generation failed: {status}")
                break
            else:
                print(f"[INFO] Waiting for video (Attempt {attempt+1}/30)...")
                time.sleep(5)

    except Exception as e:
        print(f"[ERROR] Video generation failed: {e}")

    point = key_points[1]
    try:
        visual_description = visualize_prompt(point)
        print(f"\n[VISUAL PROMPT 2]\n{visual_description}\n")

        payload = {
            "prompt": f"A cinematic, animated 3D video visually explaining this concept with no text or narration: {visual_description}",
            "width": 1280,
            "height": 720,
            "enable_safety_checker": True,
            "fast_mode": True
        }

        print(f"[DEBUG] Requesting video for key point 2")
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            print(f"[ERROR] Failed to request video: {res.status_code} {res.text}")
            return video_paths

        task_id = res.json().get("task_id")
        print(f"[INFO] Task ID: {task_id}")
        result_url = f"https://api.novita.ai/v3/async/task-result?task_id={task_id}"

        for attempt in range(30):
            status_res = requests.get(result_url, headers=headers)
            data = status_res.json()
            status = data.get("task", {}).get("status")
            if status == "TASK_STATUS_SUCCEED":
                video_url = data["videos"][0]["video_url"]
                video_data = requests.get(video_url)
                path = "static/output_1.mp4"
                with open(path, "wb") as f:
                    f.write(video_data.content)
                video_paths.append(f"/{path}")
                print(f"[INFO] Saved video to {path}")
                break
            elif status in ["TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"]:
                print(f"[ERROR] Video generation failed: {status}")
                break
            else:
                print(f"[INFO] Waiting for video (Attempt {attempt+1}/30)...")
                time.sleep(5)

    except Exception as e:
        print(f"[ERROR] Video generation failed: {e}")

    point = key_points[2]
    try:
        visual_description = visualize_prompt(point)
        print(f"\n[VISUAL PROMPT 3]\n{visual_description}\n")

        payload = {
            "prompt": f"A cinematic, animated 3D video visually explaining this concept with no text or narration: {visual_description}",
            "width": 1280,
            "height": 720,
            "enable_safety_checker": True,
            "fast_mode": True
        }

        print(f"[DEBUG] Requesting video for key point 3")
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            print(f"[ERROR] Failed to request video: {res.status_code} {res.text}")
            return video_paths

        task_id = res.json().get("task_id")
        print(f"[INFO] Task ID: {task_id}")
        result_url = f"https://api.novita.ai/v3/async/task-result?task_id={task_id}"

        for attempt in range(30):
            status_res = requests.get(result_url, headers=headers)
            data = status_res.json()
            status = data.get("task", {}).get("status")
            if status == "TASK_STATUS_SUCCEED":
                video_url = data["videos"][0]["video_url"]
                video_data = requests.get(video_url)
                path = "static/output_2.mp4"
                with open(path, "wb") as f:
                    f.write(video_data.content)
                video_paths.append(f"/{path}")
                print(f"[INFO] Saved video to {path}")
                break
            elif status in ["TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"]:
                print(f"[ERROR] Video generation failed: {status}")
                break
            else:
                print(f"[INFO] Waiting for video (Attempt {attempt+1}/30)...")
                time.sleep(5)

    except Exception as e:
        print(f"[ERROR] Video generation failed: {e}")

    return video_paths

def audiofunction(text):
    try:
        prompt = f"Write a spoken narration script for this topic:\n{text}\n(No character names or stage directions)"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"(Gemini error: {e})"

def generateaudio(text):
    try:
        if not text or text.startswith("(Gemini error"):
            print("[WARN] Invalid script for audio generation.")
            return
        tts = gTTS(text)
        tts.save("static/output.mp3")
        print("[INFO] Audio saved as static/output.mp3")
    except Exception as e:
        print(f"[ERROR] Audio generation failed: {e}")

if __name__ == '__main__':
    app.run(debug=True)
