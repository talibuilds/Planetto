# Planetto

Planetto is a sleek, highly-polished React Native mobile application built with Expo and backed by a robust Node.js/Express backend. Designed for modern task management, deep focus sessions, class scheduling, and elegant productivity tracking. The app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum focus.

## 🚀 Latest Features

- **Google Authentication:** Secure and seamless Google sign-in integration across Web, iOS, and Android.
- **Smart Dashboard & Tasks:** Activity overview, Smart Flow Optimization, infinite scroll date selector, swipe actions, and robust data synchronization.
- **Focus Mode:** Customizable timers, automated task completion linkage, and ambient sounds.
- **My Classes & Rooms:** Dynamic extra class scheduling, attendance tracking, and glassmorphic workspace organization.
- **Global Statistics:** Productivity trend visualization and goal tracking.
- **Premium UI/UX:** Zero-flicker dark/light transitions, custom avatars, and optimized renders.
- **Native Android Enhancements:** Configured for React Native New Architecture compatibility with explicit JDK/NDK environment configurations.

## 🏗️ System Architecture

The project is structured into a modern full-stack mobile application, connecting an Expo React Native frontend to a TypeScript Express backend using PostgreSQL.

```mermaid
graph TD
    subgraph Frontend ["Frontend (React Native / Expo)"]
        UI["UI Components & Screens"]
        Ctx["React Context API (State)"]
        Nav["React Navigation"]
        Client["API Client / Axios"]
    end

    subgraph Backend ["Backend (Node.js + Express / TypeScript)"]
        Routes["API Routes"]
        Controllers["Controllers"]
        Services["Business Logic (Services)"]
        Prisma["Prisma ORM"]
    end

    subgraph Database ["Database"]
        DB[("PostgreSQL Database")]
    end

    UI --> Nav
    UI --> Ctx
    Ctx --> Client
    Client -->|REST API| Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> DB
```

## 🗄️ Database ER Diagram (Planetto)

Below is the Entity-Relationship (ER) diagram representing the actual database schema for Planetto, driven by Prisma and PostgreSQL. It outlines the core relationships between Users, Rooms, Tasks, and Scheduling.

```mermaid
erDiagram
    User ||--o{ Schedule : "has"
    User ||--o{ Task : "has"
    User ||--o{ FocusSession : "has"
    User ||--o{ LoginRecord : "has"
    User ||--o{ Room : "admin of"
    User ||--o{ RoomMember : "is member"
    User ||--o{ RoomMessage : "sends"
    User ||--o{ RoomTask : "creates/assigned"
    User ||--o{ RoomPomodoroSession : "starts"
    User ||--o{ RoomSessionParticipant : "participates in"
    User ||--o{ Notification : "receives"
    User ||--o{ RoomResource : "uploads"
    User ||--o{ RoomCheckIn : "checks in"

    Room ||--o{ RoomMember : "has members"
    Room ||--o{ RoomMessage : "has messages"
    Room ||--o{ RoomTask : "has tasks"
    Room ||--o{ RoomPomodoroSession : "has sessions"
    Room ||--o{ RoomResource : "has resources"
    Room ||--o{ RoomCheckIn : "has check-ins"

    RoomPomodoroSession ||--o{ RoomSessionParticipant : "has participants"
    RoomMessage ||--o{ RoomMessage : "replies to (parent)"

    User {
        string id PK
        string email
        string name
        boolean isAdmin
    }
    Schedule {
        string id PK
        string dayOfWeek
        string startTime
        string endTime
        string subject
        string type
    }
    Task {
        string id PK
        string title
        string subject
        string priority
        boolean isCompleted
    }
    FocusSession {
        string id PK
        int duration
        int quality
    }
    Room {
        string id PK
        string name
        string type
        string inviteCode
        int maxMembers
    }
    RoomMember {
        string id PK
        string role
    }
    RoomMessage {
        string id PK
        string content
        string type
    }
    RoomTask {
        string id PK
        string title
        string status
    }
    RoomPomodoroSession {
        string id PK
        int durationMinutes
        boolean isActive
    }
    Notification {
        string id PK
        string title
        string type
        boolean isRead
    }
    RoomResource {
        string id PK
        string title
        string type
        string url
    }
    RoomCheckIn {
        string id PK
        string date
    }
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native & Expo
- **Navigation:** React Navigation
- **State Management:** React Context API
- **UI Elements:** expo-linear-gradient, react-native-svg, vector icons

### Backend
- **Runtime & Framework:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL, Prisma
- **Authentication:** Google OAuth 2.0 / JWT
- **Architecture:** Controller-Service-Route Pattern

## 🚀 Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```
2. **Setup environment variables:**
   Configure `.env` for the backend with PostgreSQL connection strings and Google Client IDs.
3. **Run database migrations:**
   ```bash
   cd backend && npx prisma migrate dev
   ```
4. **Start the backend server:**
   ```bash
   npm run dev
   ```
5. **Start the Expo frontend:**
   ```bash
   cd .. && npm run start
   ```
   *(Use `npx expo run:android` or `npx expo run:ios` for native builds)*
