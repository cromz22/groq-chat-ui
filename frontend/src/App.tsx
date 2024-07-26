import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy, darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    fetchChatFiles();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter style={theme === 'dark' ? darcula : coy} language={match[1]} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      <div className="sidebar">
        <button className="theme-toggle" onClick={toggleTheme}>
          Toggle Theme
        </button>
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
              <ReactMarkdown components={components}>{message.content}</ReactMarkdown>
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
