# Brio ⚡

> **Minimalist, zero-latency personal command center and life operating dashboard.**  
> Built with Next.js (App Router), TypeScript, Tailwind CSS, and Server Actions for instantaneous task capture and bi-directional Habitica synchronization.

---

## Features

- ⚡ **Frictionless Batch Capture:** Paste or type multiline tasks and dispatch them concurrently to Habitica in milliseconds using `Promise.allSettled`.
- 🧠 **Smart Syntax Parser:**
  - **Standard To-Do:** `Buy groceries`
  - **Daily (Recurring):** `* Morning 20m sprint review`
  - **Positive Habit:** `+ Drink 500ml water`
  - **Negative Habit:** `- Check social media during deep work`
  - **Dual Habit:** `+- Stairs vs Elevator`
  - **Hashtags:** `#work #deepwork #health`
  - **Notes / Description:** `Deploy hotfix // Review bug #104`
  - **Priority:** `!urgent` (Hard: 2), `!medium` (1.5), `!easy` (1), `!trivial` (0.1)
- 📊 **RPG Character Stats Ribbon:** Real-time Habitica HP, MP, EXP, Level, Class, and Gold gauges with low-HP alerts and manual sync.
- 🎯 **Segmented Task Stream:** High-density command view for Dailies, To-Dos, and Habits with active filters, streak indicators, and live scoring.
- ⌨️ **Keyboard Shortcut First:** Instant dispatch via <kbd>⌘ + Enter</kbd> (Mac) or <kbd>Ctrl + Enter</kbd> (Windows/Linux).
- 🛡️ **Zero-Crash Demo Fallback:** Operates with rich in-memory mock data when API keys are not yet configured.

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
│   │   └── tasks.ts               # Server Actions (submitBatchCaptureAction, toggleTaskAction, fetchDashboardDataAction)
│   ├── components/
│   │   ├── HeaderStatsRibbon.tsx   # Habitica stats ribbon (HP, MP, EXP, Level, GP)
│   │   ├── BatchCaptureInput.tsx   # Multiline input with live telemetry and Cmd+Enter dispatch
│   │   ├── TaskStream.tsx          # Categorized task stream with search & filter
│   │   ├── TaskItem.tsx            # Single task component with completion & habit counter triggers
│   │   └── SetupNotice.tsx         # Setup guide & status badge for Habitica credentials
│   ├── globals.css                # Polished dark theme, glowing accents, custom scrollbars
│   ├── layout.tsx                 # Root layout with Geist font & metadata
│   └── page.tsx                   # Main command center dashboard
├── lib/
│   ├── env.ts                     # Strongly-typed environment validation via Zod
│   ├── types.ts                   # Habitica models, task payloads, and batch telemetry
│   ├── habitica.ts                # Habitica API Client Service (Single Responsibility, batch Promise.allSettled)
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
