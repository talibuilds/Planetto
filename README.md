# Planetto

Planetto is a sleek React Native app built with Expo. It is designed for modern task management, focus sessions, room organization, analytics, and an elegant UI experience.

## 🚀 Project Overview

This app includes:

- **Dashboard** for a quick overview of activity and tasks
- **Focus mode** to support productivity and concentration
- **Tasks screen** for managing todos and workflow
- **Rooms screen** for organizing spaces or projects
- **Stats screen** to visualize progress and usage
- **Login flow** for a polished app entry experience

## 🧩 Tech Stack

- **Expo**
- **React Native**
- **React Navigation** (`bottom-tabs`, `native-stack`)
- **Expo Linear Gradient** for refined visuals
- **React Native SVG** and vector icons for polished UI

## 📁 Project Structure

```
App.js
index.js
app.json
package.json
assets/
src/
  components/
    GlassCard.js
    Header.js
  constants/
    theme.js
  context/
    ThemeContext.js
  navigation/
    AppNavigator.js
  screens/
    DashboardScreen.js
    FocusScreen.js
    LoginScreen.js
    RoomsScreen.js
    StatsScreen.js
    TasksScreen.js
```

## ⚙️ Installation

1. Install dependencies:

```bash
npm install
```

2. Start the Expo development server:

```bash
npm run start
```

3. Run on a target platform:

```bash
npm run android
npm run ios
npm run web
```

## 🌟 Features

- Clean Expo-powered setup
- Modern navigation with bottom tabs and stack flows
- Theming support via `ThemeContext`
- Reusable UI components like `GlassCard` and `Header`
- Responsive layout for mobile and web

## 📌 Notes

- The app is defined as **private** in `package.json`
- Entry point is `index.js`, and `App.js` loads the main navigation structure
- Expo configuration is managed in `app.json`

## 💡 Recommended Improvements

- Add screen-specific unit tests
- Implement persistent storage for tasks
- Add authentication and backend integration
- Expand analytics in the `StatsScreen`

## 📬 Contact

If you'd like to iterate on Planetto, this repo is a great starting point for building a polished productivity app with Expo and React Native.
