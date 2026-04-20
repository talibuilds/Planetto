export const darkTheme = {
  background: '#0B0E17',
  surface: '#151928',
  surfaceLight: '#1C2136',
  surfaceBorder: 'rgba(255,255,255,0.05)',
  
  primary: '#18FFFF',
  secondary: '#6E48F2',
  accent: '#A480FF',
  
  danger: '#FF4D4D',
  success: '#14F195',
  warning: '#FFD700',
  
  text: '#FFFFFF',
  textSecondary: '#8B94A6',
  textMuted: '#5C6378',
  textInvert: '#000000',
  
  white: '#FFFFFF',
  black: '#000000',
  
  gradientPrimary: ['#6E48F2', '#18FFFF'], 
  gradientRoom: ['rgba(0,0,0,0)', 'rgba(11,14,23,1)'],
};

export const lightTheme = {
  background: '#F8FAFC', // Clean light gray
  surface: '#FFFFFF', // Clean white
  surfaceLight: '#F1F5F9',
  surfaceBorder: 'rgba(0,0,0,0.08)',
  
  primary: '#0EA5E9', // Light blue (better contrast on light)
  secondary: '#6366F1', // Indigo
  accent: '#8B5CF6',
  
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInvert: '#FFFFFF',
  
  white: '#FFFFFF',
  black: '#000000',
  
  gradientPrimary: ['#6366F1', '#0EA5E9'], 
  gradientRoom: ['rgba(255,255,255,0)', 'rgba(248,250,252,1)'],
};

// Fallback for any leftover static imports safely pointing to dark mode
export const COLORS = darkTheme;

export const SIZES = {
  radius: 16,
  radiusLg: 24,
  radiusSm: 8,
  padding: 20,
  margin: 20,
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' },
  body1: { fontSize: 15, fontWeight: '500' },
  body2: { fontSize: 13, fontWeight: '400' },
  subtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
};
