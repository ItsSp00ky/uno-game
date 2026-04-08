# UNO Game — AI Project Reference

> Internal technical documentation for AI assistants and developers working on this codebase.
> For general setup & usage, see [README.md](./README.md).

---

## Project Overview

A **real-time multiplayer UNO card game** built as a Lerna monorepo with three packages:

| Package | Path | Description | Tech Stack |
|---------|------|-------------|------------|
| `unapy` | `packages/unapy/` | Backend game server | Node.js, TypeScript, Socket.IO 2.x, Express |
| `unoenty` | `packages/unoenty/` | Frontend web client | React 16, TypeScript 3.x, Material-UI 4, react-dnd, craco |
| `shared` | `packages/shared/` | Shared protocols & types | TypeScript type definitions (no runtime code) |

**Important compatibility notes:**
- The root `package.json` specifies `"node": ">=0.10.3 <15"` but the project does run on modern Node with `--legacy-peer-deps` and `--openssl-legacy-provider`
- Dependencies use older major versions (React 16, Socket.IO 2, Material-UI 4, TypeScript 3)
- `uuid` package is used without being in `dependencies` (it's hoisted from the root lockfile)

---

## Architecture

### Directory Structure

```
uno-game/
├── AI.md                    # ← You are here
├── README.md                # Public-facing docs
├── package.json             # Root workspace config + lerna
├── lerna.json               # Lerna monorepo config
├── packages/
│   ├── shared/
│   │   ├── protocols/       # Game protocol types
│   │   │   ├── index.ts     # Re-exports all typings
│   │   │   └── typings/
│   │   │       ├── Card.ts      # CardData, CardColors, CardTypes, CurrentCardCombo
│   │   │       ├── Game.ts      # Game, GameEvents, GameStatus, GameDirection
│   │   │       ├── GameRules.ts # GameRuleSetId, GameRuleSetDefinition
│   │   │       ├── Player.ts    # PlayerData, PlayerStatus, PlayerState
│   │   │       ├── Socket.ts    # All socket event input/response types
│   │   │       ├── Chat.ts      # Chat, ChatMessage
│   │   │       ├── GameHistory.ts
│   │   │       └── GameRound.ts # GameRoundCounter, GameRoundEvents
│   │   └── error-handler/   # Shared error handling utility
│   │
│   ├── unapy/               # Backend server
│   │   ├── .env             # Environment config (copy from .env.example)
│   │   ├── nodemon.json     # Dev server config (uses sucrase for TS)
│   │   └── src/
│   │       ├── index.ts         # Entry point (Express + Socket.IO setup)
│   │       ├── routes.ts        # Express routes (health check, static files)
│   │       ├── @types/          # Ambient type declarations
│   │       ├── Assets/          # Static card SVG images
│   │       ├── Config/          # Environment & static file URL config
│   │       ├── Controllers/     # Express route controllers
│   │       ├── Core/            # Server bootstrap (App class)
│   │       ├── Modules/         # EventHandlerModule (socket event routing)
│   │       ├── Repositories/    # Data persistence layer
│   │       │   ├── GameRepository.ts       # Game state storage
│   │       │   └── GameRoundRepository.ts  # Round timer storage
│   │       ├── Services/        # ★ Core business logic ★
│   │       │   ├── GameService.ts       # Main game engine (847 lines)
│   │       │   ├── GameRulesService.ts  # Per-game ruleset resolver + catalog
│   │       │   ├── CardService.ts       # Card deck generation & shuffling
│   │       │   ├── GameRoundService.ts  # Round timer management
│   │       │   ├── PlayerService.ts     # Player data management
│   │       │   ├── ChatService.ts       # In-game chat
│   │       │   ├── ClientService.ts     # Client notification dispatch
│   │       │   ├── SocketService.ts     # Socket.IO wrapper
│   │       │   └── *StoreService.ts     # Storage backends (memory, Redis, cache)
│   │       ├── Rules/           # Rule-set specific server logic (scaffold)
│   │       │   ├── basic/
│   │       │   └── placeholders/
│   │       └── Utils/
│   │           ├── ArrayUtil.ts     # Fisher-Yates shuffle
│   │           ├── NumberUtil.ts    # Circular index wrapping
│   │           └── CryptUtil.ts     # Short UUID generation
│   │
│   └── unoenty/             # Frontend client
│       ├── .env             # Environment config
│       ├── craco.config.js  # CRA override (path aliases)
│       ├── public/          # Static HTML, icons, manifest
│       └── src/
│           ├── index.tsx        # React entry point (with SocketProvider)
│           ├── App.tsx          # Router setup
│           ├── routes.tsx       # Route definitions (/, /:gameId/table, etc.)
│           ├── components/      # Reusable UI components
│           │   ├── GameCard/        # Game room preview card (lobby)
│           │   ├── Avatar/          # Player avatar generator
│           │   ├── LoginDialog/     # Name entry modal
│           │   ├── LoadingScene/    # Full-screen loading animation
│           │   └── ...
│           ├── pages/
│           │   ├── Dashboard/       # Game lobby (list/create games)
│           │   ├── Room/            # Pre-game room (ready up)
│           │   └── Table/           # ★ Main game table ★
│           │       ├── index.tsx        # Table layout & game state
│           │       ├── CardDeck/        # Player's hand (draggable cards)
│           │       ├── CardStack/       # Played card pile (drop target)
│           │       ├── ChooseColorModal/# Wild card color picker
│           │       ├── CardDeckPlaceholder/ # Other players' card backs
│           │       ├── PlayerEffect/    # Buy/block/UNO visual effects
│           │       ├── GameEndedModal/  # Win/lose/play-again modal
│           │       └── TableChat/       # In-game chat panel
│           ├── hooks/
│           │   ├── useSocket.tsx     # ★ Main game interaction hook ★
│           │   └── useDidMount.tsx   # Component mount lifecycle
│           ├── store/
│           │   ├── Socket.tsx        # ★ Global game state (React Context) ★
│           │   └── Card.tsx          # Selected cards state
│           ├── services/
│           │   ├── socket.ts         # Socket.IO client wrapper
│           │   └── event.ts          # Custom DOM event dispatcher
│           ├── styles/               # Theme, colors, custom styles
│           ├── utils/                # Utility functions
│           └── assets/               # Images, animations, fonts
```

### Data Flow

```
┌─────────────┐     Socket.IO      ┌───────────────────┐
│   Browser    │ ←──── events ────→ │  EventHandlerModule│
│  (unoenty)   │                    │    (unapy)         │
└──────┬───────┘                    └────────┬───────────┘
       │                                     │
  useSocket()                          GameService
  SocketStore                          CardService
  CardStore                            PlayerService
       │                                     │
  React Context                        GameRepository
  (state updates)                      (in-memory/Redis)
```

**Event lifecycle for playing a card:**
1. Player drags card to stack → `CardStack.handleDrop()` fires
2. If wild card → `ChooseColorModal.open()` prompts for color
3. `useSocket.putCard()` emits `"PutCard"` event (no optimistic local mutation)
4. `EventHandlerModule` receives → calls `GameService.putCard()`
5. `GameService` validates move, applies card effects, rotates turn
6. Server broadcasts: `PlayerPutCard`, `PlayerChoseCardColor`, `PlayerCardUsabilityConsolidated`, etc.
7. `SocketStore` listeners update game state → React re-renders

**Event lifecycle for game creation (ruleset-aware):**
1. Player clicks **Create New Game** on dashboard
2. Client opens a rule set picker (currently only `basic` enabled)
3. Frontend emits `CreateGame` with `{ ruleSetId }`
4. `EventHandlerModule` forwards selected ruleset to `GameService.setupGame`
5. `GameRulesService` resolves invalid/disabled selections back to `basic`
6. Created game persists `game.ruleSetId`, isolated to that game instance

---

## Core Game Logic

### Card Composition (Full Deck)

The deck is generated by `CardService.getCardStack()` called twice via `setupRandomCards()`:

| Card | Per Color | Colors | Total |
|------|-----------|--------|-------|
| 0 | 1 | 4 | **4** |
| 1–9 | 2 | 4 | **72** |
| block | 2 | 4 | **8** |
| buy-2 | 2 | 4 | **8** |
| reverse | 2 | 4 | **8** |
| change-color | — | black | **4** |
| buy-4 | — | black | **4** |
| **Total deck size:** | | | **108** |

> **Note:** The deck generation was recently updated to fully align with standard UNO rules (exactly 108 cards).

### Card Usability Rules (`buildPlayersWithCardUsability`)

A card in hand is marked `canBeUsed = true` if:

```typescript
// When no buy combo is active:
!topStackCard ||                          // Safety: no card on stack
topStackCard.color === handCard.color ||   // Same color
handCard.type === "change-color" ||        // Wild card
handCard.type === "buy-4" ||              // Wild +4
topStackCard.type === handCard.type ||     // Same type/number
handCard.color === game.currentGameColor   // Matches chosen color (for wilds)

// When a buy combo is active:
cardCanBeBuyCombed(game, handCard)
```

**Buy combo rules** (`cardCanBeBuyCombed`):
- `buy-2` stacks on `buy-4` if card color matches `currentGameColor`
- `buy-2` stacks on `buy-2` (always)
- `buy-4` stacks on anything (always)

### Card Effects (`buildGameWithCardEffect`)

| Effect | Logic |
|--------|-------|
| **change-color / buy-4** | Sets `currentGameColor` to `selectedColor`, updates card `src` from `possibleColors` map |
| **reverse** | Flips `game.direction`. Even count = cancels out (stays same direction) |
| **block** | Increments `nextPlayerIndex` per block card played (skips that many players) |
| **buy-2 / buy-4** | Accumulates `currentCardCombo.amountToBuy`. If next player can't combo, they draw all accumulated cards and the combo resets |

### Game Start Sequence (`startGame`)

1. Distribute 7 cards to each player from the shuffled deck
2. Find the first non-wild card remaining in the deck → place it on `usedCards` as the starter
3. Set `currentGameColor` to the starter card's color
4. Calculate card usability for the first player based on the starter card
5. Emit `GameStarted` event
6. Start the round timer

### Turn Rotation (`nextRound`)

1. Reset round timer
2. Check if current player won (0 cards) or has UNO (1 card)
3. Calculate next player index using `NumberUtil.getSanitizedValueWithBoundaries` (handles wrap-around)
4. Build card usability for next player
5. If next player is AFK → auto-play after 1-second delay

### Player Indexing (`NumberUtil.getSanitizedValueWithBoundaries`)

Handles circular player indexing:
- `value >= max` → `value % max` (wraps forward)
- `value < min` → `(max - |value|) % max` (wraps backward)
- Otherwise → return as-is

---

## Frontend Architecture

### State Management

**`SocketStore`** (React Context) — holds all game state:
- `game: Game` — full game object (players, cards, status, etc.)
- `player: Player` — current user's identity
- `chats: Map<string, Chat>` — chat messages per game
- `gameHistory: GameHistory[]` — past games
- `gameRoundRemainingTimeInSeconds: number` — round timer countdown

**`CardStore`** (React Context) — UI selection state:
- `selectedCards: CardData[]` — cards the player has clicked to combo

### Socket Event Listeners (in `SocketStore`)

| Event | Handler |
|-------|---------|
| `PlayerJoined` | Adds player to `game.players` |
| `PlayerLeft` | Removes player (if waiting) |
| `PlayerToggledReady` | Updates player's `ready` state |
| `PlayerPutCard` | Adds card to `usedCards`, removes from player's `handCards` |
| `PlayerChoseCardColor` | Updates wild card's `src` and `selectedColor` in `usedCards` |
| `PlayerBoughtCard` | Adds drawn cards to player's `handCards` |
| `PlayerCardUsabilityConsolidated` | Updates `canBeUsed`, `canBeCombed`, `isCurrentRoundPlayer`, `canBuyCard` |
| `PlayerStatusChanged` | Updates player's `status` (online/afk/offline) |
| `GameAmountToBuyChanged` | Updates `currentCardCombo.amountToBuy` |
| `GameRoundRemainingTimeChanged` | Updates round timer countdown |
| `GameHistoryConsolidated` | Updates game history list |

### Card Interaction Flow (CardDeck)

1. **Click card** → `toggleSelectedCard(cardId)` — toggles selection (red border)
2. **Click second card** → added to selection if same `type` (combo)
3. **Drag card** → `DraggableCard` + `react-dnd` with empty preview
4. **Drop on stack** → `CardStack.handleDrop()` → color modal if wild → `putCard()`
5. **Click away** → `handleClickOutsideCardDeck()` clears selection

### Player Layout (`getLayoutedOtherPlayers`)

Maps players to table positions based on count:

| Players | Layout positions |
|---------|-----------------|
| 2 | bottom, top |
| 3 | bottom, right, left |
| 4 | bottom, right, top, left |
| 5–8 | Uses corners (topLeft, topRight, bottomLeft, bottomRight) |

The current player is always at **"bottom"**.

---

## Key Files for Common Changes

| Task | Primary File(s) |
|------|-----------------|
| Add new card type | `shared/protocols/typings/Card.ts` → `CardService.ts` → `GameService.buildGameWithCardEffect` |
| Change game rules | `GameService.ts` (especially `buildPlayersWithCardUsability`, `buildGameWithCardEffect`) |
| Modify card visuals | `CardDeck/index.tsx` (hand), `CardStack/index.tsx` (pile) |
| Add new socket event | `shared/protocols/typings/Socket.ts` → `EventHandlerModule.ts` → `SocketStore` listener |
| Change player count | `GameService.setupGame()` (`maxPlayers`) |
| Modify round timer | `GameService.setupGame()` (`maxRoundDurationInSeconds`), `GameRoundService.ts` |
| Direction indicator | `CardStack/DirectionIndicator.tsx` |
| Add UI component | `unoenty/src/components/` + register in `components/index.ts` |
| Change card shuffle | `ArrayUtil.ts` (Fisher-Yates implementation) |

---

## Known Design Decisions & Gotchas

1. **No database** — All game state is in-memory (or Redis). Server restart = all games lost. This is intentional for a casual game.

2. **Card recycling** — When `usedCards` exceeds 10, overflow cards are shuffled back into `availableCards`. Wild cards get their `selectedColor` reset and image reverted to the black variant.

4. **Authoritative Server State** — Card plays are validated and applied on the backend first. The frontend waits for socket events (`PlayerPutCard`, `PlayerCardUsabilityConsolidated`, etc.) instead of mutating hand/stack optimistically.

5. **AFK Penalty (Draw + Skip)** — After the 30-second round timer expires, if the player is `"online"`, they are marked `"afk"`. The system then forces a `buyCard` and `passTurn`. This is a strict penalty; they do not get to play a card even if the drawn one is usable. If they already drew a card (`canPass: true`), it only triggers `passTurn`.

6. **`craco` not `react-scripts`** — The frontend uses `craco` to override Create React App's config (specifically for path aliases via `tsconfig-paths`).

7. **Singleton services** — All backend services (GameService, CardService, etc.) are exported as singletons (`export default new XxxService()`). No dependency injection.

8. **No authentication** — Players identify by a server-assigned UUID stored in the socket connection. There are no accounts, passwords, or sessions.

9. **`uuid` dependency** — Used in `CardService` but not explicitly listed in `unapy/package.json` dependencies. It works because it's hoisted from the root `node_modules`.

10. **Strict Draw Mechanics (Keep or Play)** — As of the newest architecture logic iteration, clicking "BUY CARD" forces a 1-card draw. If the drawn card is illegal, the backend intercepts and automatically shifts the turn to the next player. If it is legal, the core triggers an immediate "Hand Lock", eliminating usability across all other cards the player holds, and replaces the "BUY CARD" visual frame with "PASS", giving the player the standardized ability to manually skip their turn if they prefer to retain the legally drawn card.

11. **Per-game Rule Set (Scaffolded)** — Each game now carries `ruleSetId`; selection happens at creation time and affects only that game. `basic` is active, while `stacking-chaos`, `jump-in`, and `seven-zero` are placeholders for future isolated rule modules.

12. **Public Card Asset URL Required for Remote Play** — Card image URLs are embedded server-side from `STATIC_FILES_BASE_URL` (`CardService.buildCardPictureSrc`). For phone/remote users, this must be publicly reachable (for example a Cloudflare tunnel URL), not `localhost`.

13. **Per-player Card Back Selection** — Custom back images are loaded from `unapy/src/Assets/card-backs/custom` and exposed through `/card-backs`. Players can choose a back image in the sidebar; backend stores `player.cardBackSrc` per game and broadcasts `PlayerCardBackChanged`.
14. **Remote/Mobile Asset URL Normalization** — Frontend `SocketStore` normalizes incoming card/card-back asset URLs to `REACT_APP_API_URL/assets` to avoid broken images when backend payloads contain `localhost` while clients are on phone/tunnel.

---

## Custom Card Backs + Phone Checklist

### Storage + format

- Store custom back images in `packages/unapy/src/Assets/card-backs/custom/`
- Recommended size: `400 x 620` (ratio `1:1.55`)
- Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`
- Restart backend after adding/removing files

### Runtime behavior

- Menu selector is text-only (file names), no preview UI
- Card-back list is loaded HTTP-first from `GET /card-backs`, with socket fallback
- Selected back is visible on unrevealed cards to other players

### Remote/tunnel requirements (critical)

- `packages/unoenty/.env`:
  - `REACT_APP_API_URL=https://<backend-tunnel-url>`
- `packages/unapy/.env`:
  - `STATIC_FILES_BASE_URL=https://<backend-tunnel-url>/assets`
- For phone testing, run **two tunnels**:
  - backend tunnel to `localhost:5000`
  - frontend tunnel to `localhost:4000` (or chosen frontend port)
- If either env uses `localhost`, mobile clients can hang on login or fail to show hand/stack images

---

## Bug Fix History

### 2026-04-03 — Critical Game Logic Fixes

| # | Bug | Root Cause | Fix | File(s) |
|---|-----|-----------|-----|---------|
| 1 | First turn unplayable | `startGame()` left `usedCards` empty → `getTopStackCard()` returned `undefined` | Place a non-wild starter card on the stack during game init | `GameService.ts` |
| 2 | Wild card sets color to "black" | `putCard()` set `currentGameColor = cards[0].color` before `buildGameWithCardEffect` could override | Only set `currentGameColor` for non-wild cards | `GameService.ts` |
| 3 | React state mutation | `CardStack` called `.reverse()` on the store's array in-place | Use `[...array].reverse()` to avoid mutation | `CardStack/index.tsx` |
| 4 | Index 0 treated as out-of-bounds | `value <= min` triggered wrap-around for valid index 0 | Changed to `value < min` | `NumberUtil.ts`, `number.ts` |
| 5 | Card deselection clears all | Deselecting one card wiped the entire selection based on top-card color | Keep remaining same-type cards on deselect | `CardDeck/index.tsx` |
| 6 | TypeScript type mismatch | `selectedColor: null` assigned where `CardColors \| undefined` expected | Changed to `undefined` | `CardService.ts` |
| 7 | Non-standard deck composition | Game created exactly two double pseudo-decks (112 cards with 8 "0"s) violating UNO standard | Overhauled `CardService` generator to build exactly 1 standard 108-card deck per standard UNO rules | `CardService.ts` |

### 2026-04-03 — New Feature Mechanics

| Feature | Description | Relevant Files |
|---------|-------------|----------------|
| **Keep or Play** | Adjusted `buyCard` logic dynamically restricting players to exactly 1 draw alongside strict logic ensuring unplayable draws automate a turn-bypass. Playable draws instantiate an entirely new `"PassTurn"` Socket event mechanic allowing manual play termination. | `GameService.ts`, `Socket.ts` |
| **Hand Locking** | Integrated constraints inside `GameService`-driven payload events that immediately strips `canBeUsed` utility off cards following a playable draw exception, locking the player strictly toward the recently drawn instance per real UNO parameters. | `GameService.ts` |
| **Turn Rotation Visuals** | Deployed an aesthetic spinning `<SyncIcon />` from `@material-ui` mapping `@keyframes` classes synchronized instantly toward `game.direction` state to trace turn rotation intuitively. | `CardStack/index.tsx`, `styles.tsx` |
| **Bot Matchmaking** | Introduced `"bot"` to `PlayerStatus` array. Added dynamic host-only "ADD BOTS" button simulating exact slot injection to fill a game. Added host-only 'X' kick component for lobby purges. | `GameService.ts`, `Room/index.tsx`, `PlayerItem/index.tsx` |
| **Optimized Bot Logic** | Rewrote Server `nextRound()` execution loop enforcing a true `2000ms` `setTimeout` simulation prior to any bot action. Connected robust Wild Card intelligence causing bots to inherently calculate their maximum duplicate colors before making random blind judgments. Inherits identical `<UNO />` calling security constraints avoiding rule penalization dynamically. | `GameService.ts` |
| **UX/Mobile Mechanics** | Integrated fully scaled double tap detection (`onDoubleClick`) into the client's `DraggableCard` mapping paralleled with CSS intercepts (`touch-action: manipulation;`) dynamically averting DOM zoom latency to enable quick-firing directly from hand layout rather than strict bounds targeting via Drag & Drop. Refactored server reset mappings terminating standard users while persistently cycling `"bot"` clients back onto `ready: true` permitting instant consecutive rematches manually. | `CardDeck/index.tsx`, `GameService.ts` |

### 2026-04-03 — Code Cleanup

### 2026-04-05 — Visual & Logic Polish

| Feature | Description | File(s) |
|---------|-------------|---------|
| **Direction Ring** | Replaced `SyncIcon` with a custom SVG **DirectionIndicator** featuring a ring of arrows. Includes rotation based on `game.direction` and a glowing pulse animation targeting the current player's position. | `CardStack/DirectionIndicator.tsx` |
| **AFK Update** | Changed AFK behavior to strictly **Draw + Skip**. Added logic to prevent double-drawing if a player times out while in the `canPass` state. | `GameService.ts` |
| **30s Timer** | Standardized the round timer to a fixed 30 seconds across all environments. | `GameService.ts` |

### 2026-04-08 — Stability, Rulesets, and Networking

| Feature/Fix | Description | File(s) |
|---------|-------------|---------|
| **Per-game Ruleset Selector** | Added `ruleSetId` per game, create-game picker on dashboard, and backend resolver service. Only `basic` is enabled; future modes are scaffolded placeholders. | `shared/protocols/*`, `Dashboard/index.tsx`, `GameRulesService.ts`, `EventHandlerModule.ts`, `GameService.ts` |
| **Server-side Move Hardening** | Added backend guards for illegal card submissions (missing cards, duplicate IDs, mixed combos, unusable cards, invalid wild color). | `GameService.ts` |
| **Restart + Bot First Turn Fix** | Added start-of-round bot/AFK computed play dispatch and null-safe guards around restart/round transitions. | `GameService.ts` |
| **Winning on Last Multi-card Play** | Game now ends immediately when a player reaches zero cards after `putCard`, including combo plays. | `GameService.ts` |
| **Drawer Toggle Reliability** | Sidebar now uses a temporary drawer mode so the hamburger button consistently opens/closes on all layouts. | `components/Menu/index.tsx` |
| **Custom Card Backs** | Added per-player card back selection from local hosted assets with shared visibility for unrevealed cards. | `CardBackService.ts`, `CardBackController.ts`, `Menu/index.tsx`, `CardDeckPlaceholder/index.tsx`, shared socket/player typings |
| **Card Back UX Reliability** | Card-back options now load via HTTP-first (`/card-backs`) with socket fallback + timeout; selector is text-only and menu list renders inside drawer (`disablePortal`). | `components/Menu/index.tsx` |
| **Phone/Tunnel Login + Assets** | Documented and enforced dual-tunnel setup (frontend + backend), with `.env` expectations for remote play. | `README.md`, `.env` usage |
| **Mobile Card Rendering Fixes** | Normalized URLs for initial game state and live events (`PlayerPutCard`, `PlayerChoseCardColor`, `PlayerBoughtCard`, `PlayerCardBackChanged`) so hand/stack cards render on phones. | `store/Socket.tsx` |
