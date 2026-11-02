# Raqib – Frontend

Web interface of **Raqib**, the AI-driven regulatory validation system for AMMPS. Users sign in, submit their dossier, follow the analysis, read the compliance report, and communicate with AMMPS services.

---

## Table of Contents

1. [Features](#1-features)
2. [Tech Stack](#2-tech-stack)
3. [Requirements](#3-requirements)
4. [Getting Started](#4-getting-started)
5. [Available Scripts](#5-available-scripts)
6. [Connecting to the Backend](#6-connecting-to-the-backend)
7. [Deployment](#7-deployment)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Features

- **Authentication**: registration and login with a 6-digit OTP sent by e-mail.
- **Homepage** presenting the platform and its services.
- **Dossier submission form**: operator identification, required documents for the product category, and upload of PDF, JPG, JPEG or PNG files.
- **Analyser le dossier**: triggers the validation pipeline.
- **Validation results**: compliance score, risk level (LOW / MEDIUM / HIGH), passed and failed criteria, missing documents, detected signatures and stamps.
- **PDF report** download (also sent by e-mail).
- **Dossier tracking dashboard** with search and status indicators.
- **Messaging module**: send complementary documents and trigger re-validation.
- **Appointment booking** with e-mail confirmation.
- **AI assistant**: floating chat widget answering platform questions in French and Arabic.

---

## 2. Tech Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 3. Requirements

- **Node.js** 18 or newer
- **npm**

```sh
node -v
npm -v
```

Node.js can be installed from https://nodejs.org or with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

---

## 4. Getting Started

```sh
# 1. Clone the repository
git clone https://github.com/ghoufraneamou/Raqib.git

# 2. Go to the project folder
cd Raqib

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app opens at the address shown in the terminal, usually `http://localhost:5173`.

> If the frontend is in a sub-folder, `cd` into it before `npm install`.

---

## 5. Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the linter (if configured) |

---

## 6. Connecting to the Backend

The frontend talks to the FastAPI backend (default `http://localhost:8000`):

| Action | Endpoint |
|--------|----------|
| Check the server | `GET /health` |
| Submit a dossier | `POST /validate` |
| Follow the analysis | `GET /status/{task_id}` |
| Download the report | `GET /download-report` |
| List / track dossiers | `GET /dossiers`, `GET /dossiers/{dossier_id}` |
| Confirm an appointment | `POST /appointments/confirm` |
| Ask the assistant | `POST /ask-ai` |

Before testing:

1. Start the backend (see the backend README).
2. Open `http://localhost:8000/health` to confirm it runs.
3. Start the frontend with `npm run dev`.

The backend accepts requests from the Vite dev ports **5173** and **5174**. If your backend runs elsewhere, update the API URL in the frontend code (or in your `.env` file if the project uses one).

---

## 7. Deployment

```sh
npm run build
```

Deploy the generated `dist/` folder on any static host (Netlify, Vercel, GitHub Pages, ...). The deployed frontend needs a reachable backend URL, and that backend must allow the frontend's origin in its CORS settings.

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js and reopen the terminal. |
| Errors after `npm install` | Delete `node_modules` and `package-lock.json`, then run `npm install` again. |
| Port already in use | Run `npm run dev -- --port 5174`. |
| Upload or network error | Check the backend is running and the API URL is correct. |
| CORS error in the console | Add the frontend origin to the backend CORS settings. |
| No OTP e-mail received | Check the spam folder and the backend SMTP configuration. |
