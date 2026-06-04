# Planetto

Planetto is a sleek, highly-polished full-stack React Native mobile application designed for modern task management, deep focus sessions, AI-powered class scheduling, and collaborative coworking spaces. 

Built with Expo on the frontend and Node.js/PostgreSQL on the backend, the app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum productivity.

## Key Features & Modules

- **AI Timetable Scanner:** Upload a photo of your college timetable, and our backend uses Google's `gemini-2.5-flash-lite` vision-to-text model to instantly parse, structure, and save your classes.
- **Smart Dashboard:** Activity overview, day streak tracking, and Smart Flow Optimization.
- **Focus Mode:** Customizable Pomodoro timers, automated task completion, ambient sounds, and a global "Block Notifications" toggle for deep work.
- **Collaborative Rooms (Coworking):** Join study groups or classroom pods. Chat in real-time, share resources, start group Pomodoro sessions, and track room streaks.
- **In-App Notifications:** Real-time push-style notifications and a global navbar inbox for tasks, group invites, and session completions.
- **Task Management:** Infinite scroll date selection, swipe actions, priority flagging, and robust data synchronization.
- **Global Statistics:** Productivity trend visualization, focus quality tracking, and session velocity analysis.
- **Premium UI/UX:** Zero-flicker dark/light transitions, custom avatars, glassmorphic design, and optimized animated renders.

---

## Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native & Expo
- **Navigation:** React Navigation (Bottom Tabs, Native Stack)
- **UI & Animations:** `expo-linear-gradient`, `react-native-svg`, React Native `Animated` API
- **State & Data:** React Context API, Axios, AsyncStorage
- **Auth:** Google Sign-In (`@react-native-google-signin/google-signin`)

### Backend (API Server)
- **Framework:** Node.js with Express.js (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI Integration:** `@google/generative-ai` (Gemini API)

---

## Entity Relationship (ER) Model

Our backend Prisma schema is highly relational, designed to support both individual productivity and group collaboration.

### Core Entities
- **User:** The central entity. Has a unique Google ID, email, profile image, and admin flags.
- **Task:** A user's personal to-do items. Tracks priority, completion status, due dates, and required Pomodoro sessions.
- **FocusSession:** Logs individual focus periods, tracking duration in seconds, pauses, and self-rated quality (1-100).
- **Schedule:** Individual classes parsed by AI, containing subject, teacher, room, type (Theory/Lab), and times.
- **LoginRecord:** Tracks daily logins for calculating user streaks.
- **Notification:** Centralized inbox for system events, task assignments, and room alerts.

### Collaborative Entities (Rooms)
- **Room:** A collaborative workspace (Study Group, Project Room, Classroom) with invite codes, max member caps, and streak tracking.
- **RoomMember:** Junction table mapping Users to Rooms, defining roles (Admin, Member).
- **RoomMessage:** Chat history within a room. Supports text, images, files, and threading/replies.
- **RoomTask:** Shared tasks within a room that can be assigned to specific members.
- **RoomPomodoroSession:** Group study sessions started by a user, allowing others to join synchronously.
- **RoomSessionParticipant:** Junction table tracking which users joined a group Pomodoro.
- **RoomResource:** Shared links, PDFs, or files uploaded to a specific room.
- **RoomCheckIn:** Daily accountability check-ins logged by members.

---

## Directory Architecture

```text
Planetto/
 ├── App.js                # Mobile entry point
 ├── src/                  # Frontend Source
 │   ├── api/              # Axios API clients & interceptors
 │   ├── components/       # Reusable UI widgets (GlassCard, Header, NotificationToast)
 │   ├── constants/        # Global configurations & theme tokens
 │   ├── context/          # React Context (Auth, Data, Theme)
 │   ├── navigation/       # React Navigation stacks & tabs
 │   └── screens/          # Core views (Focus, Rooms, Timetable, Dashboard)
 │
 └── backend/              # Node.js Express API
     ├── prisma/           # PostgreSQL Schema & Migrations
     ├── src/
     │   ├── controllers/  # Route handlers (Auth, Tasks, Rooms, AI)
     │   ├── middleware/   # JWT Auth & Error handlers
     │   ├── routes/       # Express Router definitions
     │   └── services/     # Business logic & Gemini AI integration
```

---

## Installation & Local Development

### 1. Database Setup
Ensure you have a running PostgreSQL instance. Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/planetto"
GEMINI_API_KEY="your_google_gemini_key"
```

### 2. Start the Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Start the Mobile App
In a new terminal window:
```bash
cd Planetto # (root directory)
npm install
npm run android # Or npm run ios / npm run start
```

## Recent Implementations

- **AI OCR Migration:** Upgraded the AI timetable parser from `gemini-1.5-flash` to the significantly faster `gemini-2.5-flash-lite`, dropping processing time from 90s to ~1.2s.
- **Global Toast Notifications:** Added an animated dropdown notification system that respects the global "Block Notifications" focus toggle.
- **Zombie Process Fix:** Hardened backend startup to prevent orphaned Node processes from hogging API ports.
