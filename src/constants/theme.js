export const darkTheme = {
  background: '#0B120E', // Very dark green/black
  surface: '#111A14',
  surfaceLight: '#1B2A20',
  surfaceBorder: 'rgba(255,255,255,0.06)',
  
  primary: '#4ADE80', // Bright pastel green
  secondary: '#A1A1AA',
  accent: '#86EFAC',
  
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInvert: '#000000',
  
  white: '#FFFFFF',
  black: '#000000',
  
  gradientPrimary: ['#2D5A3C', '#4ADE80'], 
  gradientRoom: ['rgba(0,0,0,0)', '#0B120E'],
};

export const lightTheme = {
  background: '#F8F9F5', // Off-white cream
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F0',
  surfaceBorder: 'rgba(0,0,0,0.06)',
  
  primary: '#2D5A3C', // Deep Forest Green
  secondary: '#758778',
  accent: '#D4E7C5', // Pastel Green
  
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  text: '#16221A', // Very dark green instead of pure black
  textSecondary: '#526156',
  textMuted: '#89968B',
  textInvert: '#FFFFFF',
  
  white: '#FFFFFF',
  black: '#000000',
  
  gradientPrimary: ['#355E3B', '#2D5A3C'], 
  gradientRoom: ['rgba(255,255,255,0)', '#F8F9F5'],
};

// Fallback for any leftover static imports safely pointing to dark mode
export const COLORS = darkTheme;

export const SIZES = {
  radius: 16,
  radiusLg: 24,
  radiusSm: 8,
  padding: 24,
  margin: 24,
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' },
  h4: { fontSize: 15, fontWeight: '700' },
  body1: { fontSize: 15, fontWeight: '500' },
  body2: { fontSize: 13, fontWeight: '500' },
  subtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase' },
};
