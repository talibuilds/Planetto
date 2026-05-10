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
import { useData } from '../context/DataContext';

const DashboardScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { stats, tasks } = useData();

  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3); // show up to 3 upcoming
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const orbitVelocity = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const orbitDashOffset = 345 - (345 * (Math.min(orbitVelocity, 100) / 100));
  const pendingCount = totalTasks - completedTasks;

  const priorityTask = tasks.find(t => t.priority === 'HIGH' && !t.completed) || tasks.find(t => !t.completed);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.greetingSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>ACADEMIC COMMAND CENTER</Text>
          <Text style={[styles.greetingText, { color: colors.text }]}>Good morning,{'\n'}<Text style={{color: colors.primary}}>Talib.</Text></Text>
        </View>

        {/* My Classes Quick Access */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('MyClasses')} style={{marginBottom: 20}}>
          <GlassCard colors={isDarkMode ? ['rgba(24,255,255,0.1)', 'rgba(24,255,255,0.02)'] : ['#FFFFFF', '#F8F9FA']} style={{flexDirection: 'row', alignItems: 'center', padding: 20, borderColor: isDarkMode ? colors.primary + '55' : '#E0E0E0', borderWidth: 1}}>
            <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary + '33', justifyContent: 'center', alignItems: 'center', marginRight: 15}}>
              <FontAwesome5 name="calendar-alt" size={24} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[FONTS.h2, { color: colors.text, marginBottom: 4 }]}>My Classes</Text>
              <Text style={[FONTS.body2, { color: colors.textSecondary, fontSize: 12 }]}>View today's timetable & attendance</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={colors.primary} />
          </GlassCard>
        </TouchableOpacity>

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
                strokeDashoffset={orbitDashOffset}
                strokeLinecap="round"
                rotation="-90"
                origin="70, 70"
              />
            </Svg>
            <View style={styles.orbitTextContainer}>
              <Text style={[styles.orbitPercentage, { color: colors.text }]}>{orbitVelocity}%</Text>
              <Text style={[styles.orbitLabel, { color: colors.text }]}>COMPLETE</Text>
            </View>
          </View>
          <Text style={[styles.orbitSubText, { color: colors.textSecondary }]}>
            {pendingCount === 0 ? "You've crushed all your tasks!" : `You're ${pendingCount} tasks away from\nyour daily goal.`}
          </Text>
        </GlassCard>

        {/* Priority Mission */}
        <GlassCard colors={colors.gradientPrimary} style={styles.priorityCard}>
          <View style={styles.priorityHeaderRow}>
            <FontAwesome5 name="bolt" color={'#FFFFFF'} size={12} />
            <Text style={[FONTS.subtitle, { color: '#FFFFFF', marginLeft: 6 }]}>PRIORITY MISSION</Text>
          </View>
          <Text style={[styles.missionTitle, { fontSize: priorityTask ? 26 : 32 }]}>
            {priorityTask ? priorityTask.title : 'All Clear!'}
          </Text>
          
          {priorityTask && (
            <TouchableOpacity activeOpacity={0.8} style={[styles.missionBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('Focus')}>
              <Text style={[styles.missionBtnText, { color: colors.text }]}>Start Focus Session</Text>
            </TouchableOpacity>
          )}
          
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
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.focusTimeToday}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time Today</Text>
          </GlassCard>
          
          <GlassCard style={[styles.statBox, {marginLeft: 10, padding: 15}]}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="fire" color={colors.primary} size={12} />
            </View>
            <Text style={[styles.statNewHigh, { color: colors.textSecondary }]}>Quality: {stats.focusQuality}%</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.dayStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </GlassCard>
        </View>

        {/* Upcoming Deadlines */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[FONTS.h3, { color: colors.text }]}>Upcoming Deadlines</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.viewAllBtn, { color: colors.textMuted }]}>View All &gt;</Text>
          </TouchableOpacity>
        </View>

        {pendingTasks.length === 0 && (
          <Text style={[FONTS.body2, { textAlign: 'center', marginVertical: 10, color: colors.textSecondary }]}>All caught up!</Text>
        )}

        {pendingTasks.map(t => (
          <TouchableOpacity activeOpacity={0.8} key={t.id} onPress={() => navigation.navigate('Tasks')}>
            <GlassCard style={styles.taskItem} padding={15}>
              <View style={[styles.taskIndicator, {backgroundColor: t.pColor || colors.primary}]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>Subject: {t.subject || 'General'} • Due: {t.date}</Text>
              </View>
              <FontAwesome5 name="chevron-right" color={colors.textMuted} size={12} />
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Smart Flow Optimization */}
        {isDarkMode ? (
          <LinearGradient colors={['rgba(11,14,23,1)', 'rgba(24,255,255,0.05)']} style={[styles.smartFlowCard, { borderColor: 'rgba(24,255,255,0.1)', marginTop: 15 }]}>
            <View style={styles.smartFlowHeader}>
              <FontAwesome5 name="brain" color={colors.primary} size={16} />
              <Text style={[FONTS.h3, { color: colors.primary, marginLeft: 10 }]}>Smart Flow Optimization</Text>
            </View>
            <Text style={[FONTS.body2, { lineHeight: 18, marginBottom: 20, color: colors.text }]}>We noticed your most productive hours are actually around 8:00 AM. Consider moving dense reading to morning.</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
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
              activeOpacity={0.8}
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
