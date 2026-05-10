# Planetto

Planetto is a sleek, highly-polished React Native mobile application built with Expo. It is designed for modern task management, deep focus sessions, class scheduling, and elegant productivity tracking. The app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum focus.

## Key Features & Modules

- **Smart Dashboard:** Activity overview, Smart Flow Optimization, and profile management.
- **Focus Mode:** Customizable timers, automated task completion, and ambient sounds.
- **Task Management:** Infinite scroll date selection, swipe actions, and robust data synchronization.
- **My Classes:** Schedule management with dynamic extra classes and event tracking.
- **Rooms & Organization:** Organize tasks into custom workspaces using glassmorphic cards.
- **Global Statistics:** Productivity trend visualization and goal tracking.
- **Premium UI/UX:** Zero-flicker dark/light transitions, custom avatars, and optimized renders.

## Tech Stack

- **Framework:** React Native & Expo
- **Navigation:** React Navigation (bottom-tabs, native-stack)
- **UI Elements:** expo-linear-gradient, react-native-svg, vector icons
- **State Management:** React Context API & Advanced Hooks

## Directory Architecture

```text
src/
 ├── components/           # Reusable UI widgets
 │   ├── AvatarInitials.js # Dynamic avatar generator
 │   ├── GlassCard.js      # Premium glassmorphic container
 │   └── Header.js         # Global app header with actions
 ├── constants/            # Global configurations & tokens
 │   └── theme.js          # Design system & color palettes
 ├── context/              # React Context providers
 │   ├── DataContext.js    # Task & schedule synchronization
 │   └── ThemeContext.js   # Dynamic dark/light mode engine
 ├── navigation/           # React Navigation definitions
 │   └── AppNavigator.js   # Stack & Tab routing logic
 └── screens/              # Core application views
     ├── DashboardScreen.js # Smart Flow home overview
     ├── FocusScreen.js     # Timer & ambient sound logic
     ├── LoginScreen.js     # App entry point
     ├── MyClassesScreen.js # Advanced schedule management
     ├── RoomsScreen.js     # Workspace organization
     ├── StatsScreen.js     # Global analytics visualizer
     └── TasksScreen.js     # Infinite scroll date selector & todos
```

## Installation & Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run start
   ```

3. **Run on a target device:**
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Recent Implementations

- **Zero-Flicker Architecture:** Resolved UI mounting flashes with refined StatusBar handling.
- **Timetable Dynamics:** Built "My Classes" view supporting dynamic custom sessions.
- **Focus Linkage:** Seamlessly complete tasks straight from the focus timer conclusion.

## Notes

- The app is defined as **private** in `package.json`.
- Entry point is `index.js`, and `App.js` loads the main navigation structure.
- Expo configuration is managed in `app.json`.

## Recommended Improvements

- Implement persistent cloud storage for cross-device sync.
- Add robust offline-first synchronization.
- Expand user analytics and export functionalities.
