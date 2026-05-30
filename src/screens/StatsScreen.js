import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import AvatarInitials from '../components/AvatarInitials';

const StatsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  const { stats, tasks, formatFocusTime } = useData();

  const profileName = user?.name || 'Guest User';
  const profileEmail = user?.email || 'No email provided';

  const subjectColors = [
    colors.primary,
    colors.secondary || '#7E52E8',
    colors.accent || '#F59E0B',
    '#3B82F6',
    '#EF4444',
    '#EC4899',
    '#10B981',
    '#8B5CF6'
  ];

  const allocatedSubjects = (() => {
    if (!tasks || tasks.length === 0) return [];
    const counts = {};
    let total = 0;
    tasks.forEach(t => {
      const sub = t.subject || 'General';
      counts[sub] = (counts[sub] || 0) + 1;
      total++;
    });
    return Object.keys(counts).map((sub, idx) => {
      const count = counts[sub];
      const pct = Math.round((count / total) * 100);
      return {
        title: sub,
        percent: `${pct}%`,
        width: `${pct}%`,
        pColor: subjectColors[idx % subjectColors.length]
      };
    }).sort((a, b) => parseInt(b.percent) - parseInt(a.percent));
  })();

  const getHeatGridData = () => {
    const squares = [];
    const activity = stats?.activity || {};
    // Loop from 29 days ago to today (30 days total)
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Use backend activity count (combines focus sessions, tasks, logins, room activity)
      const count = activity[dateStr] || 0;
      
      squares.push({
        date: dateStr,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        count
      });
    }
    return squares;
  };

  const handleBoxClick = (displayDate, count) => {
    Alert.alert(
      "Consistent Growth",
      `${count} activit${count === 1 ? 'y' : 'ies'} recorded on ${displayDate}.`
    );
  };

  const gridData = getHeatGridData();

  const getWeeklyData = () => {
    const act = stats?.activity || {};
    const weeklyCounts = [];
    let activeDays = 0;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Use backend activity data directly (combines focus sessions + tasks + logins)
      const totalActivity = act[dateStr] || 0;
      if (totalActivity > 0) {
        activeDays++;
      }
      weeklyCounts.push(totalActivity);
    }
    return { weeklyCounts, activeDays };
  };

  const { weeklyCounts, activeDays } = getWeeklyData();

  // Generate SVG path for the line
  const maxVal = Math.max(...weeklyCounts, 1);
  const pathD = weeklyCounts.map((val, idx) => {
    const x = idx * 50;
    const y = 70 - (val / maxVal) * 50;
    return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const fillD = `${pathD} L300,80 L0,80 Z`;

  // Profile edit state
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [editBio, setEditBio] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [pickedPhoto, setPickedPhoto] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "You need to allow camera roll access to upload a profile photo.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setPickedPhoto(base64Uri);
      }
    } catch (err) {
      console.error("ImagePicker Error:", err);
      Alert.alert("Error", "Failed to pick image: " + err.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Invalid Input", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    const success = await updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      profileImage: pickedPhoto,
    });
    setIsSaving(false);
    if (success) {
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackText('');
    setFeedbackModalVisible(false);
    Alert.alert('Feedback Sent', 'Thanks for helping us improve Planetto!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.profileHeader}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.surface, marginRight: 20 }}
            />
          ) : (
            <AvatarInitials
              name={profileName}
              size={80}
              fontSize={26}
              bgColor="#2D5A3C"
              textColor="#FFFFFF"
              style={{ borderWidth: 3, borderColor: colors.surface, marginRight: 20 }}
            />
          )}
          <View style={styles.profileInfo}>
            <Text style={[FONTS.h2, { color: colors.text, fontSize: 24 }]}>{profileName}</Text>
            <Text style={[FONTS.body2, { color: colors.textSecondary }]}>{profileEmail}</Text>
            <TouchableOpacity 
              style={[styles.editProfileBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => { setEditName(profileName); setEditEmail(profileEmail); setPickedPhoto(user?.profileImage || null); setEditModalVisible(true); }}
            >
              <FontAwesome5 name="pen" size={10} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={[FONTS.subtitle, { color: '#FFF' }]}>EDIT PROFILE</Text>
            </TouchableOpacity>
            {/* Admin Panel shortcut — visible only to admin */}
            {(user?.isAdmin || user?.email === 'admin@planetto.space') && (
              <TouchableOpacity
                style={[styles.adminShortcut, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
                onPress={() => navigation.navigate('AdminPanel')}
              >
                <FontAwesome5 name="user-shield" size={10} color={colors.primary} solid />
                <Text style={[FONTS.subtitle, { color: colors.primary, marginLeft: 6, fontSize: 9 }]}>ADMIN PANEL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.introSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>ACADEMIC INSIGHTS</Text>
          <Text style={[FONTS.h1, { fontSize: 24, marginVertical: 5, color: colors.text }]}>Cognitive Dashboard</Text>
        </View>

        <GlassCard style={styles.qualityCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Focus Quality</Text>
          <View style={styles.qualityContent}>
            <View style={styles.qualityRing}>
              <Svg width="100" height="100" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" stroke={`${colors.primary}33`} strokeWidth="6" fill="none" />
                <Circle 
                  cx="50" cy="50" r="40" 
                  stroke={colors.primary} 
                  strokeWidth="6" 
                  fill="none" 
                  strokeDasharray="251"
                  strokeDashoffset="45"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.qualityCenter}>
                <Text style={[FONTS.h1, { fontSize: 24, color: colors.text }]}>{stats?.focusQuality || 100}</Text>
                <Text style={[FONTS.subtitle, { fontSize: 8, marginTop: 2, color: colors.text }]}>
                  {(stats?.focusQuality || 100) > 80 ? 'HIGH' : (stats?.focusQuality || 100) > 50 ? 'MED' : 'LOW'}
                </Text>
              </View>
            </View>
            <View style={[styles.qualityTextWrap, { backgroundColor: `${colors.primary}1A` }]}>
               <Text style={[FONTS.body2, { color: colors.primary }]}>{(stats?.focusQuality || 100) < 100 ? 'Keep up the good work!' : 'Perfect focus quality.'}</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.growthCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Consistent Growth</Text>
          <View style={styles.heatMapContainer}>
             {gridData.map((day, index) => {
               let bgColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
               if (day.count > 0) {
                 bgColor = day.count >= 3 ? colors.primary : `${colors.primary}55`;
               }
               return (
                 <TouchableOpacity 
                   key={index} 
                   style={[styles.heatSquare, { backgroundColor: bgColor }]} 
                   onPress={() => handleBoxClick(day.displayDate, day.count)}
                   activeOpacity={0.7}
                 />
               );
             })}
          </View>
          <View style={[styles.growthStatPill, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
             <FontAwesome5 name="fire" color={colors.primary} size={12} />
             <View style={{ marginLeft: 10 }}>
               <Text style={[styles.growthPillTitle, { color: colors.textMuted }]}>LONGEST STREAK</Text>
               <Text style={[FONTS.h3, { color: colors.text }]}>{stats?.dayStreak || 0} Days</Text>
             </View>
          </View>
        </GlassCard>

        <GlassCard style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
             <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Focus</Text>
             <Text style={[FONTS.h2, { color: colors.primary }]}>{formatFocusTime(stats?.focusTimeToday || 0)} <Text style={[FONTS.body2, { color: colors.textMuted }]}>today</Text></Text>
          </View>
          {activeDays < 7 ? (
            <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[FONTS.body2, { color: colors.textSecondary, textAlign: 'center' }]}>
                Need {7 - activeDays} more active day{7 - activeDays !== 1 ? 's' : ''} for the weekly graph.
              </Text>
            </View>
          ) : (
            <Svg height="80" width="100%" viewBox="0 0 300 80">
              <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
              <Path d={fillD} fill={`${colors.primary}1A`} />
            </Svg>
          )}
        </GlassCard>

        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={[styles.streakCard, { borderRadius: 24, padding: 20, marginBottom: 20 }]}>
          <FontAwesome5 name="star" color="#FFF" size={20} style={{ alignSelf: 'flex-end' }} />
          <Text style={[FONTS.h1, { fontSize: 48, color: '#FFF', marginVertical: 10 }]}>{stats?.dayStreak || 0}</Text>
          <Text style={[FONTS.body1, { color: '#FFF' }]}>Day Streak</Text>
          <Text style={[FONTS.body2, { color: 'rgba(255,255,255,0.7)', marginTop: 5 }]}>Stay consistent to build your streak!</Text>
          <View style={styles.streakProgressBg}>
             <View style={styles.streakProgressFill} />
          </View>
        </LinearGradient>

        <GlassCard style={{ marginBottom: 20 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Subject Allocation</Text>
          {allocatedSubjects.length === 0 ? (
            <Text style={[FONTS.body2, { color: colors.textSecondary, textAlign: 'center', marginVertical: 10 }]}>
              No subjects allocated yet. Add tasks with subjects to see your allocation.
            </Text>
          ) : (
            allocatedSubjects.map((sub, idx) => (
              <SubjectBar 
                key={idx}
                title={sub.title} 
                percent={sub.percent} 
                pColor={sub.pColor} 
                width={sub.width} 
                colors={colors} 
              />
            ))
          )}
        </GlassCard>

        {/* Admin Panel — bottom section, full-width button */}
        {(user?.isAdmin || user?.email === 'admin@planetto.space') && (
          <TouchableOpacity
            style={[styles.adminPanelBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <FontAwesome5 name="shield-alt" size={14} color={colors.primary} solid />
            <Text style={[FONTS.subtitle, { color: colors.primary, marginLeft: 10 }]}>ADMIN PANEL</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: colors.danger }]} 
          onPress={() => navigation.replace('Login')}
        >
          <FontAwesome5 name="sign-out-alt" color={colors.danger} size={14} />
          <Text style={[FONTS.subtitle, { color: colors.danger, marginLeft: 10 }]}>LOGOUT SECURELY</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.feedbackBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => setFeedbackModalVisible(true)}
        >
           <FontAwesome5 name="comment-alt" color={colors.textSecondary} size={14} />
           <Text style={[FONTS.subtitle, { color: colors.textSecondary, marginLeft: 10 }]}>SUBMIT DEVELOPER FEEDBACK</Text>
        </TouchableOpacity>

        <View style={{height: 120}} /> 
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={[styles.modalBg, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.9)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[FONTS.h2, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarEditRow}>
              {pickedPhoto ? (
                <Image
                  source={{ uri: pickedPhoto }}
                  style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: colors.surfaceBorder, marginBottom: 12 }}
                />
              ) : (
                <AvatarInitials
                  name={editName}
                  size={70}
                  fontSize={22}
                  bgColor="#2D5A3C"
                  textColor="#FFFFFF"
                  style={{ borderWidth: 2, borderColor: colors.surfaceBorder, marginBottom: 12 }}
                />
              )}
              <TouchableOpacity 
                onPress={handleChangePhoto}
                style={[styles.changePhotoBtn, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}
              >
                <FontAwesome5 name="camera" size={12} color={colors.primary} />
                <Text style={[FONTS.subtitle, { color: colors.primary, marginLeft: 6, fontSize: 10 }]}>CHANGE PHOTO</Text>
              </TouchableOpacity>
            </View>

            <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>DISPLAY NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>EMAIL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
            />

            <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>BIO (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top', backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="A short bio about yourself"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalBtnCancelTxt, { color: colors.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnSave, { backgroundColor: colors.primary }]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>SAVE CHANGES</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal visible={isFeedbackModalVisible} transparent animationType="slide">
        <View style={[styles.modalBg, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.9)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[FONTS.h2, { color: colors.text }]}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[FONTS.body2, { color: colors.textSecondary, marginBottom: 20, lineHeight: 18 }]}>Help us improve Planetto. Your feedback goes directly to the dev team.</Text>

            <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>YOUR FEEDBACK</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top', backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what you think, report a bug, or suggest a feature..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setFeedbackModalVisible(false)}>
                <Text style={[styles.modalBtnCancelTxt, { color: colors.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: colors.primary }]} onPress={handleSubmitFeedback}>
                <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>SEND FEEDBACK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const SubjectBar = ({ title, percent, pColor, width, colors }) => (
  <View style={{ marginBottom: 15 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
      <Text style={[FONTS.body2, { color: colors.text }]}>{title}</Text>
      <Text style={[FONTS.subtitle, { color: colors.primary }]}>{percent}</Text>
    </View>
    <View style={{ height: 4, backgroundColor: colors.surfaceBorder, borderRadius: 2 }}>
      <View style={{ height: '100%', width: width, backgroundColor: pColor, borderRadius: 2 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding },
  introSection: { marginBottom: 20 },
  cardTitle: { ...FONTS.h3, fontSize: 16, marginBottom: 15 },
  qualityCard: { marginBottom: 20, alignItems: 'center' },
  qualityContent: { alignItems: 'center' },
  qualityRing: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  qualityCenter: { position: 'absolute', alignItems: 'center' },
  qualityTextWrap: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  growthCard: { marginBottom: 20 },
  heatMapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  heatSquare: { width: 12, height: 12, borderRadius: 3 },
  growthStatPill: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1 },
  growthPillTitle: { ...FONTS.subtitle, fontSize: 9, marginBottom: 4 },
  streakProgressBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 20 },
  streakProgressFill: { width: '85%', height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingVertical: 10 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, marginRight: 20 },
  profileInfo: { flex: 1 },
  editProfileBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  adminShortcut: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  adminPanelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1.5, marginBottom: 15 },
  // Modal styles
  modalBg: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 25, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalLabel: { marginBottom: 8, fontSize: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, ...FONTS.body1, marginBottom: 18 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20, marginRight: 10 },
  modalBtnCancelTxt: { ...FONTS.subtitle, fontSize: 12 },
  modalBtnSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalBtnSaveTxt: { ...FONTS.subtitle, fontSize: 12 },
  avatarEditRow: { alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, marginBottom: 12 },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
});

export default StatsScreen;
