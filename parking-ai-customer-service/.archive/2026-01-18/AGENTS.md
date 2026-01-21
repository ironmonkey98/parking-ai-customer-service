# Repository Guidelines

## Project Overview

**Parking AI Customer Service** - An AI voice customer service system based on Alibaba Cloud IMS (Intelligent Media Services). Features AI-powered voice chat with seamless human agent takeover capability.

### Architecture

```
parking-ai-customer-service/
├── src/                    # User client (React 18 + TypeScript + Vite)
│   ├── hooks/useAICall.ts  # Core AI call logic and state management
│   ├── App.tsx             # Main application component
│   ├── components/         # Reusable UI components
│   └── assets/             # Static assets
├── agent-client/           # Agent workstation (React 19 + TypeScript + Vite)
│   ├── src/hooks/          # WebSocket and RTC call hooks
│   ├── src/components/     # Dashboard, SessionList, CallPanel
│   ├── src/api/            # API client layer
│   └── src/types.ts        # Shared TypeScript interfaces
├── server/                 # Backend API (Node.js + Express, CommonJS)
│   ├── server.js           # Main Express server
│   ├── socket.js           # Socket.IO WebSocket service
│   ├── managers/           # SessionManager, AgentStatusManager, QueueManager
│   └── utils/              # Utility functions (takeover, etc.)
├── index.html, css/, js/   # Legacy static H5 version (parallel to React)
└── vite.config.ts          # User client Vite config
```

---

## Build, Lint & Test Commands

### User Client (Root)
```bash
npm install              # Install frontend dependencies
npm run dev              # Vite dev server (port 5173, proxies /api -> 3000)
npm run build            # Production build (tsc + vite build)
npm run preview          # Preview production build
npm run server           # Start server/index.js (ESM version)
```

### Agent Client
```bash
cd agent-client
npm install              # Install agent client dependencies
npm run dev              # Vite dev server (port 5174)
npm run build            # Production build (tsc -b + vite build)
npm run lint             # ESLint check (eslint .)
npm run preview          # Preview production build
```

### Backend Server
```bash
cd server
npm install              # Install backend dependencies
npm start                # Start server.js (CommonJS, port 3000)
npm run dev              # Nodemon with auto-reload
```

### One-Command Startup (All Services)
```bash
./start-all.sh           # Start backend + user client + agent client
./stop-all.sh            # Stop all services
```

### Environment Setup
```bash
cp server/.env.example server/.env
# Fill in ALIBABA_CLOUD_ACCESS_KEY_ID, ALIBABA_CLOUD_ACCESS_KEY_SECRET,
# ALIBABA_CLOUD_RTC_APP_ID, ALIBABA_CLOUD_RTC_APP_KEY, AGENT_ID, etc.
```

---

## Code Style Guidelines

### TypeScript (src/, agent-client/src/)

| Rule | Convention |
|------|------------|
| Indentation | 2 spaces |
| Quotes | Single quotes |
| Semicolons | Required |
| Types | Avoid `any`; use explicit interfaces |
| File naming | PascalCase for components (e.g., `CallPanel.tsx`) |
| Hook naming | `useXxx` prefix (e.g., `useAICall.ts`) |
| CSS classes | kebab-case (e.g., `call-panel`, `status-listening`) |

### TypeScript Compiler Options

User client (`tsconfig.json`):
- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2020, Module: ESNext

Agent client (`agent-client/tsconfig.app.json`):
- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`
- Target: ES2022, Module: ESNext

### ESLint (agent-client only)
- Uses flat config (`eslint.config.js`)
- Extends: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Run: `npm run lint` in agent-client directory

### Backend JavaScript (server/)

| Rule | Convention |
|------|------------|
| Module system | CommonJS (`require`/`module.exports`) in `server.js` |
| Module system | ESM (`import`/`export`) in `server/index.js` |
| Logging | Use the `logger` utility (debug/info/warn/error levels) |
| Error handling | Always catch and log errors; return structured JSON responses |

---

## Import Conventions

### Frontend (React/TypeScript)
```typescript
// 1. React imports first
import React, { useEffect, useState, useCallback, useRef } from 'react';

// 2. Third-party libraries
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

// 3. SDK imports
import AICallEngine, { AICallAgentType, AICallAgentState } from 'aliyun-auikit-aicall';

// 4. Local imports (components, hooks, types)
import { useAICall } from './hooks/useAICall';
import type { ConversationMessage } from './types';
import './App.css';
```

### Backend (CommonJS)
```javascript
// 1. Built-in Node modules
const crypto = require('crypto');
const http = require('http');

// 2. Third-party packages
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// 3. Alibaba Cloud SDKs
const OpenApi = require('@alicloud/openapi-client');

// 4. Local modules
const sessionManager = require('./managers/SessionManager');
const { initWebSocket } = require('./socket');
```

---

## Error Handling Patterns

### Frontend Hooks
```typescript
try {
  setCallState('connecting');
  setError(null);
  const response = await axios.post('/api/start-call', { userId });
  // ... handle success
} catch (e: any) {
  console.error(e);
  setError(e.message || 'Failed to start call');
  setCallState('idle');
}
```

### Backend API Routes
```javascript
app.post('/api/endpoint', async (req, res) => {
  try {
    // ... business logic
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});
```

---

## Testing Guidelines

- **No automated tests currently configured** - `server/package.json` test script is a placeholder
- If adding tests:
  - Frontend: `src/__tests__/*.test.ts(x)` or `*.spec.ts(x)`
  - Backend: `server/__tests__/*.spec.js`
  - Recommended frameworks: Vitest (frontend), Jest/Mocha (backend)

---

## Git & PR Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- PR description should include:
  - Summary of changes
  - Testing steps
  - Screenshots for UI changes
  - Port or config changes if applicable

---

## Security & Configuration

- **NEVER commit `.env` files** - use `server/.env.example` as template
- All secrets (AccessKey, RTC keys) must be in backend environment variables only
- Frontend uses Vite proxy to access backend API (`/api` -> `localhost:3000`)
- If changing ports, update both `vite.config.ts` and documentation

### Required Environment Variables (server/.env)
```
ALIBABA_CLOUD_ACCESS_KEY_ID=xxx
ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx
ALIBABA_CLOUD_REGION=cn-shanghai
AGENT_ID=xxx
ALIBABA_CLOUD_RTC_APP_ID=xxx
ALIBABA_CLOUD_RTC_APP_KEY=xxx
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/useAICall.ts` | User client AI call hook (start/end call, human takeover) |
| `agent-client/src/hooks/useWebSocket.ts` | Agent WebSocket connection and session management |
| `agent-client/src/hooks/useRTCCall.ts` | Agent RTC call management |
| `agent-client/src/types.ts` | Shared TypeScript interfaces |
| `server/server.js` | Main API server (CommonJS) |
| `server/socket.js` | Socket.IO WebSocket service |
| `server/managers/*.js` | Session, Agent, Queue managers |
| `vite.config.ts` | User client Vite config (port 5173) |
| `agent-client/vite.config.ts` | Agent client Vite config (port 5174) |

---

## Modification Notes

1. **Before modifying**: Confirm whether targeting React version or legacy H5 static version
2. **User client vs Agent client**: Separate projects with different React versions (18 vs 19)
3. **Backend module style**: `server.js` uses CommonJS; `index.js` uses ESM - don't mix
4. **Port coordination**: User=5173, Agent=5174, Backend=3000
