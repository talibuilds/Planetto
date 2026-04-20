import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import FocusScreen from '../screens/FocusScreen';
import StatsScreen from '../screens/StatsScreen';
import RoomsScreen from '../screens/RoomsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainApp = () => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#111421' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: isDarkMode ? 0.2 : 0.05,
          shadowRadius: 20,
          height: 85,
          paddingBottom: 25,
          paddingTop: 15,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        tabBarLabelStyle: {
          ...FONTS.subtitle,
          fontSize: 9,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'th-large';
          else if (route.name === 'Tasks') iconName = 'check-circle';
          else if (route.name === 'Focus') iconName = 'stopwatch';
          else if (route.name === 'Rooms') iconName = 'user-friends';
          else if (route.name === 'Me') iconName = 'user-alt';

          return (
            <View style={{ padding: 6, alignItems: 'center', justifyContent: 'center' }}>
              {focused ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                  <LinearGradient
                    colors={[(colors.primary + '33'), 'transparent']}
                    style={{ position: 'absolute', width: 50, height: 50, borderRadius: 25, top: -5 }}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                  <FontAwesome5 name={iconName} size={22} color={colors.primary} />
                </View>
              ) : (
                <FontAwesome5 name={iconName} size={22} color={colors.textMuted} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Me" component={StatsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainApp" component={MainApp} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
