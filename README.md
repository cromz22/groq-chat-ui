# Groq Chat UI

Chat UI to use [Groq](https://groq.com/).

## Environmental Setup

- Frontend

    - Install [Bun](https://bun.sh/) if you don't have one in your system.
    - Install dependencies:

        ```
        cd frontend
        bun install
        ```

- Backend

    - Install [Poetry](https://python-poetry.org/) if you don't have one in your system.
    - Install dependencies:

        ```
        cd backend
        poetry install
        ```

## Usage

- Frontend

    ```
    cd frontend
    bun run dev
    ```

- Backend

    ```
    cd backend
    GROQ_API_KEY=your-groq-api-key fastapi dev main.py
    ```

- Open http://localhost:5173/ in your browser. You're all set!

## Design Choices

- I'm sure there are lots of UIs like this. I just wanted to make one of my own so that I can customize the design. The principle is to keep it simple and fast.
- Groq is an awsome engine that provides fast inference. But they do not offer a chat app (at least not on the web; they have an experimental Android app). This UI enables you to save the chats as local json files.
- For frontend, I chose Bun + [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) for modern web development. For backend, I chose FastAPI because it's easy for me to develop in Python.
