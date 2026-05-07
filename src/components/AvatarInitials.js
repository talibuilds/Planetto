import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FONTS } from '../constants/theme';

/**
 * AvatarInitials — Shows an image if `imgUrl` is provided, 
 * otherwise falls back to a circle with the first two initials of `name`.
 */
const AvatarInitials = ({ name = '', imgUrl = null, size = 44, fontSize = 14, bgColor = '#2D5A3C', textColor = '#FFFFFF', style = {} }) => {
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  if (imgUrl) {
    return (
      <Image
        source={{ uri: imgUrl }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        style,
      ]}
    >
      <Text style={[FONTS.h3, { fontSize, color: textColor }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AvatarInitials;
