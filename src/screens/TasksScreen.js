import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { useData } from '../context/DataContext';

// Helper date functions
const getIsoDate = (d) => d.toISOString().split('T')[0];
const getDayName = (d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
const getDateNum = (d) => d.getDate();
const getMonthShort = (d) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];

const today = new Date();

// Generate 30 future dates (today + next 29 days) — scrollable forward only
const buildDatesList = () => {
  return Array.from({ length: 30 }, (_, offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return {
      iso: getIsoDate(d),
      dayName: getDayName(d),
      dateNum: getDateNum(d),
      monthShort: getMonthShort(d),
      isToday: offset === 0,
    };
  });
};

// Generate deadline options for next 30 days (future only)
const buildDeadlineOptions = () => {
  return Array.from({ length: 30 }, (_, offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const iso = getIsoDate(d);
    let label = '';
    if (offset === 0) label = `Today (${getMonthShort(d)} ${getDateNum(d)})`;
    else if (offset === 1) label = `Tomorrow (${getMonthShort(d)} ${getDateNum(d)})`;
    else label = `${getDayName(d)}, ${getMonthShort(d)} ${getDateNum(d)}`;
    return { label, value: iso };
  });
};

const datesList = buildDatesList();
const deadlineOptions = buildDeadlineOptions();

const TasksScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { tasks, addTask, toggleTaskCompletion, deleteTask, toggleFocusQueue, stats, formatFocusTime } = useData();
  const focusQueueTasks = tasks.filter(t => t.inFocusQueue);
  const SESSION_GOAL = focusQueueTasks.reduce((acc, t) => acc + (t.sessionsRequired || 2), 0) || 4;
  const [selectedDate, setSelectedDate] = useState(getIsoDate(today));
  const dateScrollRef = useRef(null);

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isDeadlineDropdownOpen, setDeadlineDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MED');
  const [newTaskDeadline, setNewTaskDeadline] = useState(getIsoDate(today));

  const priorityOptions = ['LOW', 'MED', 'HIGH'];

  const selectedTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const taskDate = t.dueDate.split('T')[0];
    
    // If we are looking at 'Today', show all pending tasks that are overdue as well
    if (selectedDate === getIsoDate(today)) {
      if (taskDate < selectedDate && !t.isCompleted) return true; // Overdue and pending
      return taskDate === selectedDate; // Or exactly today
    }
    
    return taskDate === selectedDate;
  });
  const activeTasks = selectedTasks.filter(t => !t.isCompleted);
  const finishedTasks = selectedTasks.filter(t => t.isCompleted);
  
  const totalDateTasks = selectedTasks.length;
  const completedDateTasks = finishedTasks.length;

  // VELOCITY = focus sessions completed today vs daily session goal
  // This measures HOW FAST you are working (pace/intensity)
  const realVelocity = Math.round((stats.sessionsToday / SESSION_GOAL) * 100);
  const ringCircumference = 345;
  const calculatedDashOffset = ringCircumference - (ringCircumference * (Math.min(realVelocity, 100) / 100));
  // NOTE: Daily Orbit (on Dashboard) = completedTasks / totalTasks — measures WHAT you've done (breadth)
  // Velocity (here) = sessions / session goal — measures HOW MUCH you've focused (depth/intensity)



  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a mission title.');
      return;
    }
    
    const finalPriority = newTaskPriority || 'MED';
    const finalDate = newTaskDeadline || getIsoDate(today);
    const finalColor = finalPriority === 'HIGH' ? colors.danger : finalPriority === 'LOW' ? colors.primary : colors.secondary;

    const newTask = {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || '',
      subject: newTaskSubject.trim() || 'General',
      priority: finalPriority,
      dueDate: finalDate,
    };
    
    addTask(newTask);
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskSubject('');
    setNewTaskPriority('MED');
    setNewTaskDeadline(getIsoDate(today));
    setDeadlineDropdownOpen(false);
    setPriorityDropdownOpen(false);
    setAddModalVisible(false);

    // Jump calendar to the selected deadline date
    setSelectedDate(finalDate);
    const idx = datesList.findIndex(d => d.iso === finalDate);
    if (idx >= 0 && dateScrollRef.current) {
      setTimeout(() => dateScrollRef.current?.scrollTo({ x: idx * 70, animated: true }), 200);
    }
  };

  const openAddModal = () => {
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskSubject('');
    setNewTaskPriority('MED');
    setNewTaskDeadline(selectedDate);
    setDeadlineDropdownOpen(false);
    setPriorityDropdownOpen(false);
    setAddModalVisible(true);
  };

  const renderTaskCard = (t, fading = false) => {
    const pColor = t.priority === 'HIGH' ? colors.danger : t.priority === 'LOW' ? colors.primary : colors.secondary;
    return (
    <GlassCard key={t.id} style={[styles.taskCard, fading && { opacity: 0.6 }, { borderLeftColor: pColor, borderLeftWidth: 3 }]} padding={15}>
      <View style={styles.taskCardInner}>
        <TouchableOpacity 
          style={[styles.checkSquare, { borderColor: colors.textMuted }, t.isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }]} 
          onPress={() => toggleTaskCompletion(t.id)}
        >
          {t.isCompleted && <FontAwesome5 name="check" size={10} color={isDarkMode ? colors.surface : '#FFFFFF'} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[FONTS.h3, { fontSize: 15, color: colors.text }, t.isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{t.title}</Text>
          <Text style={[FONTS.body2, { marginTop: 4, marginBottom: 12, lineHeight: 18, color: colors.textSecondary }]}>{t.description || 'No description'}</Text>
          <View style={styles.taskMetaRow}>
            <FontAwesome5 name="bookmark" color={colors.textMuted} size={10} />
            <Text style={[styles.taskMetaText, { color: colors.textMuted, marginRight: 10 }]}>{t.subject}</Text>
            <FontAwesome5 name="calendar-alt" color={colors.textMuted} size={10} />
            <Text style={[styles.taskMetaText, { color: colors.textMuted }]}>{t.dueDate ? t.dueDate.split('T')[0] : 'No date'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          {!t.isCompleted && (
            <View style={[styles.priorityBadge, { backgroundColor: `${t.priority === 'HIGH' ? colors.danger : t.priority === 'LOW' ? colors.primary : colors.secondary}20` }]}>
              <Text style={[styles.priorityBadgeText, { color: t.priority === 'HIGH' ? colors.danger : t.priority === 'LOW' ? colors.primary : colors.secondary }]}>{t.priority}</Text>
            </View>
          )}
          {!t.isCompleted && (
            <TouchableOpacity onPress={() => toggleFocusQueue(t.id)} style={styles.deleteBtn}>
              <FontAwesome5 name="stopwatch" size={14} color={t.inFocusQueue ? colors.primary : colors.textMuted} solid={t.inFocusQueue} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => {
            Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTask(t.id) },
            ]);
          }} style={styles.deleteBtn}>
            <FontAwesome5 name="trash-alt" size={12} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header rightAction={
          <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
            <FontAwesome5 name="history" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        } />

        <View style={styles.introSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>ACADEMIC JOURNEY</Text>
          <Text style={[FONTS.h1, { fontSize: 24, marginVertical: 5, color: colors.text }]}>Daily Trajectory</Text>
        </View>

        {/* Horizontal Scrollable Date Strip — future only */}
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.calendarStripScroll}
          contentContainerStyle={styles.calendarStripContent}
        >
          {datesList.map((dt, index) => {
            const isSelected = selectedDate === dt.iso;
            return (
              <TouchableOpacity
                key={dt.iso}
                onPress={() => setSelectedDate(dt.iso)}
                style={[
                  styles.dateItem,
                  { backgroundColor: colors.surfaceLight },
                  isSelected && { backgroundColor: colors.primary },
                  dt.isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary },
                ]}
              >
                <Text style={[FONTS.subtitle, { fontSize: 9, color: isSelected ? '#FFF' : colors.textMuted }]}>{dt.dayName}</Text>
                <Text style={[FONTS.h2, { marginTop: 4, fontSize: 18, color: isSelected ? '#FFF' : colors.text }]}>{dt.dateNum}</Text>
                <Text style={[FONTS.subtitle, { fontSize: 8, marginTop: 2, color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>{dt.monthShort}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <GlassCard style={{ alignItems: 'center', marginBottom: 30, paddingVertical: 30 }}>
          <View style={styles.velocityRing}>
             <Svg width="140" height="140" viewBox="0 0 140 140">
              <Circle cx="70" cy="70" r="55" stroke={colors.surfaceBorder} strokeWidth="8" fill="none" />
              <Circle 
                cx="70" cy="70" r="55" 
                stroke={colors.primary} 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="345"
                strokeDashoffset={calculatedDashOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </Svg>
            <View style={styles.velocityCenter}>
              <Text style={[FONTS.h1, { fontSize: 32, color: colors.text }]}>{realVelocity}%</Text>
              <Text style={[FONTS.subtitle, { fontSize: 8, marginTop: 2, color: colors.textSecondary }]}>VELOCITY</Text>
            </View>
          </View>
          <Text style={[FONTS.h3, { marginTop: 20, color: colors.text }]}>Focus Velocity</Text>
          <Text style={[FONTS.body2, { textAlign: 'center', marginTop: 5, paddingHorizontal: 20, color: colors.textSecondary }]}>
            {stats.sessionsToday}/{SESSION_GOAL} sessions done today
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', paddingTop: 15 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[FONTS.h3, { color: colors.primary }]}>{stats.sessionsToday}</Text>
              <Text style={[FONTS.subtitle, { fontSize: 9, color: colors.textMuted, marginTop: 3 }]}>SESSIONS</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[FONTS.h3, { color: colors.primary }]}>{formatFocusTime(stats.focusTimeToday)}</Text>
              <Text style={[FONTS.subtitle, { fontSize: 9, color: colors.textMuted, marginTop: 3 }]}>FOCUS TIME</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[FONTS.h3, { color: colors.primary }]}>{stats.focusQuality}%</Text>
              <Text style={[FONTS.subtitle, { fontSize: 9, color: colors.textMuted, marginTop: 3 }]}>QUALITY</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHeaderRow}>
          <Text style={[FONTS.h2, { fontSize: 20, color: colors.text }]}>Assignments</Text>
          <View style={[styles.pendingPill, { backgroundColor: `${colors.primary}1A` }]}>
             <Text style={[styles.pendingText, { color: colors.primary }]}>{activeTasks.length} Pending</Text>
          </View>
        </View>

        {activeTasks.length === 0 && (
          <Text style={[FONTS.body2, { textAlign: 'center', marginVertical: 20, color: colors.textSecondary }]}>No assignments for this date.</Text>
        )}
        {activeTasks.map(t => renderTaskCard(t))}

        {finishedTasks.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[FONTS.h2, { fontSize: 20, color: colors.textMuted }]}>Finished Assignments</Text>
            </View>
            {finishedTasks.map(t => renderTaskCard(t, true))}
          </View>
        )}

        <View style={{height: 120}} /> 
      </ScrollView>

      <TouchableOpacity style={[styles.fabBtn, { shadowColor: colors.primary }]} onPress={openAddModal}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.fabGradient}>
          <FontAwesome5 name="plus" size={20} color={"#FFF"} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={isAddModalVisible} transparent animationType="slide">
        <View style={[styles.modalBg, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.92)' : 'rgba(0,0,0,0.5)' }]}>
          <ScrollView contentContainerStyle={{ padding: 20, justifyContent: 'center', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[FONTS.h2, { color: colors.text }]}>Assign New Target</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <FontAwesome5 name="times" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>MISSION TITLE</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]} 
                placeholder="e.g. Astrophysics Essay" 
                placeholderTextColor={colors.textMuted}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />

              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>SUBJECT</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]} 
                placeholder="e.g. Physics" 
                placeholderTextColor={colors.textMuted}
                value={newTaskSubject}
                onChangeText={setNewTaskSubject}
              />

              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>DETAILS</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text, marginBottom: 15 }]} 
                placeholder="e.g. Write 500 words on dark matter." 
                placeholderTextColor={colors.textMuted}
                multiline
                value={newTaskDesc}
                onChangeText={setNewTaskDesc}
              />

              {/* Dropdowns Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, zIndex: 20 }}>
                
                {/* Deadline Dropdown */}
                <View style={{ flex: 1, marginRight: 10, zIndex: 20 }}>
                  <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>DEADLINE DATE</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.primary }]} 
                    onPress={() => { setDeadlineDropdownOpen(!isDeadlineDropdownOpen); setPriorityDropdownOpen(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[FONTS.body2, { color: newTaskDeadline ? colors.text : colors.textMuted, fontSize: 11 }]} numberOfLines={1}>
                        {newTaskDeadline ? deadlineOptions.find(o => o.value === newTaskDeadline)?.label : 'Set Date...'}
                      </Text>
                    </View>
                    <FontAwesome5 name={isDeadlineDropdownOpen ? 'chevron-up' : 'chevron-down'} size={10} color={colors.primary} />
                  </TouchableOpacity>

                  {isDeadlineDropdownOpen && (
                    <View style={[styles.dropdownList, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder, maxHeight: 200 }]}>
                      <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled>
                        {deadlineOptions.map((opt, i) => (
                          <TouchableOpacity key={i} style={[styles.dropdownItem, { borderBottomColor: colors.surfaceBorder }]} onPress={() => { setNewTaskDeadline(opt.value); setDeadlineDropdownOpen(false); }}>
                            <Text style={[FONTS.body2, { color: colors.text, fontSize: 12 }]}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Priority Dropdown */}
                <View style={{ flex: 0.7, marginLeft: 10, zIndex: 19 }}>
                  <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>PRIORITY</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]} 
                    onPress={() => { setPriorityDropdownOpen(!isPriorityDropdownOpen); setDeadlineDropdownOpen(false); }}
                  >
                    <Text style={[FONTS.body2, { color: 
                      newTaskPriority === 'HIGH' ? colors.danger : 
                      newTaskPriority === 'LOW' ? colors.primary : colors.secondary 
                    }]}>{newTaskPriority}</Text>
                    <FontAwesome5 name={isPriorityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={10} color={colors.textMuted} />
                  </TouchableOpacity>

                  {isPriorityDropdownOpen && (
                    <View style={[styles.dropdownList, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                      {priorityOptions.map((opt, i) => (
                        <TouchableOpacity key={i} style={[styles.dropdownItem, { borderBottomColor: colors.surfaceBorder }]} onPress={() => { setNewTaskPriority(opt); setPriorityDropdownOpen(false); }}>
                          <Text style={[FONTS.body2, { color: 
                            opt === 'HIGH' ? colors.danger : 
                            opt === 'LOW' ? colors.primary : colors.secondary 
                          }]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setAddModalVisible(false)}>
                  <Text style={[styles.modalBtnCancelTxt, { color: colors.textMuted }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: colors.primary }]} onPress={handleAddTask}>
                   <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>ADD TASK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={isHistoryModalVisible} transparent animationType="fade" onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={[styles.modalBg, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { height: '80%', padding: 0, backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: colors.surfaceBorder }}>
               <Text style={[FONTS.h2, { color: colors.text }]}>Mission History</Text>
               <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                 <FontAwesome5 name="times" size={20} color={colors.textMuted} />
               </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {tasks.filter(t => t.isCompleted).length === 0 && (
                 <Text style={[FONTS.body2, { textAlign: 'center', marginTop: 30, color: colors.textSecondary }]}>No missions accomplished yet.</Text>
              )}
              {tasks.filter(t => t.isCompleted).map(t => (
                <View key={t.id} style={{ marginBottom: 20 }}>
                  <Text style={[FONTS.body2, { color: colors.primary, marginBottom: 5 }]}>{t.dueDate ? t.dueDate.split('T')[0] : 'No date'}</Text>
                  {renderTaskCard(t, true)}
                </View>
              ))}
              <View style={{height: 40}} /> 
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding },
  introSection: { marginBottom: 20 },
  calendarStripScroll: { marginBottom: 25 },
  calendarStripContent: { paddingRight: 10, gap: 10 },
  dateItem: { width: 60, height: 82, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 2 },
  velocityRing: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  velocityCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pendingPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 15 },
  pendingText: { ...FONTS.subtitle, fontSize: 9 },
  taskCard: { marginBottom: 15 },
  taskCardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  checkSquare: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, marginRight: 15, marginTop: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center' },
  taskMetaText: { ...FONTS.body2, fontSize: 10, marginLeft: 6 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 6 },
  priorityBadgeText: { ...FONTS.subtitle, fontSize: 8 },
  deleteBtn: { padding: 4 },
  fabBtn: { position: 'absolute', bottom: 110, right: 25, width: 64, height: 64, borderRadius: 32, elevation: 15, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 15 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1 },
  modalContent: { borderRadius: 24, padding: 25, borderWidth: 1 },
  modalLabel: { marginBottom: 8, fontSize: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, ...FONTS.body1, marginBottom: 20 },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 13 },
  dropdownList: { position: 'absolute', top: 62, left: 0, right: 0, borderWidth: 1, borderRadius: 12, overflow: 'hidden', zIndex: 30 },
  dropdownItem: { padding: 12, borderBottomWidth: 1 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20, marginRight: 10 },
  modalBtnCancelTxt: { ...FONTS.subtitle, fontSize: 12 },
  modalBtnSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalBtnSaveTxt: { ...FONTS.subtitle, fontSize: 12 }
});

export default TasksScreen;
