# ktabnet 📚

> A social platform for book lovers — discover, share, and connect around what you read.

**ktabnet** (كتاب‎ = *book* in Arabic) is a full-stack web application built with a Go backend and a TypeScript/React frontend. It is live at [ktabnet.dev](https://ktabnet.dev).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Available Commands](#available-commands)
- [Building for Production](#building-for-production)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Browse and discover books
- Social features — follow users, share reads, interact with the community
- Clean, fast frontend powered by React + TypeScript
- Lightweight Go REST API backend
- SQLite database (no heavy database setup needed)

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | TypeScript, React, Vite, CSS  |
| Backend   | Go                            |
| Database  | SQLite                        |
| DevOps    | Docker                        |

---

## Project Structure

```
ktabnet.ma/
├── backend/          # Go REST API
│   └── main.go
├── frontend/         # React + TypeScript app
│   ├── src/
│   └── package.json
├── social.db         # SQLite database
```

---

## Getting Started

### Prerequisites

- [Go](https://golang.org/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

Clone the repo and install frontend dependencies:

```bash
git clone https://github.com/helbadaou/ktabnet.ma.git
cd ktabnet.ma
make install
```

### Running the App

You can run the backend and frontend in separate terminals:

**Terminal 1 — Backend:**
```bash
make backend
```

**Terminal 2 — Frontend:**
```bash
make frontend
```

Or run both in parallel with a single command:

```bash
make run-parallel
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8080` (or whichever port is configured).

---

## Available Commands

| Command               | Description                              |
|-----------------------|------------------------------------------|
| `make backend`        | Start the Go backend server              |
| `make frontend`       | Start the React frontend dev server      |
| `make run-parallel`   | Run both servers in parallel             |
| `make install`        | Install frontend npm dependencies        |
| `make build`          | Build both backend and frontend          |
| `make build-backend`  | Build the Go binary only                 |
| `make build-frontend` | Build the frontend only                  |
| `make clean`          | Remove build artifacts and node_modules  |
| `make help`           | Show all available commands              |

---

## Building for Production

```bash
make build
```

This will:
- Compile the Go backend to a binary at `backend/ktabnet`
- Build the React frontend to `frontend/dist`

---

## Docker

The project includes a `Dockerfile`. To build and run the containerized app:

```bash
docker build -t ktabnet .
docker run -p 8080:8080 ktabnet
```

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

Please keep commits clean and descriptive.

---

## License

This project is open source. See [LICENSE](LICENSE) for details.

---

<p align="center">Made with ❤️ in Morocco 🇲🇦</p>
