import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DashboardScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { stats, tasks, toggleTaskCompletion, addTask } = useData();
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // To-Dos are tasks without a due date
  const todoTasks = useMemo(() => tasks.filter(t => !t.dueDate), [tasks]);

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;
    addTask({
      title: newTodoTitle.trim(),
      description: '',
      subject: 'To-Do',
      priority: 'MED',
      dueDate: null, // explicit no due date
    });
    setNewTodoTitle('');
  };

  const assignments = useMemo(() => tasks.filter(t => t.dueDate), [tasks]);

  const pendingTasks = assignments.filter(t => !t.isCompleted).slice(0, 3);
  
  const totalTasks = assignments.length;
  const completedTasks = assignments.filter(t => t.isCompleted).length;
  const orbitVelocity = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const orbitDashOffset = 345 - (345 * (Math.min(orbitVelocity, 100) / 100));
  const pendingCount = totalTasks - completedTasks;

  const priorityTask = assignments.find(t => t.priority === 'HIGH' && !t.isCompleted) || assignments.find(t => !t.isCompleted);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.greetingSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>ACADEMIC COMMAND CENTER</Text>
          <Text style={[styles.greetingText, { color: colors.text }]}>Good morning,{'\n'}<Text style={{color: colors.primary}}>{user?.name ? user.name.split(' ')[0] : 'Explorer'}.</Text></Text>
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
                transform="rotate(-90 70 70)"
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
              <View style={[styles.taskIndicator, {backgroundColor: t.priority === 'HIGH' ? '#F44336' : colors.primary}]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>Subject: {t.subject || 'General'} • Due: {t.dueDate ? t.dueDate.split('T')[0] : ''}</Text>
              </View>
              <FontAwesome5 name="chevron-right" color={colors.textMuted} size={12} />
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Today's To-Do */}
        <View style={[styles.sectionHeaderRow, { marginTop: 15 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="clipboard-check" color={colors.primary} size={16} />
            <Text style={[FONTS.h3, { color: colors.text, marginLeft: 8 }]}>Daily To-Do</Text>
          </View>
          <Text style={[styles.viewAllBtn, { color: colors.textMuted }]}>
            {todoTasks.filter(t => t.isCompleted).length}/{todoTasks.length} done
          </Text>
        </View>

        <GlassCard style={{ paddingVertical: 8, paddingHorizontal: 15, marginBottom: 20 }}>
          {todoTasks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <FontAwesome5 name="check-double" size={20} color={colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[FONTS.body2, { color: colors.textSecondary, textAlign: 'center' }]}>No to-dos yet.{"\n"}Add one below.</Text>
            </View>
          ) : (
            todoTasks.map((t, idx) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.7}
                onPress={() => toggleTaskCompletion(t.id)}
                style={[styles.todoRow, idx < todoTasks.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}
              >
                <View style={[styles.todoCheckbox, t.isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {t.isCompleted && <FontAwesome5 name="check" size={9} color="#FFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.todoTitle, { color: colors.text }, t.isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted }]} numberOfLines={1}>{t.title}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          
          {/* Add To-Do Input */}
          <View style={[styles.todoRow, { borderTopWidth: todoTasks.length > 0 ? 1 : 0, borderTopColor: colors.surfaceBorder, paddingVertical: 10, marginTop: todoTasks.length > 0 ? 5 : 0 }]}>
            <View style={[styles.todoCheckbox, { borderColor: 'transparent', backgroundColor: 'transparent' }]}>
              <FontAwesome5 name="plus" size={10} color={colors.textMuted} />
            </View>
            <TextInput
              style={{ flex: 1, ...FONTS.body2, color: colors.text, fontSize: 14 }}
              placeholder="Add a new to-do..."
              placeholderTextColor={colors.textMuted}
              value={newTodoTitle}
              onChangeText={setNewTodoTitle}
              onSubmitEditing={handleAddTodo}
              returnKeyType="done"
            />
          </View>
        </GlassCard>

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

  todoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 5 },
  todoCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  todoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  todoMeta: { fontSize: 11 },
  todoPriorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
});

export default DashboardScreen;
