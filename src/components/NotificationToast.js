import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../constants/theme';

export default function NotificationToast() {
  const { latestNotification } = useData();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(-150)).current;

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (latestNotification) {
      // Slide in
      Animated.spring(translateY, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  if (!latestNotification) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={hideToast}
        style={[
          styles.toast, 
          { 
            backgroundColor: isDarkMode ? '#222838' : '#FFFFFF',
            borderColor: colors.surfaceBorder,
            shadowColor: colors.primary,
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${latestNotification.color}22` }]}>
          <FontAwesome5 name={latestNotification.icon || 'bell'} size={18} color={latestNotification.color} solid />
        </View>
        <View style={styles.textContainer}>
          <Text style={[FONTS.h3, { color: colors.text }]} numberOfLines={1}>
            {latestNotification.title}
          </Text>
          <Text style={[FONTS.body2, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]} numberOfLines={2}>
            {latestNotification.body}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
});
