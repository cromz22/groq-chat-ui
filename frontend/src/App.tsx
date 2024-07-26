import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Message {
  role: 'user' | 'system';
  content: string;
}

interface ChatFile {
  filename: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);

  useEffect(() => {
    fetchChatFiles();
  }, []);

  const fetchChatFiles = async () => {
    const response = await axios.get<ChatFile[]>('http://localhost:8000/chat-files');
    setChatFiles(response.data);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChat(null);
  };

  const loadChat = async (filename: string) => {
    const response = await axios.get<Message[]>(`http://localhost:8000/chat/${filename}`);
    setMessages(response.data);
    setCurrentChat(filename);
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const response = await axios.post<{ content: string }>('http://localhost:8000/chat', {
      messages: newMessages,
    });

    const systemMessage: Message = { role: 'system', content: response.data.content };
    setMessages([...newMessages, systemMessage]);

    if (currentChat) {
      await axios.put(`http://localhost:8000/chat/${currentChat}`, {
        messages: [...newMessages, systemMessage],
      });
    } else {
      const newChatResponse = await axios.post<{ filename: string }>('http://localhost:8000/new-chat', {
        messages: [...newMessages, systemMessage],
      });
      setCurrentChat(newChatResponse.data.filename);
      fetchChatFiles();
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <button onClick={startNewChat}>New Chat</button>
        {chatFiles.map(file => (
          <div key={file.filename} onClick={() => loadChat(file.filename)}>
            {file.filename}
          </div>
        ))}
      </div>
      <div className="chat-container">
        <div className="chat-history">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.content}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default App;
