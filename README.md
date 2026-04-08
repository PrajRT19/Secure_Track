# SecureTrack v2 — MERN + AI Auto-Fix + Real-Time + Analytics

v2 adds: Real-time WebSocket notifications · AI Auto-Fix with diff viewer · Chart.js analytics · Jest tests

## Quick Start

### Backend
```bash
cd backend && npm install
cp .env.example .env  # fill MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY, CLIENT_URL
npm run dev
```

### Frontend
```bash
cd frontend && npm install
cp .env.example .env  # fill REACT_APP_API_URL, REACT_APP_SOCKET_URL
npm start
```

### Tests
```bash
cd backend && npm test
```

## New in v2

| Feature | Files |
|---------|-------|
| Real-Time Notifications | sockets/socketServer.js, services/notificationService.js, models/Notification.js |
| AI Auto-Fix + Diff | controllers/aiFixController.js, routes/ai.js, pages/AiFixPage.js, components/diff/DiffViewer.js |
| Analytics Charts | controllers/analyticsController.js, components/charts/*.js |
| Jest Tests | __tests__/auth.test.js, __tests__/services.test.js |

## New API Endpoints

- GET/PATCH/DELETE /api/notifications
- POST /api/ai/analyze
- POST /api/ai/fix
- GET /api/analytics

## Socket.io Auth Flow

Client sends JWT in handshake auth object. Server verifies via middleware before accepting connection. Users join a personal room user:{id} so notifications are delivered privately.

## How AI Fix Works

1. POST /api/ai/analyze — Claude detects all vulnerabilities, returns structured JSON
2. POST /api/ai/fix — Claude rewrites code to fix all issues, server generates unified diff
3. Frontend shows split/unified diff viewer with Apply Fix button
4. Applying replaces code in editor, user can re-scan to confirm score improved
