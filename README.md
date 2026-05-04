# 🚀 Smart Code Hub

A full-stack web application featuring an AI Code Assistant, Real-time Collaboration Dashboard, and Secure File Sharing System — built with modern technologies and production-ready architecture.

## ✨ Features

### 1. 🤖 AI Code Assistant
- **Generate Code**: Create code in 16+ languages (JavaScript, Python, Java, C++, VHDL, etc.)
- **Fix Code**: Automatically detect and fix syntax errors
- **Explain Code**: Get detailed line-by-line explanations
- **Run Code**: Execute and see output simulation
- **Monaco Editor**: VS Code-like editor with syntax highlighting
- **Dark Theme**: Beautiful glassmorphism UI

### 2. 👥 Live Collaboration Dashboard
- **No Login Required**: Join via room ID or link
- **Real-time Code Editing**: Sync changes instantly with Socket.IO
- **Whiteboard**: Draw shapes, lines, text with multiple tools
- **Live Chat**: Built-in messaging system
- **User Presence**: See who's online with colored avatars
- **Auto-cleanup**: Empty rooms deleted after 1 hour

### 3. 📁 Secure File Sharing
- **Drag & Drop Upload**: Simple file upload interface
- **OTP Protection**: 6-digit code for secure access
- **QR Code**: Scan to download instantly
- **Auto-destruct**: Files deleted after 24 hours
- **100MB Limit**: Support for large files
- **Anonymous**: No registration required

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Monaco Editor** (@monaco-editor/react)
- **Socket.IO Client** for real-time features
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Axios** for API calls
- **React Dropzone** for file uploads
- **QRCode.react** for QR generation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.IO** for WebSocket connections
- **OpenAI API** for AI features
- **Multer** for file uploads
- **QRCode** for QR generation
- **Twilio** for SMS OTP
- **Nodemailer** for Email OTP
- **JWT** for authentication
- **Helmet, CORS, Rate Limiting** for security

## 📁 Project Structure

```
smart-code-hub/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── models/
│   │   │   ├── File.js               # File schema
│   │   │   └── OTP.js                # OTP schema
│   │   ├── routes/
│   │   │   ├── codeRoutes.js         # AI code endpoints
│   │   │   ├── fileRoutes.js         # File sharing endpoints
│   │   │   └── authRoutes.js         # OTP authentication
│   │   ├── utils/
│   │   │   ├── socketHandler.js      # Socket.IO rooms
│   │   │   └── cleanup.js            # File cleanup cron
│   │   └── server.js                 # Entry point
│   ├── uploads/                      # File storage
│   ├── .env.example                  # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx            # Navigation
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Landing page
│   │   │   ├── CodeAIPage.jsx        # AI Assistant
│   │   │   ├── LiveSharePage.jsx     # Collaboration
│   │   │   └── FileSharePage.jsx     # File Sharing
│   │   ├── App.jsx                   # Router
│   │   ├── main.jsx                  # Entry
│   │   └── index.css                 # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key
- (Optional) Twilio account for SMS
- (Optional) Gmail for email OTP

### 1. Clone & Install

```bash
git clone <repository-url>
cd smart-code-hub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-code-hub
OPENAI_API_KEY=sk-your-key
JWT_SECRET=your-secret-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
MAX_FILE_SIZE=104857600
FILE_EXPIRY_HOURS=24
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 📡 API Endpoints

### Code AI
- `POST /api/code/generate` - Generate/fix/explain code
- `POST /api/code/run` - Run code simulation

### File Sharing
- `POST /api/files/upload` - Upload file (multipart)
- `GET /api/files/download/:otp` - Download file
- `GET /api/files/verify/:otp` - Verify OTP

### Authentication
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP & get JWT

### Health
- `GET /api/health` - Server status

## 🔌 Socket.IO Events

### Client → Server
- `join-room` - Join collaboration room
- `code-change` - Broadcast code changes
- `canvas-draw` - Send drawing data
- `canvas-clear` - Clear whiteboard
- `chat-message` - Send chat message

### Server → Client
- `room-state` - Initial room data
- `code-update` - Code changes from others
- `canvas-update` - Drawing from others
- `new-message` - New chat message
- `user-joined` / `user-left` - Presence updates

## 🐳 Docker Deployment

```dockerfile
# Dockerfile (backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./uploads:/app/uploads
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

## 🌐 Deployment (Render.com)

1. **Create Web Service**: Connect your GitHub repo
2. **Environment**: Node
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm start`
5. **Add Environment Variables** from `.env.example`
6. **Deploy Frontend**: Use Vercel/Netlify with `npm run build`

## 🔒 Security Features

- Helmet.js for HTTP headers
- Rate limiting (100 req/15min)
- CORS protection
- File size limits (100MB)
- Auto-expiring files (24h)
- OTP verification
- Input validation (express-validator)
- JWT authentication

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please fork the repo and submit a PR.

---

Built with ❤️ by the Smart Code Hub team.
