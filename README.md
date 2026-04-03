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
		<img alt="typescript" src="https://camo.githubusercontent.com/41c68e9f29c6caccc084e5a147e0abd5f392d9bc/68747470733a2f2f62616467656e2e6e65742f62616467652f547970655363726970742f7374726963742532302546302539462539322541412f626c7565">
	</a>
	<a href="https://github.com/guilhermebkel/uno-game">
		<img alt="mit license" src="https://img.shields.io/github/license/guilhermebkel/uno-game?color=0051ff" />
	</a>
</p>
<p align="center">
	<a href="https://github.com/guilhermebkel/uno-game">
		<img alt="unoenty build" src="https://github.com/guilhermebkel/uno-game/workflows/Unoenty%20CI/badge.svg" />
	</a>
	<a href="https://github.com/guilhermebkel/uno-game">
		<img alt="unapy build" src="https://github.com/guilhermebkel/uno-game/workflows/Unapy%20CI/badge.svg" />
	</a>
</p>

<p align="center">
	<img src="./assets/main_preview.gif" alt="UNO Game Preview" />
	<br></br>
	<a href="https://uno.guilherr.me">Click here to play this game</a>
</p>

## 📌 Overview

A real-time multiplayer UNO card game built as a monorepo. Create a room, invite friends, and play UNO directly in your browser — no downloads required.

### Highlights

- 🎮 **Real-time multiplayer** — play with 2–8 players via WebSockets
- 🤖 **Bot Matchmaking** — instantly spawn up to 3 AI-controlled opponents for solo test sessions or filling remaining lobby slots
- 🃏 **Full UNO rules** — Exact standard 108-card deck size, Draw 2/4 stacking, true "Hand Locking" draw system, color changes, reverse, skip, UNO call
- 🔄 **Turn tracking visuals** — Dynamic rotating visual indicators reflecting live game direction
- 🖱️ **Drag & drop or double-tap** — intuitive card play with native mouse sliding and mobile optimized touch controls
- ⏱️ **Auto-play AFK** — round timer auto-plays for idle players
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

### Prerequisites

- **Node.js** ≥ 10.3 (recommend Node 14 for best compatibility)
- **Redis** (optional — falls back to in-memory store for development)
- **Docker** (optional — only needed for `npm run dev:resources`)

> **⚠️ Node.js v17+ users:** The frontend requires the `--openssl-legacy-provider` flag due to older webpack dependencies. This is handled automatically in the quick start instructions below.

### Quick Start

**1. Clone and install dependencies:**
```bash
git clone https://github.com/guilhermebkel/uno-game.git
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

## 🎮 How to Play

1. Open the app and enter your name
2. **Create a new game** or **join an existing one** from the dashboard
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

## 👏 Contributing

1. Fork and clone this repository
2. Create a new branch following **Git Karma** conventions (e.g., `feat/my-awesome-feature`)
3. Make your changes and ensure they build without errors
4. Submit a PR with a clear description of your changes

> 📖 **For AI assistants & deep technical context**, see [AI.md](./AI.md) — it covers architecture, game logic internals, state management, and known design decisions.

## 🗺️ Roadmap

See our [**Project Board**](https://github.com/guilhermebkel/uno-game/projects/1) for planned features and improvements. All ideas and bug reports are welcome!

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

## 💫 Contributors

Thanks to all the people who contributed on this project!

<table>
  <tr>
    <td align="center">
			<a
				href="https://github.com/ArcaneDiver" 
				title="ArcaneDiver"
			>
				<img src="https://avatars.githubusercontent.com/ArcaneDiver" width="100px;" alt=""/>
				<br />
				<sub>
					<b>Michele Della Mea</b>
				</sub>
			</a>
		</td>
		<td align="center">
			<a
				href="https://github.com/lcscout" 
				title="lcscout"
			>
				<img src="https://avatars.githubusercontent.com/lcscout" width="100px;" alt=""/>
				<br />
				<sub>
					<b>Lucas Coutinho de Oliveira</b>
				</sub>
			</a>
		</td>
  </tr>
</table>
