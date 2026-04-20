import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Image, Modal, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const room1 = require('../../assets/room1.png');
const room2 = require('../../assets/room3.png');
const room3 = require('../../assets/room2.png');

const ROOM_DATA = [
  {
    id: 'r1',
    title: 'Cyberpunk Café',
    desc: 'Lo-Fi beats, rain sounds, and neon vibes for deep coding sessions.',
    image: room1,
    live: true,
    count: 14,
    participants: [
      { img: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { img: 'https://randomuser.me/api/portraits/men/22.jpg' },
    ],
    btnColor: 'secondary',
    tag: 'Lo-Fi',
  },
  {
    id: 'r2',
    title: 'Old Library Vibes',
    desc: 'Strictly silent. Focus on heavy research and academic reading.',
    image: room2,
    live: false,
    count: 46,
    participants: [
      { img: 'https://randomuser.me/api/portraits/men/33.jpg' },
      { img: 'https://randomuser.me/api/portraits/men/11.jpg' },
    ],
    btnColor: 'primary',
    tag: 'Silent',
  },
  {
    id: 'r3',
    title: 'Deep Work Zone',
    desc: 'Hardcore academics working on their hardest problems together.',
    image: room3,
    live: true,
    count: 7,
    participants: [
      { img: 'https://randomuser.me/api/portraits/women/55.jpg' },
      { img: 'https://randomuser.me/api/portraits/men/77.jpg' },
    ],
    btnColor: 'accent',
    tag: 'Deep Work',
  },
];

const FILTERS = ['All', 'Lo-Fi', 'Silent', 'Deep Work', 'Live'];

const RoomsScreen = () => {
  const { colors, isDarkMode } = useTheme();

  const [joinedRooms, setJoinedRooms] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomType, setNewRoomType] = useState('Silent');

  const filteredRooms = ROOM_DATA.filter(r => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Live') return r.live;
    return r.tag === activeFilter;
  });

  const handleJoinRoom = (room) => {
    setSelectedRoom(room);
    setJoinModalVisible(true);
  };

  const confirmJoin = () => {
    if (selectedRoom) {
      setJoinedRooms(prev => ({ ...prev, [selectedRoom.id]: !prev[selectedRoom.id] }));
    }
    setJoinModalVisible(false);
    if (!joinedRooms[selectedRoom?.id]) {
      Alert.alert('🚀 Joined Room!', `Welcome to ${selectedRoom?.title}! Focus mode activated.`);
    } else {
      Alert.alert('Left Room', `You have left ${selectedRoom?.title}.`);
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      Alert.alert('Missing Name', 'Please enter a room name.');
      return;
    }
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomType('Silent');
    setCreateModalVisible(false);
    Alert.alert('Room Created!', `"${newRoomName}" is now live. Invite your friends to study together!`);
  };

  const getRoomButtonColor = (room) => {
    if (joinedRooms[room.id]) return colors.danger;
    if (room.btnColor === 'secondary') return colors.secondary;
    if (room.btnColor === 'accent') return colors.accent;
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.introSection}>
          <Text style={[FONTS.subtitle, { color: colors.textSecondary }]}>SOCIAL SYNERGY</Text>
          <Text style={[FONTS.h1, { fontSize: 24, marginVertical: 5, color: colors.text }]}>
            Synchronize your focus{'\n'}with <Text style={{ color: colors.primary }}>4.2k students</Text>
          </Text>
        </View>

        {/* Community Sprint */}
        <GlassCard style={styles.sprintCard}>
          <View style={styles.sprintHeader}>
            <FontAwesome5 name="rocket" color={colors.primary} size={16} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[FONTS.h3, { fontSize: 16, color: colors.text }]}>Community Sprint: Finals Week</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>78%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceBorder }]}>
            <LinearGradient colors={colors.gradientPrimary} style={styles.progressBarFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
          <Text style={[FONTS.body2, { fontSize: 11, color: colors.textSecondary }]}>Target: 1,000,000 Collective Focus Minutes.</Text>
          <TouchableOpacity onPress={() => Alert.alert('Community Sprint', 'Join any room below to contribute your focus time to the sprint!')}>
            <Text style={[FONTS.body2, { color: colors.primary, fontSize: 11, marginTop: 5 }]}>Join a room to contribute →</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Top Explorers Leaderboard */}
        <GlassCard style={styles.leaderboardCard}>
          <View style={styles.leaderRow}>
            <Text style={[styles.leaderTitle, { color: colors.text }]}>Top Explorers</Text>
            <TouchableOpacity onPress={() => Alert.alert('Leaderboard', 'Full leaderboard coming soon! Keep grinding to climb the ranks.')}>
              <FontAwesome5 name="trophy" color={colors.primary} size={14} />
            </TouchableOpacity>
          </View>
          {[
            { id: '01', name: 'Elena V.', time: '420 min', img: 'https://randomuser.me/api/portraits/women/44.jpg', medal: '🥇' },
            { id: '02', name: 'Marcus K.', time: '385 min', img: 'https://randomuser.me/api/portraits/men/22.jpg', medal: '🥈' },
            { id: '03', name: 'David Chen', time: '280 min', img: 'https://randomuser.me/api/portraits/men/55.jpg', medal: '🥉' },
          ].map((item) => (
            <TouchableOpacity key={item.id} style={styles.leaderItem} onPress={() => Alert.alert(item.name, `Focus time this week: ${item.time}`)}>
              <Text style={[styles.leaderRank, { color: colors.textMuted }]}>{item.medal}</Text>
              <Image source={{ uri: item.img }} style={styles.leaderAvatar} />
              <Text style={[styles.leaderName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.leaderTime, { color: colors.primary }]}>{item.time}</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Filter + Create Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[FONTS.h2, { fontSize: 22, color: colors.text }]}>Active Focus Rooms</Text>
          <View style={styles.headerFilters}>
            <TouchableOpacity 
              style={[styles.iconBtn, { backgroundColor: isFilterVisible ? colors.primary : colors.surfaceLight }]}
              onPress={() => setFilterVisible(!isFilterVisible)}
            >
              <FontAwesome5 name="filter" color={isFilterVisible ? '#FFF' : colors.textSecondary} size={12} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, { marginLeft: 10, backgroundColor: colors.primary }]}
              onPress={() => setCreateModalVisible(true)}
            >
              <FontAwesome5 name="plus" color={'#FFF'} size={12} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Pills */}
        {isFilterVisible && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }} contentContainerStyle={{ gap: 8, paddingRight: 5 }}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, { 
                  backgroundColor: activeFilter === f ? colors.primary : colors.surfaceLight,
                  borderColor: activeFilter === f ? colors.primary : colors.surfaceBorder,
                }]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[FONTS.subtitle, { fontSize: 9, color: activeFilter === f ? '#FFF' : colors.textMuted }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Room Cards */}
        {filteredRooms.length === 0 && (
          <Text style={[FONTS.body2, { textAlign: 'center', marginVertical: 30, color: colors.textSecondary }]}>No rooms match this filter.</Text>
        )}
        {filteredRooms.map(room => (
          <View key={room.id} style={styles.roomWrapper}>
            <ImageBackground source={room.image} style={styles.roomImage} imageStyle={{ borderRadius: 24 }}>
              <LinearGradient colors={colors.gradientRoom} style={styles.roomGradient} />
              <View style={styles.roomContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {room.live && (
                    <View style={[styles.livePill, { backgroundColor: `${colors.primary}33`, marginRight: 8 }]}>
                      <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.liveText, { color: colors.primary }]}>LIVE NOW</Text>
                    </View>
                  )}
                  <View style={[styles.livePill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
                    <Text style={[styles.liveText, { color: isDarkMode ? '#FFF' : colors.text }]}>{room.count + (joinedRooms[room.id] ? 1 : 0)} STUDENTS</Text>
                  </View>
                </View>
                <Text style={[styles.roomTitle, { color: '#FFF' }]}>{room.title}</Text>
                <Text style={[styles.roomDesc, { color: 'rgba(255,255,255,0.75)' }]}>{room.desc}</Text>
                
                <View style={styles.roomFooter}>
                  <View style={styles.roomUsers}>
                    {room.participants.map((p, i) => (
                      <Image key={i} source={{ uri: p.img }} style={[styles.roomAvatar, { marginLeft: i > 0 ? -10 : 0, borderColor: colors.surface }]} />
                    ))}
                    {joinedRooms[room.id] && (
                      <View style={[styles.youBadge, { backgroundColor: colors.primary }]}>
                        <Text style={{ fontSize: 7, fontWeight: '800', color: isDarkMode ? '#000' : '#FFF' }}>YOU</Text>
                      </View>
                    )}
                    <Text style={[styles.roomCount, { color: '#FFF' }]}>+{room.count}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.joinBtn, { backgroundColor: getRoomButtonColor(room) }]}
                    onPress={() => handleJoinRoom(room)}
                  >
                    <FontAwesome5 name={joinedRooms[room.id] ? 'door-open' : 'sign-in-alt'} color="#FFF" size={11} />
                    <Text style={[styles.joinBtnText, { color: '#FFF', marginLeft: 6 }]}>
                      {joinedRooms[room.id] ? 'Leave' : 'Join Room'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}

        <View style={{height: 100}} /> 
      </ScrollView>

      {/* Join Room Confirmation Modal */}
      <Modal visible={isJoinModalVisible} transparent animationType="fade">
        <View style={[styles.modalBg, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[FONTS.h2, { color: colors.text, marginBottom: 10 }]}>
              {joinedRooms[selectedRoom?.id] ? 'Leave Room?' : `Join ${selectedRoom?.title}?`}
            </Text>
            <Text style={[FONTS.body2, { color: colors.textSecondary, lineHeight: 18, marginBottom: 25 }]}>
              {joinedRooms[selectedRoom?.id] 
                ? 'You will leave this focus room and your presence will be removed.'
                : `${selectedRoom?.desc}\n\nJoining activates collaborative focus mode with ${selectedRoom?.count} other students.`
              }
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setJoinModalVisible(false)}>
                <Text style={[styles.modalBtnCancelTxt, { color: colors.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnSave, { backgroundColor: joinedRooms[selectedRoom?.id] ? colors.danger : colors.primary }]} 
                onPress={confirmJoin}
              >
                <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>
                  {joinedRooms[selectedRoom?.id] ? 'LEAVE' : 'JOIN NOW'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Room Modal */}
      <Modal visible={isCreateModalVisible} transparent animationType="slide">
        <View style={[styles.modalBg, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.92)' : 'rgba(0,0,0,0.5)' }]}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[FONTS.h2, { color: colors.text }]}>Create Room</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <FontAwesome5 name="times" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>ROOM NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="e.g. Exam Prep Squad"
                placeholderTextColor={colors.textMuted}
                value={newRoomName}
                onChangeText={setNewRoomName}
              />

              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="What's this room about?"
                placeholderTextColor={colors.textMuted}
                multiline
                value={newRoomDesc}
                onChangeText={setNewRoomDesc}
              />

              <Text style={[FONTS.subtitle, styles.modalLabel, { color: colors.textMuted }]}>ROOM TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 25 }}>
                {['Silent', 'Lo-Fi', 'Deep Work'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, { 
                      backgroundColor: newRoomType === type ? colors.primary : colors.surfaceLight,
                      borderColor: newRoomType === type ? colors.primary : colors.surfaceBorder,
                    }]}
                    onPress={() => setNewRoomType(type)}
                  >
                    <Text style={[FONTS.subtitle, { fontSize: 9, color: newRoomType === type ? '#FFF' : colors.textMuted }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setCreateModalVisible(false)}>
                  <Text style={[styles.modalBtnCancelTxt, { color: colors.textMuted }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: colors.primary }]} onPress={handleCreateRoom}>
                  <Text style={[styles.modalBtnSaveTxt, { color: '#FFF' }]}>CREATE ROOM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding },
  introSection: { marginBottom: 20 },
  sprintCard: { marginBottom: 20 },
  sprintHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  progressBarBg: { height: 10, borderRadius: 5, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { width: '78%', height: '100%', borderRadius: 5 },
  leaderboardCard: { marginBottom: 30, borderRadius: 24, padding: 20 },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  leaderTitle: { ...FONTS.h3, fontSize: 18 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  leaderRank: { ...FONTS.subtitle, width: 30, fontSize: 16 },
  leaderAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 15 },
  leaderName: { ...FONTS.body1, flex: 1 },
  leaderTime: { ...FONTS.body2, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerFilters: { flexDirection: 'row' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  roomWrapper: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', height: 280 },
  roomImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  roomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%' },
  roomContent: { padding: 20, zIndex: 2 },
  livePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  liveText: { ...FONTS.subtitle, fontSize: 9 },
  roomTitle: { ...FONTS.h2, marginBottom: 5 },
  roomDesc: { ...FONTS.body2, lineHeight: 18, marginBottom: 15, paddingRight: 30 },
  roomFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomUsers: { flexDirection: 'row', alignItems: 'center' },
  roomAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  youBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: -10, borderWidth: 2, borderColor: '#FFF' },
  roomCount: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  joinBtnText: { fontWeight: '700', fontSize: 12 },
  // Modal
  modalBg: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 25, borderWidth: 1 },
  modalLabel: { marginBottom: 8, fontSize: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, ...FONTS.body1, marginBottom: 18 },
  typePill: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20, marginRight: 10 },
  modalBtnCancelTxt: { ...FONTS.subtitle, fontSize: 12 },
  modalBtnSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalBtnSaveTxt: { ...FONTS.subtitle, fontSize: 12 },
});

export default RoomsScreen;
