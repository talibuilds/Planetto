import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const GlassCard = ({ children, style, colors: gradientColors, padding = 20 }) => {
  const { colors, isDarkMode } = useTheme();

  if (gradientColors) {
    return (
      <LinearGradient 
        colors={gradientColors} 
        style={[styles.card, { padding, borderColor: colors.surfaceBorder }, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.card, 
      { 
        padding, 
        backgroundColor: colors.surface, 
        borderColor: colors.surfaceBorder,
        shadowOpacity: isDarkMode ? 0.3 : 0.08
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
});

export default GlassCard;
