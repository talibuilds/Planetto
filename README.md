# Planetto 🪐

Planetto is a sleek, highly-polished React Native mobile application built with Expo. It is designed for modern task management, deep focus sessions, class scheduling, and elegant productivity tracking. The app features a premium user interface with dynamic animations, glassmorphic elements, and a tailored UX for maximum focus.

## 🚀 Key Features & Modules

### 1. 📊 Smart Dashboard
- Quick overview of daily activity, upcoming tasks, and progress.
- **Smart Flow Optimization:** Context-aware suggestions right on the home screen.
- Profile and feedback management via dynamic bottom sheets.

### 2. 🎯 Focus Mode
- Interactive timer with customizable sessions to boost productivity.
- **Automated Task Completion:** Seamlessly links focus sessions directly to pending tasks.
- Ambient sound toggles and animated pulse rings (`Animated.loop`) to keep you in the zone.

### 3. ✅ Advanced Task Management
- Intuitive **Tasks Screen** with a sleek, scrollable future-oriented date selection system.
- Robust state management keeping your todos perfectly synced across the app.
- Fluid swipe actions and data-driven status updates.

### 4. 📚 My Classes & Timetable Management
- Fully functional class schedule management.
- Dynamic **Extra Classes/Events** section via a polished Floating Action Button (FAB).
- Dynamic entry tracking with responsive layout adaptations.

### 5. 🚪 Rooms & Organization
- Organize tasks and workflows into custom spaces or projects.
- Glassmorphic card interfaces (`GlassCard`) providing an exceptional visual hierarchy.

### 6. 📈 Global Statistics
- Refined global statistics visualizer showing productivity trends.
- Tracks time spent in focus, completed tasks, and long-term goal adherence.

### 7. 🎨 Premium UI/UX Details
- **Theming & Animations:** Fully custom `ThemeContext` handling seamless dark/light transitions with zero flicker.
- Custom `AvatarInitials` generation and `Header` component.
- Smooth transitions and optimized state-driven re-renders avoiding visual artifacts.

## 🧩 Tech Stack

- **Framework:** React Native & Expo (`expo-cli`)
- **Navigation:** React Navigation (`bottom-tabs`, `native-stack`)
- **UI Elements:** `expo-linear-gradient`, `react-native-svg`, vector icons
- **State Management:** React Context API & Advanced Hooks

## 📁 Directory Architecture

```text
📦 src/
 ┣ 📂 components/          # Reusable UI widgets
 ┃ ┣ 📜 AvatarInitials.js  # Dynamic avatar generator
 ┃ ┣ 📜 GlassCard.js       # Premium glassmorphic container
 ┃ ┗ 📜 Header.js          # Global app header with actions
 ┣ 📂 constants/           # Global configurations & tokens
 ┃ ┗ 📜 theme.js           # Design system & color palettes
 ┣ 📂 context/             # React Context providers
 ┃ ┣ 📜 DataContext.js     # Task & schedule synchronization
 ┃ ┗ 📜 ThemeContext.js    # Dynamic dark/light mode engine
 ┣ 📂 navigation/          # React Navigation definitions
 ┃ ┗ 📜 AppNavigator.js    # Stack & Tab routing logic
 ┗ 📂 screens/             # Core application views
   ┣ 📜 DashboardScreen.js # Smart Flow home overview
   ┣ 📜 FocusScreen.js     # Timer & ambient sound logic
   ┣ 📜 LoginScreen.js     # App entry point
   ┣ 📜 MyClassesScreen.js # Advanced schedule management
   ┣ 📜 RoomsScreen.js     # Workspace organization
   ┣ 📜 StatsScreen.js     # Global analytics visualizer
   ┗ 📜 TasksScreen.js     # Infinite scroll date selector & todos
```

## ⚙️ Installation & Usage

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

## 🌟 Recent Implementations
- **Zero-Flicker Architecture:** Resolved standard UI mounting flashes with refined `StatusBar` handling and asynchronous mount checks.
- **Timetable Dynamics:** Built an extensive "My Classes" view supporting dynamic custom sessions.
- **Focus Linkage:** Users can now seamlessly complete tasks straight from the focus timer conclusion.

## 📌 Notes

- The app is defined as **private** in `package.json`.
- Entry point is `index.js`, and `App.js` loads the main navigation structure.
- Expo configuration is managed in `app.json`.

## 💡 Recommended Improvements

- Implement persistent cloud storage (e.g., Firebase, Supabase) for cross-device sync.
- Add robust offline-first synchronization.
- Expand user analytics and export functionalities in the `StatsScreen`.
