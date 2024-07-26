from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import json
from fastapi.middleware.cors import CORSMiddleware

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

CHAT_DIR = "chats"

if not os.path.exists(CHAT_DIR):
    os.makedirs(CHAT_DIR)

class Message(BaseModel):
    role: str
    content: str

class ChatMessages(BaseModel):
    messages: list[Message]

@app.get("/chat-files")
async def get_chat_files():
    files = os.listdir(CHAT_DIR)
    return [{"filename": file} for file in files]

@app.get("/chat/{filename}")
async def get_chat(filename: str):
    try:
        with open(os.path.join(CHAT_DIR, filename), 'r') as f:
            chat_history = json.load(f)
        return chat_history
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Chat file not found")

@app.post("/new-chat")
async def create_new_chat(chat_messages: ChatMessages):
    timestamp = datetime.now().strftime("%Y-%m%d-%H%M%S")
    filename = f"{timestamp}.json"
    
    with open(os.path.join(CHAT_DIR, filename), 'w') as f:
        json.dump([message.dict() for message in chat_messages.messages], f)
    
    return {"filename": filename}

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
    with open(os.path.join(CHAT_DIR, filename), 'w') as f:
        json.dump([message.dict() for message in chat_messages.messages], f)
    return {"status": "updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
