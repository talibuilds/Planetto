# Planetto

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)

Planetto is a sleek, highly-polished full-stack React Native mobile application designed for modern task management, deep focus sessions, AI-powered class scheduling, and collaborative coworking spaces. 

Built with Expo on the frontend and Node.js/PostgreSQL on the backend, the app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum productivity.

## 🌍 Live Demos & Downloads

- **📱 Android APK Download:** [Download Planetto App (EAS Build)](https://expo.dev/accounts/talibuilds/projects/Planetto/builds/d9c526cd-7eca-46df-9ef2-d1c188160616)
  *Install this APK directly on your Android device to test the full mobile experience including native Google Sign-in!*
- **🌐 Web Demo:** [planetto.vercel.app](https://planetto.vercel.app/)
  *The React Native Web version of the app, instantly accessible in your browser.*
- **⚙️ Backend API:** Hosted on Render (`planetto-backend.onrender.com`) connected to a Neon PostgreSQL Database.

## ✨ Key Features & Modules

- **AI Timetable Scanner:** Upload a photo of your college timetable, and our backend uses Google's `gemini-2.5-flash-lite` vision-to-text model to instantly parse, structure, and save your classes.
- **Smart Dashboard:** Activity overview, day streak tracking, and Smart Flow Optimization.
- **Focus Mode:** Customizable Pomodoro timers, automated task completion, ambient sounds, and a global "Block Notifications" toggle for deep work.
- **Collaborative Rooms (Coworking):** Join study groups or classroom pods. Chat in real-time, share resources, start group Pomodoro sessions, and track room streaks.
- **In-App Notifications:** Real-time push-style notifications and a global navbar inbox for tasks, group invites, and session completions.
- **Task Management:** Infinite scroll date selection, swipe actions, priority flagging, and robust data synchronization.
- **Premium UI/UX:** Zero-flicker dark/light transitions, custom avatars, glassmorphic design, and optimized animated renders.

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native & Expo
- **Navigation:** React Navigation (Bottom Tabs, Native Stack)
- **UI & Animations:** `expo-linear-gradient`, `react-native-svg`, React Native `Animated` API
- **State & Data Management:** React Context API, Axios, AsyncStorage
- **Auth:** Google Sign-In (`@react-native-google-signin/google-signin`)

### Backend (API Server)
- **Framework:** Node.js with Express.js (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI Integration:** `@google/generative-ai` (Gemini API)
- **Auth:** Custom JWT / Google OAuth verification

---

## 🏗️ System Architecture

The project connects an Expo React Native frontend to a TypeScript Express backend.

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React Native / Expo)"]
        UI["UI Components & Screens"]
        Context["React Context API (State)"]
        Nav["React Navigation"]
        Axios["API Client (Axios)"]
        
        UI --> Context
        UI --> Nav
        Context --> Axios
    end

    subgraph Backend ["Backend (Node.js + Express / TypeScript)"]
        Router["Express Routers"]
        Controllers["Controllers"]
        Services["Services (Business Logic)"]
        Prisma["Prisma ORM"]
        Gemini["Google Gemini AI API"]
        
        Router --> Controllers
        Controllers --> Services
        Services --> Prisma
        Services -.-> Gemini
    end

    DB[(PostgreSQL Database)]

    Axios -- "REST API (HTTP/JSON)" --> Router
    Prisma --> DB
```

---

## 🗄️ Entity Relationship (ER) Model

Our backend Prisma schema is highly relational, designed to support both individual productivity and group collaboration.

```mermaid
erDiagram
    User ||--o{ Task : "has"
    User ||--o{ FocusSession : "has"
    User ||--o{ Schedule : "has"
    User ||--o{ LoginRecord : "has"
    User ||--o{ Notification : "receives"
    User ||--o{ RoomMember : "is member of"
    User ||--o{ Room : "creates/admin"
    User ||--o{ RoomTask : "creates/assigned"
    User ||--o{ RoomPomodoroSession : "starts"
    User ||--o{ RoomSessionParticipant : "participates in"
    User ||--o{ RoomMessage : "sends"
    User ||--o{ RoomResource : "uploads"
    User ||--o{ RoomCheckIn : "checks in"
    
    Room ||--o{ RoomMember : "has members"
    Room ||--o{ RoomTask : "has tasks"
    Room ||--o{ RoomPomodoroSession : "has sessions"
    Room ||--o{ RoomMessage : "has messages"
    Room ||--o{ RoomResource : "has resources"
    Room ||--o{ RoomCheckIn : "has check-ins"
    
    RoomPomodoroSession ||--o{ RoomSessionParticipant : "has participants"
    RoomMessage ||--o| RoomMessage : "replies to (parent)"
    
    User {
        String id PK
        String email
        String name
        Boolean isAdmin
    }
    
    Task {
        String id PK
        String title
        String subject
        String priority
        Boolean isCompleted
    }
    
    FocusSession {
        String id PK
        Int duration
        Int quality
    }
    
    Schedule {
        String id PK
        String dayOfWeek
        String startTime
        String endTime
        String subject
        String type
    }
    
    Notification {
        String id PK
        String title
        String type
        Boolean isRead
    }
    
    Room {
        String id PK
        String name
        String type
        String inviteCode
        Int maxMembers
    }
    
    RoomMember {
        String id PK
        String role
    }
    
    RoomTask {
        String id PK
        String title
        String status
    }
    
    RoomPomodoroSession {
        String id PK
        Int durationMinutes
        Boolean isActive
    }
    
    RoomMessage {
        String id PK
        String content
        String type
    }
    
    RoomResource {
        String id PK
        String title
        String type
        String url
    }
    
    RoomCheckIn {
        String id PK
        String date
    }
```

---

## 🚀 Installation & Setup

Follow these detailed, step-by-step instructions to get the project running locally on your machine.

### Prerequisites
Before you begin, ensure you have the following installed:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via Docker)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Android Studio](https://developer.android.com/studio) (for Android Emulator) or Xcode (for iOS Simulator)

### 1. Clone the Repository
```bash
git clone https://github.com/talibuilds/Planetto.git
cd Planetto
```

### 2. Backend Setup
The backend requires a PostgreSQL database and a Gemini API Key.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```
3. Configure your environment variables. Create a `.env` file in the `backend/` directory:
   ```env
   # backend/.env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/planetto"
   GEMINI_API_KEY="your_google_gemini_key_here"
   ```
4. Generate the Prisma client and run database migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend should now be running on `http://localhost:5000`.*

### 3. Frontend (Mobile App) Setup
Open a new terminal window to start the mobile app.

1. Navigate to the root directory of the project:
   ```bash
   cd Planetto
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm run start
   # OR to directly compile and run on Android:
   npm run android
   ```
4. **Important for Android Emulators:** If your backend is running on `localhost:5000`, the Android emulator automatically forwards requests via `10.0.2.2`. The app's Axios client handles this dynamically.

---

## 📁 Directory Architecture

```text
Planetto/
 ├── App.js                # Mobile entry point
 ├── package.json          # Frontend dependencies
 ├── app.json              # Expo configuration
 ├── src/                  # Frontend Source
 │   ├── api/              # Axios API clients & interceptors
 │   ├── components/       # Reusable UI widgets (GlassCard, Header, NotificationToast)
 │   ├── constants/        # Global configurations & theme tokens
 │   ├── context/          # React Context (Auth, Data, Theme)
 │   ├── navigation/       # React Navigation stacks & tabs
 │   └── screens/          # Core views (Focus, Rooms, Timetable, Dashboard)
 │
 └── backend/              # Node.js Express API
     ├── package.json      # Backend dependencies
     ├── prisma/           # PostgreSQL Schema & Migrations
     ├── src/
     │   ├── index.ts      # Server entry point
     │   ├── controllers/  # Route handlers (Auth, Tasks, Rooms, AI)
     │   ├── middleware/   # JWT Auth & Error handlers
     │   ├── routes/       # Express Router definitions
     │   └── services/     # Business logic & Gemini AI integration
```

---

## 🤝 Contributing
Contributions are always welcome! If you'd like to improve the app:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors
- **Talib Khan**
- **Mayank Mehta**
- **Muzammil Zahoor**
- **Mohit Kumar**

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
