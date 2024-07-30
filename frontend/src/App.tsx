import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy, darcula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaSun, FaMoon, FaPlus, FaCopy, FaPaperPlane, FaTrash } from "react-icons/fa";
import "./App.css";

interface Message {
  role: "user" | "system";
  content: string;
}

interface ChatFile {
  filename: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>("dark");
  const [chatModel, setChatModel] = useState<string>("llama-3.1-70b-versatile");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchChatFiles();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const fetchChatFiles = async () => {
    const response = await axios.get<ChatFile[]>(
      "http://localhost:8000/chat-files",
    );
    setChatFiles(response.data);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChat(null);
  };

  const loadChat = async (filename: string) => {
    const response = await axios.get<Message[]>(
      `http://localhost:8000/chat/${filename}`,
    );
    setMessages(response.data);
    setCurrentChat(filename);
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    const response = await axios.post<{ content: string }>(
      "http://localhost:8000/chat",
      {
        messages: newMessages,
        model: chatModel, // Include the chat model
      },
    );

    const systemMessage: Message = {
      role: "system",
      content: response.data.content,
    };
    setMessages([...newMessages, systemMessage]);

    if (currentChat) {
      await axios.put(`http://localhost:8000/chat/${currentChat}`, {
        messages: [...newMessages, systemMessage],
      });
    } else {
      const newChatResponse = await axios.post<{ filename: string }>(
        "http://localhost:8000/new-chat",
        {
          messages: [...newMessages, systemMessage],
        },
      );
      setCurrentChat(newChatResponse.data.filename);
      fetchChatFiles();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, window.innerHeight / 2)}px`;
    }
  };

  const handleCopyClick = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const components = {
    code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => handleCopyClick(String(children).replace(/\n$/, ""))}
            className="copy-button"
          >
            <FaCopy />
          </button>
          <SyntaxHighlighter
            style={theme === "dark" ? darcula : coy}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("Message copied to clipboard!");
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const deleteChat = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete the chat "${filename.replace(".json", "")}"?`)) {
      await axios.delete(`http://localhost:8000/chat/${filename}`);
      alert("Chat file deleted successfully!");
      fetchChatFiles();
      if (currentChat === filename) {
        startNewChat();
      }
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>
        <button className="new-chat-button" onClick={startNewChat}>
          <FaPlus />
        </button>
        <select
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
        >
          <option value="llama-3.1-405b-reasoning">
            llama-3.1-405b-reasoning
          </option>
          <option value="llama-3.1-70b-versatile">
            llama-3.1-70b-versatile
          </option>
          <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
        </select>
        {chatFiles.map((file) => (
          <div
            key={file.filename}
            className="chat-file"
          >
            <span onClick={() => loadChat(file.filename)}>
              {file.filename.replace(".json", "")}
            </span>
            <button
              className="delete-button"
              onClick={() => deleteChat(file.filename)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
      <div className="chat-container">
        <div className="chat-history">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <button
                className="copy-button"
                onClick={() => handleCopyMessage(message.content)}
              >
                <FaCopy />
              </button>
              <ReactMarkdown components={components}>
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className="send-button" onClick={sendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
