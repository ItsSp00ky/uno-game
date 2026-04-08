<p align="center">
	<img src="./assets/uno_icon.png" width="200" alt="UNO Game Icon" />
</p>

<h3 align="center">
  An UNO Game made in Javascript 🎴
</h3>

<p align="center">
	<a href="https://lerna.js.org/">
		<img alt="lerna" src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="maintained with lerna"/>
	</a>
	<a href="https://github.com/microsoft/TypeScript">
		<img alt="typescript" src="https://img.shields.io/badge/TypeScript-3.x-3178C6?logo=typescript&logoColor=white">
	</a>
	<img alt="private repository" src="https://img.shields.io/badge/repo-private-444444" />
</p>

<p align="center">
	<img src="./assets/main_preview.gif" alt="UNO Game Preview" />
</p>

## 📌 Overview

A real-time multiplayer UNO card game built as a monorepo. Create a room, invite friends, and play UNO directly in your browser — no downloads required.

### Highlights

- 🎮 **Real-time multiplayer** — play with 2–8 players via WebSockets
- 🤖 **Bot Matchmaking** — instantly spawn up to 3 AI-controlled opponents (bot fill targets 4 total seats; human joins still scale to 8)
- 🃏 **Full UNO rules** — Exact standard 108-card deck size, Draw 2/4 stacking, true "Hand Locking" draw system, color changes, reverse, skip, UNO call
- 🔄 **Direction Ring Visuals** — Dynamic, glowing SVG arrow ring tracking the live game direction and turn flow
- 🧩 **Per-game Rule Sets** — Choose rules when creating a game (`Basic` active now, additional modes scaffolded as placeholders)
- ⏱️ **30s AFK Penalty** — Standardized 30-second round timer; idle players are penalized with an automatic **Draw + Skip**
- 🖱️ **Drag & drop or double-tap** — intuitive card play with native mouse sliding and mobile optimized touch controls
- 💬 **In-game chat** — communicate with other players during the game
- 📱 **Responsive** — works on desktop and mobile browsers

## 🏗️ Architecture

This project is organized as a **Lerna monorepo** with three packages:

| Package | Description | Key Tech |
|---------|-------------|----------|
| **`unapy`** | Backend game server | Node.js, Express, Socket.IO |
| **`unoenty`** | Frontend web client | React, Material-UI, react-dnd |
| **`shared`** | Shared protocols & types | TypeScript definitions |

## 🔧 Technologies

- **Language:** TypeScript (strict mode)
- **Frontend:** React 16, Material-UI, react-dnd (drag & drop), Lottie (animations)
- **Backend:** Express, Socket.IO (real-time communication)
- **State:** React Context + Socket.IO event-driven updates
- **Tooling:** Lerna, Craco, Nodemon, Husky, Lint Staged, ESLint
- **Infrastructure:** Redis (optional, for production scaling), Docker

## 🚀 Getting Started

### Laptop Setup Checklist (Windows)

Install these first:

1. **Git** (for cloning)
2. **Node.js 18 LTS** (recommended for this project on Windows)
3. **VS Code** (recommended editor)
4. **Cloudflare Tunnel client** (`cloudflared`) for free online sharing
5. *(Optional)* **Docker Desktop** if you want local Redis via `docker-compose`

Quick install commands (PowerShell as Administrator):

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id Cloudflare.cloudflared -e
```

Verify installs:

```powershell
git --version
node --version
npm --version
code --version
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" --version
```

### Prerequisites

- **Node.js** ≥ 10.3 (recommend Node 14 for best compatibility)
- **Redis** (optional — falls back to in-memory store for development)
- **Docker** (optional — only needed for `npm run dev:resources`)

> **⚠️ Node.js v17+ users:** The frontend requires the `--openssl-legacy-provider` flag due to older webpack dependencies. This is handled automatically in the quick start instructions below.

### Quick Start

**1. Clone and install dependencies:**
```bash
git clone <your-private-repository-url>
cd uno-game

# Install root + package dependencies
npm install --legacy-peer-deps

# Install individual package dependencies
cd packages/unapy && npm install --legacy-peer-deps && cd ../..
cd packages/unoenty && npm install --legacy-peer-deps && cd ../..

# Link monorepo packages together
npx lerna link
```

**2. Set up environment files:**
```bash
# Copy example env files
cp packages/unapy/.env.example packages/unapy/.env
cp packages/unoenty/.env.example packages/unoenty/.env
```

Windows PowerShell equivalent:

```powershell
Copy-Item "packages/unapy/.env.example" "packages/unapy/.env"
Copy-Item "packages/unoenty/.env.example" "packages/unoenty/.env"
```

**3. Start Redis (optional):**
```bash
npm run dev:resources
```

**4. Start the backend (Terminal 1):**
```bash
npm run dev:unapy
# Server runs at http://localhost:5000
```

**5. Start the frontend (Terminal 2):**
```bash
cd packages/unoenty

# Node.js v17+:
NODE_OPTIONS=--openssl-legacy-provider npx craco start

# PowerShell (Windows):
$env:NODE_OPTIONS="--openssl-legacy-provider"; npx craco start

# Node.js v14-16 (no flag needed):
npx craco start

# Client runs at http://localhost:3000
```

**6. Play!** Open `http://localhost:3000` in your browser. Open a second tab/browser to join as a second player.

### Environment Variables

**Backend** (`packages/unapy/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | Server port |
| `STATIC_FILES_BASE_URL` | `http://localhost:5000/assets` | Base URL for card images |
| `REDIS_HOST` | `localhost` | Redis host (optional) |
| `REDIS_PORT` | `6333` | Redis port |
| `REDIS_PASSWORD` | *(empty)* | Redis password |

**Frontend** (`packages/unoenty/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `REACT_APP_API_URL` | `http://localhost:5000` | Backend API URL |

### Playing Online (Free with Cloudflare Tunnel)

To let friends join from outside your local network without opening router ports:

1. Start backend (`unapy`) locally on `5000`.
2. Run a backend tunnel (`cloudflared tunnel --url http://localhost:5000`) and copy the generated `https://*.trycloudflare.com` URL.
3. Set backend asset base URL to that public endpoint in `packages/unapy/.env`:
   - `STATIC_FILES_BASE_URL=https://<your-backend-tunnel>/assets`
4. Start/restart backend so cards are generated with public image URLs.
5. Set frontend API URL in `packages/unoenty/.env`:
   - `REACT_APP_API_URL=https://<your-backend-tunnel>`
6. Start frontend locally (with `NODE_OPTIONS=--openssl-legacy-provider` if needed).
7. Run a frontend tunnel (`cloudflared tunnel --url http://localhost:3000` or `:4000`) and share that URL with friends.
8. Keep both tunnel terminals open while testing.

> If card images are invisible on phones, the most common cause is `STATIC_FILES_BASE_URL` still pointing to `localhost`.
> If login hangs on phones after entering a name, the most common cause is `REACT_APP_API_URL` still pointing to `localhost`.

### Custom card backs (per player)

Each player can choose their own card-back image (visible on unrevealed cards only).

1. Put your images in:
   - `packages/unapy/src/Assets/card-backs/custom/`
2. Use standard size:
   - `400 x 620` pixels (ratio `1:1.55`)
3. Restart backend (`unapy`) after adding files.
4. Open the in-game sidebar menu and choose a card back from **CARD BACK**.
5. Selector is text-only (file names), preview is intentionally disabled.

Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`.

#### Your personal Windows quick commands

Use these exact commands when you want to host for friends:

```powershell
cd C:\Users\Spooky\Code\uno-game\packages\unoenty
$env:NODE_OPTIONS="--openssl-legacy-provider"
$env:PORT="4000"
npx craco start
```

In another terminal, expose the frontend:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
```

## 🎮 How to Play

1. Open the app and enter your name
2. **Create a new game** or **join an existing one** from the dashboard
   - When creating, choose a **Rule Set** for that room (currently `Basic` is enabled)
3. Wait for at least 2 players, or click **ADD BOTS** to instantly fill empty slots, then click **GET READY**
4. The game starts automatically when all players are ready
5. **Play cards** by dragging them to the card stack or **double-tapping** them
6. **Wild cards** (change-color, +4) prompt you to choose a color
7. **Can't play?** Click the **BUY CARD** button to draw from the deck (note: the game enforces strict passing logic, meaning you must play the drawn card or pass your turn)
8. First player to empty their hand wins! 🎉

## 🧪 Building for Production

```bash
# Build the backend
npm run build:unapy

# Build the frontend
npm run build:unoenty
```

## 🤝 Project Notes

- This is maintained as a private project.
- Update this README and `AI.md` whenever game rules, networking flow, or run commands change.
- For AI assistants and deeper technical context, see [AI.md](./AI.md).

## ✅ Daily Run (Quick Commands)

From a fresh terminal session:

1. **Backend**
```powershell
cd C:\Users\Spooky\Code\uno-game\packages\unapy
npm run dev
```

2. **Frontend**
```powershell
cd C:\Users\Spooky\Code\uno-game\packages\unoenty
$env:NODE_OPTIONS="--openssl-legacy-provider"
$env:PORT="4000"
npx craco start
```

3. **(Optional) Share frontend online**
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
```

4. Open locally: `http://localhost:4000`
