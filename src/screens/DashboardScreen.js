import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const DashboardScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.greetingSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>ACADEMIC COMMAND CENTER</Text>
          <Text style={[styles.greetingText, { color: colors.text }]}>Good morning,{'\n'}<Text style={{color: colors.primary}}>Alex.</Text></Text>
        </View>

        <GlassCard style={styles.orbitCard}>
          <Text style={[styles.cardTitleCent, { color: colors.text }]}>Daily Orbit</Text>
          <View style={styles.orbitContainer}>
            <Svg width="140" height="140" viewBox="0 0 140 140">
              <Circle cx="70" cy="70" r="55" stroke={colors.surfaceBorder} strokeWidth="12" fill="none" />
              <Circle 
                cx="70" cy="70" r="55" 
                stroke={colors.primary} 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray="345"
                strokeDashoffset="86"
                strokeLinecap="round"
                rotation="-90"
                origin="70, 70"
              />
            </Svg>
            <View style={styles.orbitTextContainer}>
              <Text style={[styles.orbitPercentage, { color: colors.text }]}>75%</Text>
              <Text style={[styles.orbitLabel, { color: colors.text }]}>COMPLETE</Text>
            </View>
          </View>
          <Text style={[styles.orbitSubText, { color: colors.textSecondary }]}>You're 2 tasks away from{'\n'}your daily goal.</Text>
        </GlassCard>

        {/* Priority Mission */}
        <GlassCard colors={colors.gradientPrimary} style={styles.priorityCard}>
          <View style={styles.priorityHeaderRow}>
            <FontAwesome5 name="bolt" color={'#FFFFFF'} size={12} />
            <Text style={[FONTS.subtitle, { color: '#FFFFFF', marginLeft: 6 }]}>PRIORITY MISSION</Text>
          </View>
          <Text style={styles.missionTitle}>Quantum{'\n'}Mechanics Final{'\n'}Review</Text>
          
          <TouchableOpacity style={[styles.missionBtn, { backgroundColor: isDarkMode ? colors.primary : '#FFFFFF' }]} onPress={() => navigation.navigate('Focus')}>
            <Text style={[styles.missionBtnText, { color: isDarkMode ? colors.background : colors.primary }]}>Start Focus Session</Text>
          </TouchableOpacity>
          
          <View style={styles.estimatedRow}>
            <FontAwesome5 name="clock" color="rgba(255,255,255,0.7)" size={10} />
            <Text style={styles.estimatedText}>45m Estimated</Text>
          </View>
        </GlassCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statBox, {marginRight: 10, padding: 15}]}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="clock" color={colors.text} size={12} />
            </View>
            <Text style={[styles.statTrend, { color: colors.primary }]}>+12%</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>6.4h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time Today</Text>
          </GlassCard>
          
          <GlassCard style={[styles.statBox, {marginLeft: 10, padding: 15}]}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="fire" color={colors.primary} size={12} />
            </View>
            <Text style={[styles.statNewHigh, { color: colors.textSecondary }]}>New High</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>14</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </GlassCard>
        </View>

        {/* Upcoming Trajectory */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[FONTS.h3, { color: colors.text }]}>Upcoming Trajectory</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.viewAllBtn, { color: colors.textMuted }]}>View All &gt;</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
          <GlassCard style={styles.taskItem} padding={15}>
            <View style={[styles.taskIndicator, {backgroundColor: colors.primary}]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>Research Paper: Neural Networks</Text>
              <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>Due in 4 hours • Academic Hub</Text>
            </View>
            <View style={styles.taskUsers}>
               <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={[styles.smallAvatar, { borderColor: colors.surface }]} />
               <View style={[styles.extraUsers, { backgroundColor: colors.surfaceLight, borderColor: colors.surface }]}><Text style={[styles.extraUsersText, { color: colors.text }]}>+2</Text></View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
          <GlassCard style={styles.taskItem} padding={15}>
            <View style={[styles.taskIndicator, {backgroundColor: colors.accent}]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>Advanced Algorithms Lecture</Text>
              <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>Tomorrow, 10:00 AM • Room 4B2</Text>
            </View>
            <FontAwesome5 name="ellipsis-v" color={colors.textMuted} size={14} />
          </GlassCard>
        </TouchableOpacity>

        {/* Smart Flow Optimization */}
        {isDarkMode ? (
          <LinearGradient colors={['rgba(11,14,23,1)', 'rgba(24,255,255,0.05)']} style={[styles.smartFlowCard, { borderColor: 'rgba(24,255,255,0.1)', marginTop: 15 }]}>
            <View style={styles.smartFlowHeader}>
              <FontAwesome5 name="brain" color={colors.primary} size={16} />
              <Text style={[FONTS.h3, { color: colors.primary, marginLeft: 10 }]}>Smart Flow Optimization</Text>
            </View>
            <Text style={[FONTS.body2, { lineHeight: 18, marginBottom: 20, color: colors.text }]}>We noticed your most productive hours are actually around 8:00 AM. Consider moving dense reading to morning.</Text>
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}
              onPress={() => navigation.navigate('Focus')}
            >
              <Text style={{ color: colors.surface, fontWeight: '700', fontSize: 12 }}>OPTIMIZE SCHEDULE</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <View style={[styles.smartFlowCard, { backgroundColor: colors.surface, borderColor: `${colors.primary}33`, marginTop: 15 }]}>
            <View style={styles.smartFlowHeader}>
              <FontAwesome5 name="brain" color={colors.primary} size={16} />
              <Text style={[FONTS.h3, { color: colors.primary, marginLeft: 10 }]}>Smart Flow Optimization</Text>
            </View>
            <Text style={[FONTS.body2, { lineHeight: 18, marginBottom: 20, color: colors.text }]}>We noticed your most productive hours are actually around 8:00 AM. Consider moving dense reading to morning.</Text>
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}
              onPress={() => navigation.navigate('Focus')}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>OPTIMIZE SCHEDULE</Text>
            </TouchableOpacity>
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
  greetingSection: { marginVertical: 20 },
  greetingText: { ...FONTS.h1, fontSize: 32, lineHeight: 38, marginTop: 5 },
  
  cardTitleCent: { ...FONTS.h3, textAlign: 'center', marginBottom: 15 },
  orbitCard: { marginBottom: 20, alignItems: 'center' },
  orbitContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  orbitTextContainer: { position: 'absolute', alignItems: 'center' },
  orbitPercentage: { ...FONTS.h1, fontSize: 36 },
  orbitLabel: { ...FONTS.subtitle, fontSize: 9 },
  orbitSubText: { ...FONTS.body2, textAlign: 'center', marginTop: 15, lineHeight: 18 },

  priorityCard: { marginBottom: 20 },
  priorityHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  missionTitle: { ...FONTS.h1, color: '#FFFFFF', fontSize: 26, lineHeight: 30, marginBottom: 20 },
  missionBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'flex-start', marginBottom: 20 },
  missionBtnText: { fontWeight: '700', fontSize: 13 },
  estimatedRow: { flexDirection: 'row', alignItems: 'center' },
  estimatedText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 6 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { flex: 1 },
  statIconBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statTrend: { position: 'absolute', top: 15, right: 15, ...FONTS.subtitle, fontSize: 9 },
  statNewHigh: { position: 'absolute', top: 15, right: 15, ...FONTS.body2, fontSize: 9 },
  statValue: { ...FONTS.h1, fontSize: 32, marginBottom: 5 },
  statLabel: { ...FONTS.body2, fontSize: 11 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  viewAllBtn: { fontSize: 12, fontWeight: '600' },
  
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  taskIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 15 },
  taskContent: { flex: 1 },
  taskTitle: { ...FONTS.h3, fontSize: 14, marginBottom: 4 },
  taskMeta: { ...FONTS.body2, fontSize: 11 },
  taskUsers: { flexDirection: 'row', alignItems: 'center' },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1 },
  extraUsers: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: -8, borderWidth: 1 },
  extraUsersText: { fontSize: 10, fontWeight: '700' },

  smartFlowCard: { borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1 },
  smartFlowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
});

export default DashboardScreen;
