import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const SOUNDS = [
  { id: 'space', label: 'Deep Space', icon: 'rocket' },
  { id: 'rain', label: 'Soft Rain', icon: 'cloud-rain' },
  { id: 'cafe', label: 'Café Noise', icon: 'coffee' },
  { id: 'forest', label: 'Forest', icon: 'tree' },
  { id: 'waves', label: 'Ocean Waves', icon: 'tint' },
  { id: 'whitenoise', label: 'White Noise', icon: 'wind' },
];

const ATMOSPHERES = [
  { id: 'void', label: 'Andromeda Void', darkLabel: 'Cosmic Void', icon: 'star', bgDark: '#0B120E', bgLight: '#F8F9F5' },
  { id: 'study', label: 'Bright Study Room', darkLabel: 'Night Library', icon: 'book', bgDark: '#1E1B18', bgLight: '#FFF4E6' },
  { id: 'office', label: 'Morning Office', darkLabel: 'Dark Office', icon: 'building', bgDark: '#121C26', bgLight: '#E6F0FA' },
  { id: 'zen', label: 'Zen Garden', darkLabel: 'Zen Garden', icon: 'leaf', bgDark: '#0D2214', bgLight: '#E8F5E9' },
];

const FocusScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { tasks, stats, logFocusSession, toggleTaskCompletion, toggleFocusQueue } = useData();
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_DURATION);
  const [isNotificationsBlocked, setIsNotificationsBlocked] = useState(true);
  const [selectedSound, setSelectedSound] = useState(null);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState('void');
  const [pauses, setPauses] = useState(0);
  const [soundObject, setSoundObject] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef(null);

  const focusTasks = tasks.filter(t => t.inFocusQueue && !t.completed);

  // Audio Playback
  useEffect(() => {
    return () => {
      if (soundObject) soundObject.unloadAsync();
    };
  }, [soundObject]);

  const toggleSound = async (soundId) => {
    if (selectedSound === soundId) {
      if (soundObject) await soundObject.stopAsync();
      setSelectedSound(null);
    } else {
      if (soundObject) await soundObject.unloadAsync();
      // Dummy remote URL, in real app use require('./assets/sounds/rain.mp3')
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { shouldPlay: true, isLooping: true }
      );
      setSoundObject(sound);
      setSelectedSound(soundId);
    }
  };

  // Focus timer
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0 && !isOnBreak) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && !isOnBreak) {
      clearInterval(interval);
      setIsActive(false);
      logFocusSession(FOCUS_DURATION, pauses);
      setPauses(0);
      
      const currentTask = focusTasks.length > 0 ? focusTasks[0] : null;

      Alert.alert('🎉 Session Complete!', currentTask ? `Did you finish "${currentTask.title}"?` : 'Great work! Take a break?', [
        { 
          text: currentTask ? 'Yes, Mark Done' : 'Keep Going', 
          onPress: () => { 
            if (currentTask) toggleTaskCompletion(currentTask.id);
            setTimeLeft(FOCUS_DURATION); 
            setIsActive(true); 
          } 
        },
        { 
          text: currentTask ? 'No, Take Break' : 'Take a 5-min Break', 
          onPress: () => {
             startBreak();
          } 
        },
      ]);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isOnBreak, focusTasks]);

  // Break timer
  useEffect(() => {
    let interval = null;
    if (isOnBreak && breakTimeLeft > 0) {
      interval = setInterval(() => setBreakTimeLeft(t => t - 1), 1000);
    } else if (isOnBreak && breakTimeLeft === 0) {
      clearInterval(interval);
      setIsOnBreak(false);
      setBreakTimeLeft(BREAK_DURATION);
      setTimeLeft(FOCUS_DURATION);
      Alert.alert('Break Over!', 'Ready for another focus session?', [
        { text: 'Start Session', onPress: () => setIsActive(true) },
        { text: 'Not Yet', style: 'cancel' },
      ]);
    }
    return () => clearInterval(interval);
  }, [isOnBreak, breakTimeLeft]);

  // Pulse animation when active
  useEffect(() => {
    if (isActive) {
      pulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseAnimRef.current.start();
    } else {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
    };
  }, [isActive]);

  const startBreak = () => {
    setIsActive(false);
    setIsOnBreak(true);
    setBreakTimeLeft(BREAK_DURATION);
  };

  const endSession = () => {
    if (isActive || isOnBreak) {
      Alert.alert('End Session', 'Are you sure you want to end your current session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: () => { setIsActive(false); setIsOnBreak(false); setTimeLeft(FOCUS_DURATION); setBreakTimeLeft(BREAK_DURATION); } },
      ]);
    } else {
      setTimeLeft(FOCUS_DURATION);
      setBreakTimeLeft(BREAK_DURATION);
    }
  };

  const toggleTimer = () => {
    if (isOnBreak) {
      Alert.alert('On Break', 'You are currently on a break. End break early?', [
        { text: 'Keep Break', style: 'cancel' },
        { text: 'End Break', onPress: () => { setIsOnBreak(false); setBreakTimeLeft(BREAK_DURATION); } },
      ]);
      return;
    }
    if (isActive) {
      setPauses(p => p + 1); // penalize quality for pauses
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsOnBreak(false);
    setTimeLeft(FOCUS_DURATION);
    setBreakTimeLeft(BREAK_DURATION);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayTime = isOnBreak ? breakTimeLeft : timeLeft;
  const totalTime = isOnBreak ? BREAK_DURATION : FOCUS_DURATION;
  const progress = isOnBreak 
    ? (BREAK_DURATION - breakTimeLeft) / BREAK_DURATION 
    : (FOCUS_DURATION - timeLeft) / FOCUS_DURATION;
  const dashOffset = 880 - (progress * 880);

  const activeColor = isOnBreak ? colors.secondary : colors.primary;
  
  const currentAtmosphere = ATMOSPHERES.find(a => a.id === selectedAtmosphere);
  const dynamicBackground = isDarkMode ? currentAtmosphere.bgDark : currentAtmosphere.bgLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicBackground }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        {/* Timer Ring */}
        <View style={styles.timerSection}>
          <Animated.View style={[styles.ringWrapper, isActive && { transform: [{ scale: pulseAnim }] }]}>
            <Svg width="300" height="300" viewBox="0 0 300 300">
              <Circle cx="150" cy="150" r="140" stroke={colors.surfaceBorder} strokeWidth="4" fill="none" />
              <Circle 
                cx="150" cy="150" r="140" 
                stroke={activeColor} 
                strokeWidth="6" 
                fill="none" 
                strokeDasharray="880"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90"
                origin="150, 150"
              />
            </Svg>

            <View style={styles.timerAbsoluteCenter}>
              <Text style={[FONTS.subtitle, { letterSpacing: 2, color: isOnBreak ? colors.secondary : colors.textSecondary }]}>
                {isOnBreak ? 'BREAK TIME' : isActive ? 'DEEP FOCUS' : 'FOCUS READY'}
              </Text>
              <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(displayTime)}</Text>
              
              <View style={styles.controlsRow}>
                <TouchableOpacity style={[styles.playBtn, { backgroundColor: activeColor, shadowColor: activeColor }]} onPress={toggleTimer}>
                  <FontAwesome5 name={isActive ? "pause" : "play"} color={"#FFF"} size={20} solid />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.surfaceLight }]} onPress={resetTimer}>
                  <FontAwesome5 name="redo" color={colors.text} size={16} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.sessionsBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[FONTS.h3, { color: colors.primary }]}>{stats.sessionsToday.toString().padStart(2,'0')}/08</Text>
              <Text style={[FONTS.subtitle, { fontSize: 7, color: colors.textMuted, marginTop: 4 }]}>SESSIONS TODAY</Text>
            </View>
          </Animated.View>
        </View>

        {/* Sound Filters */}
        <Text style={[FONTS.subtitle, { color: colors.textMuted, textAlign: 'center', marginBottom: 12, fontSize: 10 }]}>AMBIENT SOUND</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }} contentContainerStyle={{ paddingHorizontal: 5, gap: 8 }}>
          {SOUNDS.map(sound => {
            const isSelected = selectedSound === sound.id;
            return (
              <TouchableOpacity 
                key={sound.id}
                style={[styles.soundBtn, { 
                  backgroundColor: isSelected ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                }]}
                onPress={() => toggleSound(sound.id)}
              >
                <FontAwesome5 name={sound.icon} color={isSelected ? '#FFF' : colors.textMuted} size={12} />
                <Text style={[styles.soundText, { color: isSelected ? '#FFF' : colors.textMuted }]}>{sound.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notification Blocker Toggle */}
        <GlassCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 }} padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isNotificationsBlocked ? `${colors.primary}33` : colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
              <FontAwesome5 name={isNotificationsBlocked ? "bell-slash" : "bell"} color={isNotificationsBlocked ? colors.primary : colors.textMuted} size={16} solid />
            </View>
            <View>
              <Text style={[FONTS.h3, { color: colors.text }]}>Block Notifications</Text>
              <Text style={[FONTS.body2, { color: colors.textSecondary, marginTop: 2, fontSize: 11 }]}>
                {isNotificationsBlocked ? 'All non-vital alerts silenced.' : 'Notifications are enabled.'}
              </Text>
            </View>
          </View>
          <Switch 
            value={isNotificationsBlocked} 
            onValueChange={setIsNotificationsBlocked}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor={'#FFF'}
          />
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isOnBreak ? `${colors.secondary}40` : colors.secondary, borderWidth: isOnBreak ? 2 : 0, borderColor: colors.secondary }]} 
            onPress={startBreak}
          >
            <FontAwesome5 name="coffee" color={'#FFF'} size={16} />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{isOnBreak ? 'On\nBreak' : 'Take a\nBreak'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={endSession}>
            <FontAwesome5 name="stop-circle" color={colors.textSecondary} size={16} />
            <Text style={[styles.actionBtnText, { marginLeft: 0, color: colors.text }]}>End{'\n'}Session</Text>
          </TouchableOpacity>
        </View>

        {/* Focus Queue */}
        <GlassCard style={styles.queueCard} padding={20}>
          <View style={styles.queueHeader}>
            <Text style={[FONTS.h2, { fontSize: 20, color: colors.text }]}>Focus Queue</Text>
            <Text style={[FONTS.subtitle, { fontSize: 10, color: colors.textSecondary }]}>{focusTasks.length} TASKS LEFT</Text>
          </View>
          
          {focusTasks.length === 0 && (
            <Text style={[FONTS.body2, { color: colors.textSecondary, textAlign: 'center', marginVertical: 10 }]}>No tasks in queue. Add them from Active Tasks.</Text>
          )}

          {focusTasks.map((item, i) => {
            const isActiveTask = i === 0;
            return (
            <View key={item.id} style={[styles.queueItem, i < focusTasks.length - 1 && { marginBottom: 15 }, isActiveTask && { backgroundColor: `${colors.primary}15`, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.primary }]}>
              <View style={[styles.queueIcon, { backgroundColor: `${item.pColor}20` }]}>
                <FontAwesome5 name={item.priority === 'HIGH' ? 'exclamation' : 'check'} color={item.pColor} size={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[FONTS.h3, { fontSize: 14, color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[FONTS.body2, { fontSize: 11, marginTop: 3, color: isActiveTask ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                  {isActiveTask ? "CURRENT TARGET" : item.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleFocusQueue(item.id)} style={{ padding: 8 }}>
                 <FontAwesome5 name="minus-circle" color={colors.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          )})}
        </GlassCard>

        {/* Atmosphere Selector */}
        {isDarkMode ? (
          <LinearGradient colors={['#17122B', '#0B0E17']} style={[styles.atmosphereCard, { borderColor: colors.surfaceBorder }]}>
            <Text style={[FONTS.h2, { fontSize: 20, color: colors.text, marginBottom: 5 }]}>Atmosphere</Text>
            <Text style={[FONTS.body2, { fontSize: 11, marginBottom: 20, color: colors.textSecondary }]}>
              Current: {ATMOSPHERES.find(a => a.id === selectedAtmosphere)?.darkLabel}
            </Text>
            <View style={styles.atmosphereGrid}>
              {ATMOSPHERES.map(atm => (
                <TouchableOpacity
                  key={atm.id}
                  style={[styles.atmosphereOption, { borderColor: selectedAtmosphere === atm.id ? colors.primary : colors.surfaceBorder, backgroundColor: selectedAtmosphere === atm.id ? `${colors.primary}22` : 'transparent' }]}
                  onPress={() => setSelectedAtmosphere(atm.id)}
                >
                  <FontAwesome5 name={atm.icon} color={selectedAtmosphere === atm.id ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[FONTS.subtitle, { fontSize: 9, marginTop: 6, color: selectedAtmosphere === atm.id ? colors.primary : colors.textMuted }]}>{atm.darkLabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.volumeRow}>
              <FontAwesome5 name="volume-down" color={colors.textMuted} size={12} />
              <View style={[styles.sliderBg, { backgroundColor: colors.surfaceBorder }]}>
                <View style={[styles.sliderFill, { backgroundColor: colors.primary }]} />
              </View>
              <FontAwesome5 name="volume-up" color={colors.primary} size={14} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.atmosphereCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[FONTS.h2, { fontSize: 20, color: colors.text, marginBottom: 5 }]}>Atmosphere</Text>
            <Text style={[FONTS.body2, { fontSize: 11, marginBottom: 20, color: colors.textSecondary }]}>
              Current: {ATMOSPHERES.find(a => a.id === selectedAtmosphere)?.label}
            </Text>
            <View style={styles.atmosphereGrid}>
              {ATMOSPHERES.map(atm => (
                <TouchableOpacity
                  key={atm.id}
                  style={[styles.atmosphereOption, { borderColor: selectedAtmosphere === atm.id ? colors.primary : colors.surfaceBorder, backgroundColor: selectedAtmosphere === atm.id ? `${colors.primary}15` : 'transparent' }]}
                  onPress={() => setSelectedAtmosphere(atm.id)}
                >
                  <FontAwesome5 name={atm.icon} color={selectedAtmosphere === atm.id ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[FONTS.subtitle, { fontSize: 9, marginTop: 6, color: selectedAtmosphere === atm.id ? colors.primary : colors.textMuted }]}>{atm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.volumeRow}>
              <FontAwesome5 name="volume-down" color={colors.textMuted} size={12} />
              <View style={[styles.sliderBg, { backgroundColor: colors.surfaceBorder }]}>
                <View style={[styles.sliderFill, { backgroundColor: colors.primary }]} />
              </View>
              <FontAwesome5 name="volume-up" color={colors.primary} size={14} />
            </View>
          </View>
        )}

        <View style={{height: 100}} /> 
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding },
  timerSection: { alignItems: 'center', marginVertical: 30 },
  ringWrapper: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
  timerAbsoluteCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 72, fontWeight: '800', marginVertical: 10, letterSpacing: -2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  playBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 15, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  resetBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sessionsBadge: { position: 'absolute', top: 30, right: -20, padding: 15, borderRadius: 16, borderWidth: 1 },
  soundBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25 },
  soundText: { ...FONTS.h3, fontSize: 12, marginLeft: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 24, gap: 10 },
  actionBtnText: { ...FONTS.h3, textAlign: 'center', fontSize: 13 },
  queueCard: { marginBottom: 20 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  queueItem: { flexDirection: 'row', alignItems: 'center' },
  queueIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, flexShrink: 0 },
  atmosphereCard: { borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1 },
  atmosphereGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  atmosphereOption: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderBg: { flex: 1, height: 4, borderRadius: 2 },
  sliderFill: { width: '70%', height: '100%', borderRadius: 2 },
});

export default FocusScreen;
