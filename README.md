# SecureTrack - AI-Powered Code Security Issue Tracker
![SecureTrack](https://img.shields.io/badge/SecureTrack-v2.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)

**AI-Powered Code Vulnerability Detection, Issue Tracking, and Automated Fixes for Security-Conscious Development Teams**

Automatically scan code for security vulnerabilities, track and manage issues, apply AI-generated fixes with diff previews, and monitor your security posture in real time.

---

## Problem Statement

Development teams face a constant challenge in identifying, tracking, and resolving security vulnerabilities in their codebases. Traditional methods are:

- **Time-intensive**: Manual code reviews for security flaws take hours per session
- **Inconsistent**: Human reviewers miss different issues depending on familiarity with attack vectors
- **Disorganised**: Vulnerabilities found during review get lost without a dedicated tracking system
- **Reactive**: No systematic way to measure security health trends over time
- **Slow to remediate**: Developers must research fixes independently after a vulnerability is flagged

SecureTrack addresses all of these by combining AI-powered code analysis, a full issue management workflow, automated fix suggestions with side-by-side diff previews, and a real-time notification system — all in a single platform.

---

## Our Solution

SecureTrack is a full-stack application that brings together AI vulnerability scanning and project issue tracking into one unified workflow.

### Core Capabilities

- **AI Code Analysis**: Submit a code snippet and language; receive a structured vulnerability report with severity ratings, line numbers, descriptions, and fix suggestions
- **Issue Tracker**: Create, assign, update, and close security issues with full CRUD support and status/priority management
- **AI Fix Engine**: Request an AI-generated corrected version of vulnerable code and view a line-by-line diff before applying
- **Analytics Dashboard**: Visualise issue breakdown by status, priority, and creation timeline using interactive charts
- **Real-Time Notifications**: Receive in-app alerts via WebSocket when issues are created, updated, assigned, or when vulnerabilities are found
- **Analysis History**: Browse all past code scans with full results, scores, and metadata
- **Rate-Limited AI Endpoints**: Per-user request throttling protects against abuse and API quota exhaustion

### Key Features

- Two-stage AI pipeline: analysis (vulnerability detection + scoring) and fix (corrected code + unified diff)
- WebSocket-powered live notifications with multi-tab/multi-device support
- JWT-based authentication with bcrypt password hashing
- Source-linked issues: issues can be created directly from a vulnerability found during analysis
- Coverage-tested backend with Jest (50%+ branch/function/line thresholds enforced)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Provider   │
│   (React 18)    │◄──►│   (Express)     │◄──►│   (Groq / LLM)  │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • llama-3.3-70b │
│ • Analyze Page  │    │ • JWT Auth      │    │ • Vuln Analysis │
│ • AI Fix Page   │    │ • Socket.io     │    │ • Code Fix Gen  │
│ • History       │    │ • MongoDB ORM   │    │                 │
│ • Issue Tracker │    │ • Rate Limiting │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Database      │    │   Background    │
│   (Socket.io)   │    │   (MongoDB)     │    │   Processing    │
│                 │    │                 │    │                 │
│ • Live Notifs   │    │ • Users         │    │ • AI Inference  │
│ • Multi-device  │    │ • Issues        │    │ • Notif Fanout  │
│ • Auth Handshake│    │ • Analyses      │    │ • TTL Cleanup   │
└─────────────────┘    │ • Notifications │    └─────────────────┘
                       └─────────────────┘
```

### Data Flow

1. **Auth**: User registers/logs in → JWT issued → stored in `localStorage`
2. **Socket**: On login, client opens an authenticated Socket.io connection using the JWT
3. **Analyse**: User submits code → POST `/api/analyze` → AI provider called → result stored in `Analysis` collection → returned to client
4. **Fix**: User requests fix → POST `/api/ai/fix` → AI returns corrected code → diff generated server-side → returned with unified diff
5. **Issues**: CRUD operations on `/api/issues` → on create/update, `notificationService` fans out notifications to affected users
6. **Notifications**: Stored in MongoDB (TTL: 90 days) and simultaneously emitted via Socket.io to all active sessions of the recipient
7. **Analytics**: Single GET `/api/analytics` aggregates issue counts by status, priority, and timeline into chart-ready payloads

---

## Technology Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router DOM | 6.21 | Client-side routing |
| Bootstrap 5 + Bootstrap Icons | 5.3 | Responsive styling and icon set |
| Chart.js + react-chartjs-2 | 4.4 | Dashboard analytics charts |
| react-diff-viewer-continued | 3.4 | Side-by-side code diff display |
| Socket.io Client | 4.7 | Real-time WebSocket connection |
| Axios | 1.6 | HTTP client with interceptors |

### Backend

| Package | Version | Purpose |
|---|---|---|
| Express | 4.18 | HTTP framework |
| Mongoose | 8.0 | MongoDB ODM |
| Socket.io | 4.7 | WebSocket server |
| jsonwebtoken | 9.0 | JWT signing and verification |
| bcryptjs | 2.4 | Password hashing (12 salt rounds) |
| express-rate-limit | 7.1 | Per-user AI endpoint throttling |
| express-validator | 7.0 | Input validation middleware |
| diff | 5.1 | Server-side unified diff generation |
| morgan | 1.10 | HTTP request logging (dev) |

### AI / ML

| Service | Model | Purpose |
|---|---|---|
| Groq API | llama-3.3-70b-versatile | Code vulnerability analysis and fix generation |
| (Swappable) | claude-sonnet-4-20250514 | Model string in `Analysis` records; swap via `claudeClient.js` |

### Infrastructure

| Service | Purpose |
|---|---|
| MongoDB Atlas | Primary database (cloud) |
| Render | Backend deployment (`render.yaml` included) |
| Vercel | Frontend deployment (`vercel.json` included) |
| Jest + Supertest | Backend unit and integration testing with coverage |

---

## Project Structure

```
Secure_Track-main/
├── frontend/                          # React frontend application
│   ├── public/
│   │   └── index.html                 # HTML shell
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js               # Axios instance + all API modules
│   │   ├── components/
│   │   │   ├── Navbar.js              # Top nav with notification bell
│   │   │   ├── ProtectedRoute.js      # Auth guard wrapper
│   │   │   ├── charts/
│   │   │   │   ├── PriorityChart.js   # Doughnut chart — issues by priority
│   │   │   │   ├── StatusChart.js     # Bar chart — issues by status
│   │   │   │   └── TimelineChart.js   # Line chart — issues over time
│   │   │   ├── diff/
│   │   │   │   └── DiffViewer.js      # Side-by-side diff for AI fixes
│   │   │   └── notifications/
│   │   │       └── NotificationBell.js # Bell icon + dropdown panel
│   │   ├── context/
│   │   │   └── AuthContext.js         # Auth state, login/logout helpers
│   │   ├── hooks/
│   │   │   ├── useSocket.js           # Socket.io connection lifecycle hook
│   │   │   └── useNotifications.js    # Notification state + REST/socket sync
│   │   ├── pages/
│   │   │   ├── Login.js               # Login form
│   │   │   ├── Register.js            # Registration form
│   │   │   ├── Dashboard.js           # Main dashboard with charts + issues list
│   │   │   ├── AnalyzePage.js         # Code submission form
│   │   │   ├── AnalysisResults.js     # Vulnerability report view
│   │   │   ├── AiFixPage.js           # AI fix request + diff viewer
│   │   │   ├── HistoryPage.js         # Past analysis history
│   │   │   └── IssueForm.js           # Create / edit issue form
│   │   ├── styles/
│   │   │   └── theme.css              # Global CSS custom properties and overrides
│   │   ├── App.js                     # Router, layout, socket/notif wiring
│   │   └── index.js                   # React DOM entry point
│   ├── vercel.json                    # Vercel SPA rewrite rules
│   └── package.json
│
├── backend/                           # Express + Socket.io backend
│   ├── controllers/
│   │   ├── authController.js          # Register, login, getMe
│   │   ├── analyzeController.js       # Code analysis + history endpoints
│   │   ├── aiFixController.js         # AI fix + diff generation
│   │   ├── issueController.js         # Issue CRUD + notification fanout
│   │   ├── notificationController.js  # Notification read/delete endpoints
│   │   └── analyticsController.js     # Dashboard aggregation queries
│   ├── middleware/
│   │   ├── auth.js                    # JWT `protect` middleware
│   │   └── validators.js              # express-validator rule sets
│   ├── models/
│   │   ├── User.js                    # User schema with bcrypt hooks
│   │   ├── Issue.js                   # Issue schema with indexes
│   │   ├── Analysis.js                # Code analysis + vulnerability sub-docs
│   │   └── Notification.js            # Notification schema with 90-day TTL
│   ├── routes/
│   │   ├── auth.js                    # /api/auth
│   │   ├── issues.js                  # /api/issues
│   │   ├── analyze.js                 # /api/analyze
│   │   ├── ai.js                      # /api/ai
│   │   ├── notifications.js           # /api/notifications
│   │   └── analytics.js               # /api/analytics
│   ├── services/
│   │   └── notificationService.js     # Notification creation + socket emit helpers
│   ├── sockets/
│   │   └── socketServer.js            # Socket.io init, JWT auth middleware, room management
│   ├── utils/
│   │   ├── claudeClient.js            # AI provider wrapper (Groq / swappable)
│   │   └── jwt.js                     # JWT sign/verify helpers
│   ├── __tests__/
│   │   ├── auth.test.js               # Auth endpoint tests
│   │   └── services.test.js           # Notification service tests
│   ├── render.yaml                    # Render deployment config
│   ├── .env.example                   # Environment variable template
│   └── package.json
│
└── README.md                          # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB 6+)
- Groq API key — free at [console.groq.com](https://console.groq.com) (30 req/min, 6000 req/day, no credit card)

### Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd Secure_Track-main
```

**2. Backend setup**

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values (see Environment Configuration below)
```

**3. Frontend setup**

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
```

### Environment Configuration

**Backend `.env`**

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/securetrack
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_api_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend `.env`**

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

**Start the backend**

```bash
cd backend
npm run dev      # nodemon with hot reload
# or
npm start        # production
```

**Start the frontend**

```bash
cd frontend
npm start
```

**Access the application**

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/health |

---

## API Endpoints

All endpoints (except `/api/auth/*`) require a `Bearer <token>` Authorization header.

### Authentication — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (name, email, password) |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current authenticated user |

### Issues — `/api/issues`

| Method | Path | Description |
|---|---|---|
| GET | `/api/issues` | List all issues for the current user (filterable by status, priority) |
| POST | `/api/issues` | Create a new issue |
| PUT | `/api/issues/:id` | Update an existing issue |
| DELETE | `/api/issues/:id` | Delete an issue |

### Code Analysis — `/api/analyze`

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze` | Submit code for vulnerability analysis (rate-limited: 10/15 min) |
| GET | `/api/analyze/history` | Paginated list of past analyses |
| GET | `/api/analyze/history/:id` | Full result for a single analysis |

### AI Fix — `/api/ai`

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/analyze` | Re-analyse code for fix context (rate-limited: 10/15 min) |
| POST | `/api/ai/fix` | Get AI-generated fix + unified diff for provided code (rate-limited) |

### Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications (paginated) |
| GET | `/api/notifications/unread-count` | Get unread notification count |
| PATCH | `/api/notifications/:id/read` | Mark a single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |
| DELETE | `/api/notifications/:id` | Delete a single notification |
| DELETE | `/api/notifications` | Clear all notifications |

### Analytics — `/api/analytics`

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics` | Aggregated dashboard data (status counts, priority counts, timeline) |

---

## Database Models

### User

| Field | Type | Notes |
|---|---|---|
| name | String | 2–50 characters, required |
| email | String | Unique, lowercase, validated |
| password | String | Bcrypt hashed (12 rounds), hidden from JSON output |
| role | String | `user` or `admin`, default `user` |

### Issue

| Field | Type | Notes |
|---|---|---|
| title | String | 3–200 characters, required |
| description | String | Up to 5000 characters, required |
| status | String | `Open`, `In Progress`, `Closed` |
| priority | String | `Low`, `Medium`, `High`, `Critical` |
| assignedTo | String | Free-text assignee name |
| tags | [String] | Arbitrary tag array |
| sourceVulnerability | Object | Optional link back to an `Analysis` document and vulnerability id |
| createdBy | ObjectId | Reference to `User` |

### Analysis

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Reference to `User` |
| codeSnippet | String | Submitted code (up to 50 000 characters) |
| language | String | Programming language label |
| result.vulnerabilities | [Object] | Array of `{id, title, severity, description, suggestion, line}` |
| result.score | Number | Security score 0–10 |
| result.summary | String | AI-generated overall summary |
| processingTimeMs | Number | Time taken for AI call |
| modelUsed | String | AI model identifier |

### Notification

| Field | Type | Notes |
|---|---|---|
| recipient | ObjectId | User who receives the notification |
| actor | ObjectId | User who triggered the event (null for system events) |
| type | String | `ISSUE_CREATED`, `ISSUE_UPDATED`, `ISSUE_ASSIGNED`, `ISSUE_STATUS_CHANGED`, `VULNERABILITY_FOUND` |
| title | String | Short notification heading |
| message | String | Full notification body |
| link | String | Optional deep-link URL |
| relatedIssue | ObjectId | Optional reference to the related `Issue` |
| read | Boolean | Default `false` |
| readAt | Date | Timestamp when marked read |
| TTL | — | Auto-deleted after 90 days |

---

## Real-Time WebSocket System

SecureTrack uses Socket.io for live notification delivery.

**Authentication**: Every socket connection is authenticated via JWT at the handshake stage. Connections without a valid token are rejected before the `connection` event fires.

**Room strategy**: Each authenticated user is automatically joined to the personal room `user:<userId>`. Notifications are emitted to this room so all tabs and devices the user has open receive them simultaneously.

**Notification fanout**: When an issue is created or updated, `notificationService` creates a `Notification` document in MongoDB (for persistence) and calls `emitToUser()` to push the same payload to the recipient's active sockets in real time.

**Client hooks**:
- `useSocket` manages the Socket.io client lifecycle, reconnection, and cleanup
- `useNotifications` combines the socket feed with a REST polling fallback and exposes a unified notification state to the UI

---

## AI Pipeline

### Vulnerability Analysis

1. User submits `{ code, language }` to `POST /api/analyze`
2. `analyzeController` records a pending `Analysis` document and calls `analyzeCodeWithClaude()`
3. `claudeClient.js` sends the code to the Groq API with a strict JSON-only system prompt
4. The response is parsed and validated against the expected schema
5. The `Analysis` document is updated with the result and returned to the client
6. Processing time is recorded in `processingTimeMs`

### AI Fix Generation

1. User submits `{ code, language }` to `POST /api/ai/fix`
2. `aiFixController` calls the AI provider requesting a corrected version
3. The server uses the `diff` library to compute a unified diff between original and fixed code
4. Both the fixed code and the diff are returned to the client for display in `DiffViewer`

### Model Configuration

The AI provider and model are fully centralised in `backend/utils/claudeClient.js`. Switching from Groq to the Anthropic API (or any OpenAI-compatible endpoint) requires changing three constants at the top of that file — no other code changes needed.

---

## Dashboard Features

### Analytics Charts

- **Status Chart** (bar): issues grouped by `Open`, `In Progress`, `Closed`
- **Priority Chart** (doughnut): issues grouped by `Low`, `Medium`, `High`, `Critical`
- **Timeline Chart** (line): cumulative issue creation over time

### Issue Management

- Filter and sort issues by status, priority, or creation date
- Create issues directly from a vulnerability found in an analysis (pre-populated form)
- Edit and reassign issues inline
- Delete issues with confirmation

### Notification Centre

- Bell icon in the navbar with an unread badge count
- Dropdown panel listing recent notifications with read/unread state
- Mark individual or all notifications as read
- Auto-cleared from the database after 90 days via MongoDB TTL index

---

## Security

- **JWT Auth**: Stateless authentication; tokens expire in 7 days (configurable)
- **Password hashing**: bcryptjs with 12 salt rounds
- **Auth middleware**: `protect` dependency injected on every non-public route
- **Rate limiting**: AI endpoints capped at 10 requests per 15 minutes per user, keyed on `user._id`
- **Input validation**: All request bodies validated with `express-validator` before hitting controllers
- **CORS**: Restricted to `CLIENT_URL` with `credentials: true`
- **Socket auth**: JWT verified at handshake — unauthenticated socket connections are refused before reaching any handler

---

## Testing

The backend ships with Jest + Supertest coverage enforced at 50% across branches, functions, and lines.

```bash
cd backend
npm test                 # run tests with coverage report
npm run test:watch       # watch mode during development
```

Coverage reports are written to `backend/coverage/` and include an HTML report at `backend/coverage/lcov-report/index.html`.

---

## Deployment

### Backend — Render

A `render.yaml` is included. Set the following environment variables in the Render dashboard:

```env
MONGODB_URI=<Atlas production URI>
JWT_SECRET=<strong random secret>
GROQ_API_KEY=<your Groq key>
CLIENT_URL=<your Vercel frontend URL>
NODE_ENV=production
```

### Frontend — Vercel

A `vercel.json` is included with SPA rewrite rules. Set:

```env
REACT_APP_API_URL=<your Render backend URL>/api
```

### Production Checklist

- Swap SQLite → use MongoDB Atlas with IP allowlist
- Set `NODE_ENV=production` (disables morgan logging)
- Use a strong, unique `JWT_SECRET` (32+ random characters)
- Enable Render's automatic deploys from the `main` branch
- Set Vercel's production domain in `CLIENT_URL` on the backend

---

## Contributing

We welcome contributions to SecureTrack! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

---

## Acknowledgments

- [Groq](https://console.groq.com) for the fast, free LLM inference API
- [Ultralytics / Meta](https://ai.meta.com) for the Llama 3.3 model
- [Socket.io](https://socket.io) for the real-time WebSocket framework
- [Mongoose](https://mongoosejs.com) for elegant MongoDB object modelling
- [React](https://react.dev) and [Express](https://expressjs.com) communities for excellent documentation
- Security research and open-source tooling communities for inspiration

---

*Built with ❤️ for secure software development*

**Empowering developers to ship safer code through intelligent, real-time security analysis.**
