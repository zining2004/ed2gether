from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
from PyPDF2 import PdfReader
from gtts import gTTS
import markdown
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__, static_folder='static')
app.secret_key = 'your-secret-key'
CORS(app)  
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['document']
    username = request.form.get('username', 'guest')
    session['username'] = username

    local_path = f"uploads/{file.filename}"
    file.save(local_path)

    reader = PdfReader(local_path)
    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + "\n"

    summary_raw = summaryfunction(all_text)
    summary = summary_raw

    video_path = videofunction(summary_raw)
    script = audiofunction(summary_raw)
    generateaudio(script)

    # Send results to React
    return jsonify({
        'summary': summary,
        'videoPath': video_path,
        'audioPath': '/static/output.mp3',
    })

# AI Helper functions
def summaryfunction(text):
    try:
        prompt = f"Summarize the following text:\n{text}"
        print(f"Summary prompt: {prompt}")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"(Gemini error: {e})"

def videofunction(summary): pass

def comicfunction(summary): pass

def audiofunction(text):
    try:
        prompt = f"Write a spoken narration script for this topic:\n{text}\n(No character names or stage directions)"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"(Gemini error: {e})"

def generateaudio(text):
    try:
        tts = gTTS(text)
        tts.save("static/output.mp3")
        print("Audio file saved at static/output.mp3")
    except Exception as e:
        print(f"Audio generation error: {e}")

if __name__ == '__main__':
    app.run(debug=True)