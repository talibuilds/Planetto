import React, { memo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const AppContent = memo(() => {
  const { isDarkMode } = useTheme();
  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} translucent />
      <AppNavigator />
    </>
  );
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
