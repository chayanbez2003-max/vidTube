# vidTube 🎥

A **production-grade, scalable video-sharing platform** built with the MERN stack (MongoDB, Express.js, React 19, Node.js). Features advanced authentication, real-time notifications, video processing, AI-ready architecture, creator analytics, and a modern responsive frontend.

---

## 🌟 Key Features

### 🔐 Authentication & Security
- **JWT Access + Refresh Tokens** — Secure dual-token authentication
- **Email Verification** — Nodemailer-powered email verification flow
- **Password Reset** — Forgot/reset password with secure tokenized links
- **Role-Based Access Control** — Admin, Creator, and User roles with middleware protection
- **Helmet** — HTTP security headers
- **Rate Limiting** — API-level and auth-specific rate limiting to prevent abuse

### 🎬 Video Management
- **Upload & Publish** — Video + thumbnail uploads via Multer → Cloudinary
- **FFmpeg Video Processing** — Compression, multi-resolution encoding (360p/480p/720p), thumbnail generation
- **Advanced Metadata** — Tags, categories (12 predefined), trending scores, watch time tracking
- **CRUD Operations** — Create, read, update, delete with ownership verification

### 🔎 Advanced Search
- **Fuzzy Search** — Regex-based search across titles, descriptions, and tags
- **Multi-type Search** — Search for videos, channels, or tags
- **Autocomplete Suggestions** — Real-time search suggestions
- **Trending Keywords** — Auto-generated trending search terms

### 📊 Trending Algorithm
- **Weighted Scoring** — `views × 0.4 + likes × 0.3 + comments × 0.2 + watchTime × 0.1`
- **Time Decay** — Newer content gets a relevance boost
- **Automatic Refresh** — Trending scores update hourly via background process

### ⚡ Real-Time System (Socket.IO)
- **Live Notifications** — Instant push notifications for likes, comments, subscriptions, uploads
- **Multi-Device Support** — Socket mapping for multiple tabs/devices per user
- **Toast Alerts** — Beautiful in-app notification toasts

### 📈 Creator Analytics Dashboard
- **Channel Analytics** — Total views, subscribers, engagement rate, watch time
- **Subscriber Growth** — 30-day growth tracking
- **Video Analytics** — Per-video metrics: watch completion, engagement rate
- **Top Performing Videos** — Ranked by views

### 🎯 Watch Progress & Resume
- **Watch Progress Tracking** — Stores how far users watched each video
- **Resume Playback** — "Continue Watching" feed for partially-watched videos
- **Completion Detection** — Auto-marks videos as complete at 95% watch percentage

### 📡 Live Streaming (Stage 4)
- **Go Live Studio** — Start a live stream with camera and microphone access
- **Real-Time Data** — Real-time viewer count and "Live" status synchronization
- **Live Chat** — Synchronized stream chat using Socket.IO isolated in stream rooms
- **Stream Discovery** — Live streams directory to discover active broadcasts

### 💬 Social Features
- **Comments** — Add, edit, delete with like counts
- **Likes** — Toggle likes on videos, comments, and tweets
- **Tweets** — Community posts by creators
- **Subscriptions** — Subscribe/unsubscribe to channels
- **Playlists** — Create and manage video playlists

### 🔔 Notifications
- **Database-backed** — Persistent notification storage
- **Real-time Push** — Socket.IO-powered instant delivery
- **Mark as Read** — Individual and bulk read management
- **Notification Types** — Like, comment, subscribe, upload

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client with token interceptors |
| **Framer Motion** | Animations |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Recharts** | Creator analytics charts |
| **React Hot Toast** | Notification toasts |
| **React Player** | Video playback |
| **React Icons** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | Server framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT + bcrypt** | Authentication |
| **Cloudinary** | Media storage |
| **Multer** | File upload handling |
| **Socket.IO** | Real-time WebSockets |
| **Nodemailer** | Email service |
| **FFmpeg (fluent-ffmpeg)** | Video processing |
| **Helmet** | Security headers |
| **Express Rate Limit** | API rate limiting |

---

## 📦 Project Structure

```
vidTube/
├── Backend/
│   └── src/
│       ├── controllers/         # Route handlers
│       │   ├── user.controller.js
│       │   ├── video.controller.js
│       │   ├── comment.controller.js
│       │   ├── like.controller.js
│       │   ├── subscription.controller.js
│       │   ├── tweet.controller.js
│       │   ├── playlist.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── notification.controller.js
│       │   ├── search.controller.js        # ← NEW
│       │   ├── watchProgress.controller.js # ← NEW
│       │   ├── analytics.controller.js     # ← NEW
│       │   └── healthCheck.controller.js
│       ├── models/              # Mongoose schemas
│       │   ├── user.model.js        # + roles, email verification fields
│       │   ├── video.model.js       # + tags, categories, trendingScore
│       │   ├── watchProgress.model.js # ← NEW
│       │   ├── comment.model.js
│       │   ├── like.model.js
│       │   ├── subscription.model.js
│       │   ├── tweet.model.js
│       │   ├── playlist.model.js
│       │   └── notification.model.js
│       ├── routes/              # Express routers
│       │   ├── search.routes.js         # ← NEW
│       │   ├── watchProgress.routes.js  # ← NEW
│       │   ├── analytics.routes.js      # ← NEW
│       │   └── ... (existing routes)
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   ├── role.middleware.js    # ← NEW (RBAC)
│       │   └── multer.middleware.js
│       ├── utils/
│       │   ├── ApiError.js
│       │   ├── ApiResponse.js
│       │   ├── asyncHandler.js
│       │   ├── cloudinary.js
│       │   ├── sendEmail.js         # ← NEW
│       │   ├── videoProcessing.js   # ← NEW (FFmpeg)
│       │   └── trending.js          # ← NEW
│       ├── socket/
│       │   └── index.js             # ← NEW (Socket.IO)
│       ├── db/index.js
│       ├── app.js                   # + helmet, rate limiting, error handler
│       └── index.js                 # + HTTP server, Socket.IO, trending cron
│
└── Frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx     # ← NEW
        ├── pages/
        │   ├── Home/, Auth/, VideoPlayer/, Upload/
        │   ├── Channel/, History/, LikedVideos/
        │   ├── Playlists/, Tweets/, Subscriptions/
        │   └── Settings/
        ├── components/
        │   ├── Layout/ (Header, Sidebar)
        │   └── VideoCard/
        ├── api/axios.js
        ├── App.jsx                  # + SocketProvider
        └── index.css
```

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally or Atlas)
- [Cloudinary Account](https://cloudinary.com/) (for media storage)

### 1. Clone the Repository
```bash
git clone <repository_url>
cd vidTube
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017
CROS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

---

## 📬 API Routes Overview

### Authentication (`/api/v1/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login |
| POST | `/logout` | ✅ | Logout |
| POST | `/refresh-token` | ❌ | Refresh access token |
| POST | `/change-password` | ✅ | Change password |
| GET | `/current-user` | ✅ | Get logged-in user |
| POST | `/forgot-password` | ❌ | Request password reset |
| POST | `/reset-password/:token` | ❌ | Reset with token |
| POST | `/send-verification-email` | ✅ | Send verification email |
| GET | `/verify-email/:token` | ❌ | Verify email |

### Videos (`/api/v1/video`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Get all videos (paginated) |
| POST | `/` | ✅ | Upload video |
| GET | `/trending` | ❌ | Get trending videos |
| POST | `/refresh-trending` | ✅👑 | Refresh trending scores (admin) |
| GET | `/:videoId` | ✅ | Get video by ID |
| PATCH | `/:videoId` | ✅ | Update video |
| DELETE | `/:videoId` | ✅ | Delete video |

### Search (`/api/v1/search`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/?q=query` | ❌ | Search videos/channels |
| GET | `/suggestions?q=query` | ❌ | Get autocomplete suggestions |
| GET | `/trending` | ❌ | Get trending search keywords |

### Watch Progress (`/api/v1/watch-progress`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/continue-watching` | ✅ | Get continue watching list |
| GET | `/:videoId` | ✅ | Get progress for a video |
| POST | `/:videoId` | ✅ | Save watch progress |

### Analytics (`/api/v1/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/channel` | ✅ | Get channel analytics |
| GET | `/video/:videoId` | ✅ | Get video analytics |

### Other Routes
- `/api/v1/comment` — Comments CRUD
- `/api/v1/likes` — Toggle likes
- `/api/v1/tweets` — Tweets CRUD
- `/api/v1/subscriptions` — Subscribe/unsubscribe
- `/api/v1/playlists` — Playlist management
- `/api/v1/dashboard` — Channel dashboard
- `/api/v1/notifications` — Notification management
- `/api/v1/health` — Health check

---

## 👨‍💻 Author
**Chayan Bez**

---

📝 *License: ISC*
