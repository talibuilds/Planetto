import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import GlassCard from '../components/GlassCard';

const INITIAL_SCHEDULE = {
  MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: []
};


const MyClassesScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [timetableData, setTimetableData] = useState(INITIAL_SCHEDULE);
  const [attendance, setAttendance] = useState({
    m1: 'Present', m2: 'Present', m3: 'Present', m4: 'Present', m5: 'Present',
    t1: 'Present', t2: 'Present', t3: 'Present', t4: 'Present',
    w1: 'Present', w2: 'Absent', w3: 'Absent',
    th1: 'Present', th2: 'Present', th3: 'Present', th4: 'Present', th5: 'Present',
    f1: 'Present', f2: 'Present', f3: 'Absent', f4: 'Present'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  const [extraClasses, setExtraClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ title: '', time: '', teacher: '', date: '', remark: '' });

  const handleAddExtraClass = () => {
    if (!newClassForm.title || !newClassForm.time) {
      Alert.alert('Missing Fields', 'Please enter at least Title and Time.');
      return;
    }
    setExtraClasses([...extraClasses, { id: 'ex' + Date.now(), ...newClassForm }]);
    setNewClassForm({ title: '', time: '', teacher: '', date: '', remark: '' });
    setShowAddClassModal(false);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchSchedules();
    }
  }, [user?.id]);

  const fetchSchedules = async () => {
    try {
      const res = await apiClient.get(`/schedules/${user.id}`);
      if (res.data.success) {
        const scheduleObj = { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [] };
        res.data.data.forEach(item => {
          if (scheduleObj[item.dayOfWeek]) {
            scheduleObj[item.dayOfWeek].push(item);
          }
        });
        
        // Sort each day's array by startTime
        Object.keys(scheduleObj).forEach(day => {
          scheduleObj[day].sort((a, b) => {
            const [ah, am] = a.startTime.split(':').map(Number);
            const [bh, bm] = b.startTime.split(':').map(Number);
            return (ah * 60 + am) - (bh * 60 + bm);
          });
        });
        
        setTimetableData(scheduleObj);
      }
    } catch (e) {
      console.error('Failed to fetch schedules', e);
    }
  };

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  let currentDay = days[new Date().getDay()];
  if (currentDay === 'SUN') currentDay = 'MON'; // Mock to MON for preview purposes on Sunday

  const todayClasses = timetableData[currentDay] || [];

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const handleUpload = () => {
    setIsProcessing(true);
    setShowPreview(false);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPreview(true);
    }, 2500);
  };

  const markAttendance = (id, status) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };


  const getSubjectStats = () => {
    const stats = {};
    const allClassArr = Object.values(timetableData).flat();
    const idToCode = {};
    allClassArr.forEach(c => {
      idToCode[c.id] = c.code;
    });

    let totalPresent = 0;
    let totalAbsent = 0;

    Object.keys(attendance).forEach(id => {
      const code = idToCode[id];
      if (!code) return;
      
      let isLab = code.includes('LAB');
      let baseCode = code.replace(' LAB', '').replace(' TUT', '');
      
      if (code === 'MAD LAB') {
        baseCode = 'MAD LAB';
        isLab = false;
      }
      
      if (!stats[baseCode]) {
        stats[baseCode] = { 
          theoryPresent: 0, theoryAbsent: 0, 
          labPresent: 0, labAbsent: 0,
          totalPresent: 0, totalAbsent: 0,
          hasLab: false
        };
      }
      
      if (isLab) {
        stats[baseCode].hasLab = true;
        if (attendance[id] === 'Present') {
          stats[baseCode].labPresent++;
          stats[baseCode].totalPresent++;
          totalPresent++;
        } else if (attendance[id] === 'Absent') {
          stats[baseCode].labAbsent++;
          stats[baseCode].totalAbsent++;
          totalAbsent++;
        }
      } else {
        if (attendance[id] === 'Present') {
          stats[baseCode].theoryPresent++;
          stats[baseCode].totalPresent++;
          totalPresent++;
        } else if (attendance[id] === 'Absent') {
          stats[baseCode].theoryAbsent++;
          stats[baseCode].totalAbsent++;
          totalAbsent++;
        }
      }
    });

    return { stats, totalPresent, totalAbsent };
  };

  const { stats, totalPresent, totalAbsent } = getSubjectStats();

  const renderClassItem = (item, index) => {
    const startMins = parseTime(item.startTime);
    const endMins = parseTime(item.endTime);
    
    let status = 'upcoming';
    if (currentTimeMinutes >= startMins && currentTimeMinutes <= endMins) {
      status = 'ongoing';
    } else if (currentTimeMinutes > endMins) {
      status = 'completed';
    }

    const isOngoing = status === 'ongoing';
    const isCompleted = status === 'completed';

    const cardColors = isOngoing 
      ? colors.gradientPrimary 
      : (isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8F9FA']);
      
    const textColor = isOngoing ? '#FFFFFF' : colors.text;
    const subTextColor = isOngoing ? 'rgba(255,255,255,0.8)' : colors.textSecondary;

    return (
      <GlassCard 
        key={item.id} 
        colors={cardColors} 
        style={[styles.classCard, isOngoing && styles.ongoingCard, { flexDirection: 'row', alignItems: 'center' }]} 
        padding={15}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.classHeader}>
            <View style={styles.timeBadge}>
              <FontAwesome5 name="clock" size={10} color={isOngoing ? colors.primary : colors.textMuted} />
              <Text style={[styles.timeText, { color: isOngoing ? colors.primary : colors.text }]}>
                {item.startTime} - {item.endTime}
              </Text>
            </View>
            {isOngoing && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>ONGOING</Text>
              </View>
            )}
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>ENDED</Text>
              </View>
            )}
          </View>

          <Text style={[styles.subjectName, { color: textColor }]}>{item.code}</Text>
          
          <View style={styles.classDetails}>
            <View style={styles.detailItem}>
              <FontAwesome5 name="user-tie" size={12} color={subTextColor} />
              <Text style={[styles.detailText, { color: subTextColor }]}>{item.teacher}</Text>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome5 name="map-marker-alt" size={12} color={subTextColor} />
              <Text style={[styles.detailText, { color: subTextColor }]}>{item.room}</Text>
            </View>
          </View>
        </View>

        {isCompleted && (
          <View style={{ marginLeft: 15, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: attendance[item.id] !== 'Absent' ? '#4CAF50' : '#F44336', marginBottom: 5 }}>
              {attendance[item.id] !== 'Absent' ? 'Present' : 'Absent'}
            </Text>
            <Switch
              trackColor={{ false: 'rgba(244, 67, 54, 0.5)', true: 'rgba(76, 175, 80, 0.5)' }}
              thumbColor={attendance[item.id] !== 'Absent' ? '#4CAF50' : '#F44336'}
              ios_backgroundColor="rgba(244, 67, 54, 0.5)"
              onValueChange={(val) => markAttendance(item.id, val ? 'Present' : 'Absent')}
              value={attendance[item.id] !== 'Absent'}
            />
          </View>
        )}
      </GlassCard>
    );
  };

  const renderWeeklyDay = (dayStr, classes) => {
    return (
      <View key={dayStr} style={styles.weeklyDayContainer}>
        <View style={styles.weeklyDayHeader}>
          <Text style={[styles.weeklyDayText, { color: colors.text }]}>{dayStr}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: SIZES.padding }}>
          {classes.length === 0 ? (
            <View style={styles.noClassesCard}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>No Classes</Text>
            </View>
          ) : (
            classes.map((cls, idx) => (
              <View key={idx} style={[styles.weeklyCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8F9FA', borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.weeklyCode, { color: colors.primary }]}>{cls.code}</Text>
                <Text style={[styles.weeklyTime, { color: colors.textSecondary }]}>{cls.startTime}</Text>
                <Text style={[styles.weeklyRoom, { color: colors.textMuted }]} numberOfLines={1}>{cls.room}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[FONTS.h2, { color: colors.text }]}>My Classes</Text>
        <TouchableOpacity onPress={() => setShowAttendanceModal(true)} style={styles.headerActionBtn}>
          <FontAwesome5 name="chart-pie" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Today's Classes */}
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="calendar-day" size={18} color={colors.primary} />
          <Text style={[FONTS.h2, styles.sectionTitle, { color: colors.text }]}>Today's Classes</Text>
          <Text style={[styles.dayBadge, { backgroundColor: colors.surfaceBorder, color: colors.text }]}>{currentDay}</Text>
        </View>

        {todayClasses.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>No classes scheduled for today.</Text>
        ) : (
          todayClasses.map((item, index) => renderClassItem(item, index))
        )}

        {/* Weekly Timetable */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <FontAwesome5 name="calendar-alt" size={18} color={colors.primary} />
          <Text style={[FONTS.h2, styles.sectionTitle, { color: colors.text }]}>Weekly Timetable</Text>
        </View>

        <View style={styles.weeklyContainer}>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => renderWeeklyDay(day, timetableData[day] || []))}
        </View>

        {/* Extra Class / Upcoming Quiz Section */}
        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <FontAwesome5 name="thumbtack" size={18} color={colors.primary} />
          <Text style={[FONTS.h2, styles.sectionTitle, { color: colors.text }]}>Extra Class / Upcoming Events</Text>
        </View>
        
        {extraClasses.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>No upcoming extra classes.</Text>
        ) : (
          extraClasses.map((item) => (
            <GlassCard key={item.id} colors={isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8F9FA']} style={{ marginBottom: 15 }} padding={15}>
              <View style={styles.classHeader}>
                <View style={styles.timeBadge}>
                  <FontAwesome5 name="clock" size={10} color={colors.textMuted} />
                  <Text style={[styles.timeText, { color: colors.text }]}>{item.time}</Text>
                </View>
                {item.date ? (
                  <View style={styles.completedBadge}>
                    <Text style={[styles.completedText, { color: colors.primary }]}>{item.date}</Text>
                  </View>
                ) : null}
              </View>
              
              <Text style={[styles.subjectName, { color: colors.text }]}>{item.title}</Text>
              
              <View style={styles.classDetails}>
                {item.teacher ? (
                  <View style={styles.detailItem}>
                    <FontAwesome5 name="user-tie" size={12} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.teacher}</Text>
                  </View>
                ) : null}
              </View>
              
              {item.remark ? (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 5, fontStyle: 'italic' }}>Note: {item.remark}</Text>
              ) : null}
            </GlassCard>
          ))
        )}

        {/* Timetable Upload Section */}
        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <FontAwesome5 name="file-upload" size={18} color={colors.primary} />
          <Text style={[FONTS.h2, styles.sectionTitle, { color: colors.text }]}>Update Timetable</Text>
        </View>

        <GlassCard style={styles.uploadCard}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.processingTitle, { color: colors.text }]}>AI Processing</Text>
              <Text style={[styles.processingSub, { color: colors.textSecondary }]}>Extracting subjects, rooms, and timings...</Text>
            </View>
          ) : showPreview ? (
            <View style={styles.previewContainer}>
              <FontAwesome5 name="check-circle" size={40} color="#4CAF50" style={{ marginBottom: 15 }} />
              <Text style={[styles.previewTitle, { color: colors.text }]}>Timetable Synced Successfully!</Text>
              <Text style={[styles.previewSub, { color: colors.textSecondary }]}>Extracted 24 classes across 5 days.</Text>
              <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.surfaceBorder }]} onPress={() => setShowPreview(false)}>
                <Text style={[styles.uploadBtnText, { color: colors.text }]}>Upload Another</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <View style={[styles.uploadIconCircle, { backgroundColor: colors.surfaceBorder }]}>
                <FontAwesome5 name="image" size={30} color={colors.textMuted} />
              </View>
              <Text style={[styles.uploadDesc, { color: colors.textSecondary }]}>Upload an image or PDF of your new timetable to automatically sync it with Planetto.</Text>
              <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={handleUpload}>
                <FontAwesome5 name="camera" size={14} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={[styles.uploadBtnText, { color: '#FFF' }]}>Upload Timetable</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        <View style={{ height: 50 }} />
      </ScrollView>

      <Modal visible={showAttendanceModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[FONTS.h2, { color: colors.text }]}>Attendance Stats</Text>
                {(() => {
                  const totalAggregateClasses = totalPresent + totalAbsent;
                  const overallAggregatePct = totalAggregateClasses === 0 ? 0 : Math.round((totalPresent / totalAggregateClasses) * 100);
                  return (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                      Overall aggregate: <Text style={{ color: overallAggregatePct < 75 ? '#F44336' : '#4CAF50', fontWeight: 'bold' }}>{overallAggregatePct}%</Text>
                    </Text>
                  );
                })()}
              </View>
              <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, marginTop: 15 }}>
              {Object.keys(stats).length === 0 ? (
                <Text style={{ color: colors.textSecondary }}>No attendance marked yet.</Text>
              ) : (
                Object.keys(stats).map((baseCode, idx) => {
                  const totalClasses = stats[baseCode].totalPresent + stats[baseCode].totalAbsent;
                  const overallPct = totalClasses === 0 ? 0 : Math.round((stats[baseCode].totalPresent / totalClasses) * 100);
                  const isWarning = overallPct < 75;

                  const labClasses = stats[baseCode].labPresent + stats[baseCode].labAbsent;
                  const labPct = labClasses === 0 ? 0 : Math.round((stats[baseCode].labPresent / labClasses) * 100);

                  return (
                    <View key={idx} style={[styles.subjectStatRow, { borderBottomColor: colors.surfaceBorder }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[FONTS.h3, { color: colors.primary }]}>{baseCode}</Text>
                          {isWarning && <Text style={{ marginLeft: 6, fontSize: 12 }}>⚠️</Text>}
                        </View>
                        <View style={{ flexDirection: 'row', marginTop: 4 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, marginRight: 10 }}>Overall: {overallPct}%</Text>
                          {stats[baseCode].hasLab && (
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Lab: {labPct}%</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.subjectStatPills}>
                        <View style={[styles.subjectPill, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#4CAF50' }}>{stats[baseCode].totalPresent}</Text>
                        </View>
                        <View style={[styles.subjectPill, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#F44336' }}>{stats[baseCode].totalAbsent}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddClassModal(true)}
      >
        <FontAwesome5 name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Class Modal */}
      <Modal visible={showAddClassModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddClassModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[FONTS.h2, { color: colors.text }]}>Add Extra Class</Text>
              <TouchableOpacity onPress={() => setShowAddClassModal(false)}>
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title / Subject *</Text>
              <TextInput 
                style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]} 
                placeholder="e.g. Extra OOPs Class" 
                placeholderTextColor={colors.textMuted}
                value={newClassForm.title}
                onChangeText={(t) => setNewClassForm({...newClassForm, title: t})}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Time *</Text>
              <TextInput 
                style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]} 
                placeholder="e.g. 10:00 - 11:00" 
                placeholderTextColor={colors.textMuted}
                value={newClassForm.time}
                onChangeText={(t) => setNewClassForm({...newClassForm, time: t})}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <TextInput 
                style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]} 
                placeholder="e.g. 12 May, Fri" 
                placeholderTextColor={colors.textMuted}
                value={newClassForm.date}
                onChangeText={(t) => setNewClassForm({...newClassForm, date: t})}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Teacher (Optional)</Text>
              <TextInput 
                style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]} 
                placeholder="e.g. Dr. XYZ" 
                placeholderTextColor={colors.textMuted}
                value={newClassForm.teacher}
                onChangeText={(t) => setNewClassForm({...newClassForm, teacher: t})}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Remark / Note (Optional)</Text>
              <TextInput 
                style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]} 
                placeholder="e.g. Room 204 or Quiz" 
                placeholderTextColor={colors.textMuted}
                value={newClassForm.remark}
                onChangeText={(t) => setNewClassForm({...newClassForm, remark: t})}
              />

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 25, marginBottom: 30 }]} onPress={handleAddExtraClass}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Add Class</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.padding, paddingVertical: 15, borderBottomWidth: 1 },
  backBtn: { padding: 5 },
  headerActionBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 20 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { marginLeft: 10 },
  dayBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: '700', overflow: 'hidden' },

  classCard: { marginBottom: 15 },
  ongoingCard: { transform: [{ scale: 1.02 }], elevation: 10, shadowColor: '#18FFFF', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  timeText: { fontSize: 11, fontWeight: '600', marginLeft: 6 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244, 67, 54, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F44336', marginRight: 4 },
  liveText: { fontSize: 9, fontWeight: 'bold', color: '#F44336' },
  completedBadge: { backgroundColor: 'rgba(158, 158, 158, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  completedText: { fontSize: 9, fontWeight: 'bold', color: '#9E9E9E' },

  subjectName: { ...FONTS.h3, fontSize: 18, marginBottom: 10 },
  classDetails: { flexDirection: 'row', marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  detailText: { fontSize: 12, marginLeft: 6 },

  attendanceSection: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)' },
  attendanceQ: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  attendanceBtns: { flexDirection: 'row' },
  attBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginHorizontal: 5 },
  attBtnPresent: { backgroundColor: '#4CAF50' },
  attBtnAbsent: { backgroundColor: '#F44336' },
  attBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  attendanceMarked: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)' },
  attendanceMarkedText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },

  weeklyContainer: { marginTop: 5 },
  weeklyDayContainer: { marginBottom: 15 },
  weeklyDayHeader: { width: 50, justifyContent: 'center' },
  weeklyDayText: { fontSize: 13, fontWeight: '700' },
  weeklyCard: { padding: 10, borderRadius: 12, borderWidth: 1, marginRight: 10, width: 100 },
  weeklyCode: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  weeklyTime: { fontSize: 10, marginBottom: 4 },
  weeklyRoom: { fontSize: 10 },
  noClassesCard: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center' },

  uploadCard: { padding: 25, alignItems: 'center', marginBottom: 20 },
  uploadIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  uploadDesc: { textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  uploadBtnText: { fontWeight: '700', fontSize: 14 },

  processingContainer: { alignItems: 'center', paddingVertical: 20 },
  processingTitle: { ...FONTS.h3, marginTop: 20, marginBottom: 5 },
  processingSub: { fontSize: 12 },

  previewContainer: { alignItems: 'center', paddingVertical: 10 },
  previewTitle: { ...FONTS.h3, marginBottom: 5 },
  previewSub: { fontSize: 12, marginBottom: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  statsOverviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statOverviewBox: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 16, marginHorizontal: 5 },
  subjectStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  subjectStatPills: { flexDirection: 'row' },
  subjectPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputField: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 14, marginBottom: 5 },
});

export default MyClassesScreen;
