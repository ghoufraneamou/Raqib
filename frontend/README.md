# AMMPS – Frontend

Web interface of the AMMPS project. It lets users upload their documents (PDF or images), sends them to the backend API for validation, and displays the dossier score and report.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Requirements](#2-requirements)
3. [Getting Started](#3-getting-started)
4. [Available Scripts](#4-available-scripts)
5. [Connecting to the Backend](#5-connecting-to-the-backend)
6. [Deployment](#6-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Tech Stack

- [Vite](https://vitejs.dev/) – build tool and dev server
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/) – UI components
- [Tailwind CSS](https://tailwindcss.com/) – styling

---

## 2. Requirements

- **Node.js** 18 or newer
- **npm** (included with Node.js)

Check your versions:

```sh
node -v
npm -v
```

If Node.js is not installed, download it from https://nodejs.org or install it with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

---

## 3. Getting Started

```sh
# Step 1: Clone the repository
git clone https://github.com/ghoufraneamou/Raqib.git

# Step 2: Go to the frontend folder
cd Raqib

# Step 3: Install dependencies
npm install

# Step 4: Start the development server (auto-reload)
npm run dev
```

The app is then available at the local address shown in the terminal (usually `http://localhost:5173`).

> If the frontend lives in a sub-folder of the repository (for example `frontend/`), `cd` into that folder before running `npm install`.

---

## 4. Available Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start the development server with hot reload     |
| `npm run build`   | Create an optimized production build             |
| `npm run preview` | Preview the production build locally             |
| `npm run lint`    | Run the linter (if configured in `package.json`) |

---

## 5. Connecting to the Backend

The frontend sends documents to the backend validation endpoint:

```
POST http://localhost:8000/validate
```

Before testing an upload:

1. Start the backend (see the backend README).
2. Check that it is running: open `http://localhost:8000/health`.
3. Start the frontend with `npm run dev`.

If your backend runs on a different address or port, update the API URL used by the frontend in the code (or in your `.env` file if the project uses one).

---

## 6. Deployment

Create a production build:

```sh
npm run build
```

The generated `dist/` folder can be deployed on any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

Remember that the deployed frontend needs a reachable backend URL; `localhost` will not work for other users.

---

## 7. Troubleshooting

| Problem                               | Solution                                                                          |
|---------------------------------------|-----------------------------------------------------------------------------------|
| `npm: command not found`              | Install Node.js, then reopen your terminal.                                       |
| Dependency errors after `npm install` | Delete `node_modules` and `package-lock.json`, then run `npm install` again.      |
| Port already in use                   | Stop the other process, or run `npm run dev -- --port 5174`.                      |
| Upload fails / network error          | Make sure the backend is running and that the API URL in the frontend is correct. |
| CORS error in the browser console     | Allow the frontend address in the backend CORS settings.                          |
