from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import json
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAT_DIR = Path("chats")

CHAT_DIR.mkdir(exist_ok=True)

class Message(BaseModel):
    role: str
    content: str

class ChatMessages(BaseModel):
    messages: list[Message]

@app.get("/chat-files")
async def get_chat_files():
    files = list(CHAT_DIR.glob("*.json"))
    sorted_files = sorted(files, key=lambda x: datetime.strptime(x.stem, "%Y-%m%d-%H%M%S"), reverse=True)
    return [{"filename": file.name} for file in sorted_files]

@app.get("/chat/{filename}")
async def get_chat(filename: str):
    file_path = CHAT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Chat file not found")
    
    with file_path.open('r') as f:
        chat_history = json.load(f)
    
    return chat_history

@app.post("/new-chat")
async def create_new_chat(chat_messages: ChatMessages):
    timestamp = datetime.now().strftime("%Y-%m%d-%H%M%S")
    filename = CHAT_DIR / f"{timestamp}.json"
    
    with filename.open('w') as f:
        json.dump([message.dict() for message in chat_messages.messages], f)
    
    return {"filename": filename.name}

@app.post("/chat")
async def chat(chat_messages: ChatMessages):
    response = client.chat.completions.create(
        messages=[message.dict() for message in chat_messages.messages],
        model="llama3-8b-8192",
    )

    system_message = {"role": "system", "content": response.choices[0].message.content}
    return system_message

@app.put("/chat/{filename}")
async def update_chat(filename: str, chat_messages: ChatMessages):
    file_path = CHAT_DIR / filename
    
    with file_path.open('w') as f:
        json.dump([message.dict() for message in chat_messages.messages], f)
    
    return {"status": "updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
