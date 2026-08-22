# Brio ⚡

> **Minimalist, zero-latency personal command center and life operating dashboard.**  
> Built with Next.js (App Router), TypeScript, Tailwind CSS, and Server Actions for instantaneous task capture and bi-directional Habitica synchronization.  
> Inspired by **Raycast** (Global `⌘K` palette & shortcuts) and **Linear** (Vim-style navigation & right inspector pane).

---

## Features

- ⚡ **Raycast Command Palette (`⌘K`):** Global fuzzy action palette to search tasks, filter by `#tag`, rest at the inn, force sync, or switch views.
- 🎯 **Linear-Style Split-Pane Inspector:** Select tasks (`Enter` / `j/k`) to inspect full markdown notes, interactive subtask checklists, priority tiers, and Habitica health values.
- ⌨️ **Vim Keyboard Navigation:**
  - <kbd>j</kbd> / <kbd>k</kbd> or <kbd>↓</kbd> / <kbd>↑</kbd>: Move selection between tasks
  - <kbd>Space</kbd> / <kbd>x</kbd>: Check off To-Dos & Dailies
  - <kbd>+</kbd> / <kbd>-</kbd>: Score Habits
  - <kbd>Enter</kbd> / <kbd>e</kbd>: Focus task in Inspector Pane
  - <kbd>d</kbd>: Delete task
  - <kbd>/</kbd>: Focus rapid Omnibar
  - <kbd>⌘B</kbd> or <kbd>C</kbd>: Open Batch Capture Modal
  - <kbd>Esc</kbd>: Close inspector / palette
- 🪄 **Hybrid Omnibar & `#` Autocomplete:** 1-line rapid single task capture with instant tag suggestion dropdown.
- 📦 **Frictionless Batch Capture:** Paste or type multiline tasks and dispatch them concurrently to Habitica in milliseconds using `Promise.allSettled`.
- 🧠 **Smart Syntax Parser:**
  - **Standard To-Do:** `Buy groceries`
  - **Daily (Recurring):** `* Morning 20m sprint review`
  - **Positive Habit:** `+ Drink 500ml water`
  - **Negative Habit:** `- Check social media during deep work`
  - **Dual Habit:** `+- Stairs vs Elevator`
  - **Hashtags:** `#work #deepwork #health`
  - **Notes / Description:** `Deploy hotfix // Review bug #104`
  - **Priority:** `!urgent` (Hard: 2), `!medium` (1.5), `!easy` (1), `!trivial` (0.1)
- 📊 **RPG Character Stats Ribbon:** Real-time Habitica HP, MP, EXP, Level, Class, Gold gauges, and "Rest at the Inn" toggle.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Habitica credentials (found at [Habitica Settings > API](https://habitica.com/user/settings/api)):
```env
HABITICA_USER_ID=your_habitica_user_id
HABITICA_API_KEY=your_habitica_api_token
HABITICA_BASE_URL=https://habitica.com/api/v3
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture & Project Structure

```
brio/
├── app/
│   ├── actions/
│   │   └── tasks.ts               # Server Actions (CRUD, batch capture, subtasks, sleep toggle)
│   ├── components/
│   │   ├── BrioCommandCenter.tsx   # Split-pane orchestrator and state coordinator
│   │   ├── CommandPalette.tsx      # Global Cmd+K launcher with fuzzy search & actions
│   │   ├── TaskInspectorPane.tsx   # Linear right drawer for notes, checklists, & tags
│   │   ├── HybridOmnibar.tsx       # 1-line rapid capture bar + tag autocompletion
│   │   ├── TagAutocomplete.tsx     # Instant dropdown suggestion popup for #tags
│   │   ├── BatchCaptureModal.tsx   # High-focus multiline batch dispatch modal
│   │   ├── HeaderStatsRibbon.tsx   # Habitica stats ribbon (HP, MP, EXP, Level, GP, Rest)
│   │   ├── TaskStream.tsx          # Vim keyboard-navigable task stream
│   │   ├── TaskItem.tsx            # Minimalist card with active selection ring & progress pills
│   │   └── SetupNotice.tsx         # Setup guide & status badge
│   ├── globals.css                # Polished dark theme, glowing accents, custom scrollbars
│   ├── layout.tsx                 # Root layout with Geist font & metadata
│   └── page.tsx                   # Main server page
├── lib/
│   ├── env.ts                     # Strongly-typed environment validation via Zod
│   ├── types.ts                   # Habitica models, task payloads, and batch telemetry
│   ├── habitica.ts                # Habitica API Client Service (CRUD, batch with Promise.allSettled)
│   ├── parser.ts                  # Multiline text parser with tag/note/priority extraction
│   └── utils.ts                   # Formatting & color helpers
├── __tests__/
│   └── parser.test.ts             # Parser test suite
├── .env.example                   # Template for environment variables
└── README.md
```

---

## Batch Syntax Cheatsheet

| Input Example | Parsed Type | Notes / Behavior |
|---|---|---|
| `Finish presentation #work` | `todo` | Tags: `["work"]` |
| `* Read 20 pages #growth` | `daily` | Asterisk `*` marks recurring daily |
| `+ Drink 2L water` | `habit` | Up: `true`, Down: `false` |
| `- Doomscrolling` | `habit` | Up: `false`, Down: `true` |
| `+- Walk instead of drive` | `habit` | Up: `true`, Down: `true` |
| `Deploy v1 !urgent #release // Check logs` | `todo` | Priority: `2`, Notes: `Check logs`, Tags: `["release"]` |

---

## Running Unit Tests

```bash
npx tsx --test __tests__/parser.test.ts
```

---

## Production Build

```bash
npm run build
```
