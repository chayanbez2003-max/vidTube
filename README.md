# vidTube 🎥

vidTube is a full-stack, comprehensive video-sharing platform clone built using the MERN stack (MongoDB, Express.js, React, Node.js). It features a robust backend for handling video uploads, user authentication, engaging social features like comments and tweets, and a modern, responsive frontend layout.

## 🚀 Features

### Backend
- **User Authentication:** Secure login and signup functionalities using JWT and `bcrypt` for password hashing.
- **Video Management:** Secure video and image uploads using integration with **Cloudinary** and **Multer**.
- **Social Features:** Built-in routes and controllers for Handling Likes, Comments, Tweets, and Subscriptions.
- **Playlists:** Allows users to create and manage custom video playlists.
- **Dashboards & Notifications:** Routes integrated for handling user dashboards and notifications.
- **Pagination:** Uses `mongoose-aggregate-paginate-v2` for efficient list rendering and API response.
- **Security & Utilities:** Implements `cors` and `cookie-parser` for secure API transactions across the frontend.

### Frontend
- **Modern UI/UX:** Built with **React 19** and **Vite** for incredibly fast build times and a snappy user experience.
- **Animations:** Engaging UI interactions powered by **Framer Motion**.
- **Video Playback:** Reliable and cross-compatible video play mechanics handled by **React Player**.
- **State Management & Routing:** Handled effectively via `react-router-dom`.
- **API Requests:** Managed effortlessly through `axios` configurations.
- **Alerts & Toast:** Seamless user feedback rendered with `react-hot-toast`.

## 🛠️ Tech Stack

### Frontend
- React JS
- Vite
- Framer Motion
- React Router DOM
- Axios
- React Player & React Icons

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Cloudinary
- Multer
- JSON Web Token (JWT)
- bcrypt

## 📦 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the Repository
```bash
git clone <repository_url>
cd vidTube
```

### 2. Backend Setup
```bash
# Navigate to the Backend folder
cd Backend

# Install dependencies
npm install

# Create a .env file and add essential variables like PORT, MONGO_URI, CLOUDINARY credentials, JWT_SECRET, etc.
# Start the Backend Development Server
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal instance and navigate to the Frontend folder
cd Frontend

# Install dependencies
npm install

# Start the Frontend Development Server
npm run dev
```

## 📬 API Routes Overview (Backend /api/v1/)
- `/users` - User registration, login, profile updates.
- `/video` - Video uploads, edits, deletion, fetched feeds.
- `/comment` - Add/Delete/Edit video comments.
- `/likes` - Like videos, comments, and tweets.
- `/tweets` - Create, view, delete user tweets.
- `/subscriptions` - Subscribe or unsubscribe to channels.
- `/playlists` - Create and populate video playlists.
- `/dashboard` - Overview user specific channels analytics and details.
- `/notifications` - Handle dynamic app notifications.
- `/health` - Instance health-check endpoints.

## 👨‍💻 Author
**Chayan Bez**

---
📝 *License: ISC*
