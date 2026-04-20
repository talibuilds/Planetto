import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const StatsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  // Profile edit state
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [profileName, setProfileName] = useState('Alex Mercer');
  const [profileEmail, setProfileEmail] = useState('alex@planetto.space');
  const [editName, setEditName] = useState('Alex Mercer');
  const [editEmail, setEditEmail] = useState('alex@planetto.space');
  const [editBio, setEditBio] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    setProfileName(editName.trim());
    setProfileEmail(editEmail.trim());
    setEditModalVisible(false);
    Alert.alert('Profile Updated', 'Your profile has been saved successfully!');
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
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={[styles.profileAvatar, { borderColor: colors.surface }]} />
          <View style={styles.profileInfo}>
            <Text style={[FONTS.h2, { color: colors.text, fontSize: 24 }]}>{profileName}</Text>
            <Text style={[FONTS.body2, { color: colors.textSecondary }]}>{profileEmail}</Text>
            <TouchableOpacity 
              style={[styles.editProfileBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => { setEditName(profileName); setEditEmail(profileEmail); setEditModalVisible(true); }}
            >
              <FontAwesome5 name="pen" size={10} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={[FONTS.subtitle, { color: '#FFF' }]}>EDIT PROFILE</Text>
            </TouchableOpacity>
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
                  rotation="-90"
                  origin="50, 50"
                />
              </Svg>
              <View style={styles.qualityCenter}>
                <Text style={[FONTS.h1, { fontSize: 24, color: colors.text }]}>82</Text>
                <Text style={[FONTS.subtitle, { fontSize: 8, marginTop: 2, color: colors.text }]}>HIGH</Text>
              </View>
            </View>
            <View style={[styles.qualityTextWrap, { backgroundColor: `${colors.primary}1A` }]}>
               <Text style={[FONTS.body2, { color: colors.primary }]}>+12% from last week.</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.growthCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Consistent Growth</Text>
          <View style={styles.heatMapContainer}>
             {[...Array(30)].map((_, i) => (
                <View key={i} style={[
                  styles.heatSquare, 
                  { backgroundColor: Math.random() > 0.5 ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') }
                ]} />
             ))}
          </View>
          <View style={[styles.growthStatPill, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
             <FontAwesome5 name="fire" color={colors.primary} size={12} />
             <View style={{ marginLeft: 10 }}>
               <Text style={[styles.growthPillTitle, { color: colors.textMuted }]}>LONGEST STREAK</Text>
               <Text style={[FONTS.h3, { color: colors.text }]}>15 Days</Text>
             </View>
          </View>
        </GlassCard>

        <GlassCard style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
             <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Focus</Text>
             <Text style={[FONTS.h2, { color: colors.primary }]}>42h <Text style={[FONTS.body2, { color: colors.textMuted }]}>total</Text></Text>
          </View>
          <Svg height="80" width="100%" viewBox="0 0 300 80">
            <Path d="M0,60 Q40,40 80,60 T160,30 T240,50 T300,20" fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
            <Path d="M0,60 Q40,40 80,60 T160,30 T240,50 T300,20 L300,80 L0,80 Z" fill={`${colors.primary}1A`} />
          </Svg>
        </GlassCard>

        <LinearGradient colors={['#7E52E8', '#5234A5']} style={[styles.streakCard, { borderRadius: 24, padding: 20, marginBottom: 20 }]}>
          <FontAwesome5 name="star" color="#FFF" size={20} style={{ alignSelf: 'flex-end' }} />
          <Text style={[FONTS.h1, { fontSize: 48, color: '#FFF', marginVertical: 10 }]}>12</Text>
          <Text style={[FONTS.body1, { color: '#FFF' }]}>Day Streak</Text>
          <Text style={[FONTS.body2, { color: 'rgba(255,255,255,0.7)', marginTop: 5 }]}>Almost at your 14 day target.</Text>
          <View style={styles.streakProgressBg}>
             <View style={styles.streakProgressFill} />
          </View>
        </LinearGradient>

        <GlassCard style={{ marginBottom: 20 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Subject Allocation</Text>
          <SubjectBar title="Biology" percent="40%" pColor={colors.primary} width="60%" colors={colors} />
          <SubjectBar title="Quantum Computing" percent="30%" pColor={colors.secondary} width="40%" colors={colors} />
          <SubjectBar title="Deep Learning" percent="20%" pColor={colors.accent} width="25%" colors={colors} />
          <SubjectBar title="Literature" percent="10%" pColor={colors.textMuted} width="10%" colors={colors} />
        </GlassCard>

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
              <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={[styles.modalAvatar, { borderColor: colors.surfaceBorder }]} />
              <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}>
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
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>SAVE CHANGES</Text>
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
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
