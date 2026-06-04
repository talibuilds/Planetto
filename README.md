# Planetto

Planetto is a sleek, highly-polished full-stack React Native mobile application designed for modern task management, deep focus sessions, AI-powered class scheduling, and collaborative coworking spaces. 

Built with Expo on the frontend and Node.js/PostgreSQL on the backend, the app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum productivity.

## System Architecture

The project is structured into a modern full-stack mobile application, connecting an Expo React Native frontend to a TypeScript Express backend using PostgreSQL.

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

## Key Features & Modules

- **AI Timetable Scanner:** Upload a photo of your college timetable, and our backend uses Google's `gemini-2.5-flash-lite` vision-to-text model to instantly parse, structure, and save your classes.
- **Smart Dashboard:** Activity overview, day streak tracking, and Smart Flow Optimization.
- **Focus Mode:** Customizable Pomodoro timers, automated task completion, ambient sounds, and a global "Block Notifications" toggle for deep work.
- **Collaborative Rooms (Coworking):** Join study groups or classroom pods. Chat in real-time, share resources, start group Pomodoro sessions, and track room streaks.
- **In-App Notifications:** Real-time push-style notifications and a global navbar inbox for tasks, group invites, and session completions.
- **Task Management:** Infinite scroll date selection, swipe actions, priority flagging, and robust data synchronization.
- **Premium UI/UX:** Zero-flicker dark/light transitions, custom avatars, glassmorphic design, and optimized animated renders.

---

## Entity Relationship (ER) Model

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
