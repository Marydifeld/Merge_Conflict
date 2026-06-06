# Merge Conflict


## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- npm (included with Node.js)

## Getting started

Clone the repository and install dependencies for each part of the project.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** by default.

Other useful commands:

```bash
npm run build    # Production build (output in frontend/dist)
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

### Backend (Node.js)

The backend has no npm dependencies. From the project root:

```bash
cd backend
npm run dev
```

The server listens on **http://localhost:3001** by default. Set a custom port with the `PORT` environment variable:

```bash
# macOS / Linux
PORT=4000 npm run dev

# Windows (PowerShell)
$env:PORT=4000; npm run dev
```

## Project structure

```
├── backend/     # Node.js HTTP server
└── frontend/    # React app (Vite)
```
