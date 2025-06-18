# How to Run it
1. clone the repository
``` 
git clone https://github.com/zining2004/ed2gether 
```
2. change the directory
```
cd ed2gether
```
4. run the backends 
```
cd backend 
uvicorn server:app --reload 
python3 app.py 
cd sign-language-intepreter
python app.py
```
6. run the frontend
```
cd ..
npm run dev
```

# Future Improvements
1. Multilingual Speech-to-Text Transcription
Enhance the transcription feature to support multiple spoken languages beyond English, such as Mandarin, Malay, Tamil, or Spanish. This would allow users from diverse linguistic backgrounds to access real-time captions in their native languages, increasing the platform’s accessibility for international classrooms and multilingual communities.
2. Gesture-to-Speech Output
Enable bidirectional communication by converting recognized signs into synthesized speech, supporting Deaf-to-hearing interactions.

#Acknowledgements
Sign Language Interpreter: https://github.com/laplaces42/sign-language-interpreter
