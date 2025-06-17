from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(ws: WebSocket, room_id: str):
    await ws.accept()
    if room_id not in rooms:
        rooms[room_id] = []
    rooms[room_id].append(ws)
    try:
        while True:
            data = await ws.receive_text()
            for client in rooms[room_id]:
                if client != ws:
                    await client.send_text(data)
    except WebSocketDisconnect:
        rooms[room_id].remove(ws)
        if not rooms[room_id]:
            del rooms[room_id]

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
