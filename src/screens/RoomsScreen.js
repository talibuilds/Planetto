import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Modal, Alert, Animated, ActivityIndicator, FlatList, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AvatarInitials from '../components/AvatarInitials';
import Header from '../components/Header';
import { roomsApi, notificationsApi } from '../api/rooms';

// ─── Room Type Config ─────────────────────────────────────────────────────────
const ROOM_TYPES = [
  { key: 'STUDY_GROUP', label: 'Study Group', icon: 'book-open', color: '#6366F1' },
  { key: 'PROJECT_ROOM', label: 'Project Room', icon: 'project-diagram', color: '#F59E0B' },
  { key: 'CLASSROOM', label: 'Class Room', icon: 'chalkboard-teacher', color: '#10B981' },
  { key: 'ACCOUNTABILITY_POD', label: 'Productivity', icon: 'users', color: '#EC4899' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Computer Science', label: 'CS' },
  { key: 'Mathematics', label: 'Maths' },
  { key: 'AI & ML', label: 'AI & ML' },
  { key: 'Physics', label: 'Physics' },
  { key: 'Engineering', label: 'Engineering' },
  { key: 'Productivity', label: 'Productivity' },
];

const BANNER_COLORS = ['#2D5016', '#1E3A5F', '#4A1D5E', '#7C2D12', '#065F46', '#1F2937'];

const MOCK_COVERS = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop', // Study Group
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop', // Class Room
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop', // Project
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop', // Productivity
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop', // Fun / Gaming
];

const LiveDot = ({ colors }) => {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', opacity: 0.4, transform: [{ scale: anim }] }} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444' }} />
    </View>
  );
};

// ─── Room Card (Grid View) ────────────────────────────────────────────────────
const isImageUrl = (str) => str && (str.startsWith('http') || str.startsWith('data:image'));
const getRoomAvatarUrl = (emoji) => {
  if (isImageUrl(emoji)) return emoji;
  switch (emoji) {
    case '📚': return MOCK_COVERS[0]; // Study Group
    case '💻': return MOCK_COVERS[1]; // Class Room
    case '✏️': return MOCK_COVERS[1]; // Class Room
    case '🔬': return MOCK_COVERS[2]; // Project
    case '🏆': return MOCK_COVERS[4]; // Fun / Gaming
    case '🎯': return MOCK_COVERS[4]; // Fun / Gaming
    case '🧠': return MOCK_COVERS[3]; // Productivity
    case '⚡': return MOCK_COVERS[3]; // Productivity
    default: return MOCK_COVERS[0];
  }
};

const RoomCard = ({ room, onPress, colors, isDarkMode }) => {
  const isLive = !!room.activeSession;
  const taskPercent = room.taskStats?.total > 0
    ? Math.round((room.taskStats.done / room.taskStats.total) * 100) : 0;

  const typeConfig = ROOM_TYPES.find(t => t.key === room.type) ?? ROOM_TYPES[0];

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.roomCardWrap}>
      <View style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, flexDirection: 'row', overflow: 'hidden' }]}>
        <View style={{ flex: 1, padding: 14 }}>
          {/* Header row */}
          <View style={styles.roomCardHeader}>
            <View style={styles.roomCardTitleArea}>
              <Text style={[styles.roomCardTitle, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
              <Text style={[styles.roomCardSubtitle, { color: colors.textSecondary }]}>
                {room.memberCount} member{room.memberCount !== 1 ? 's' : ''} · {typeConfig.label}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                {isLive && (
                  <View style={styles.liveBadge}>
                    <LiveDot colors={colors} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                {room.deadline && (
                  <View style={[styles.tagBadge, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Text style={[styles.tagText, { color: '#F59E0B' }]}>Due soon</Text>
                  </View>
                )}
                {!room.isPublic && (
                  <View style={[styles.tagBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <FontAwesome5 name="lock" size={8} color="#EF4444" />
                    <Text style={[styles.tagText, { color: '#EF4444', marginLeft: 3 }]}>Private</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {isLive && (
              <View style={styles.statChip}>
                <FontAwesome5 name="clock" size={11} color={colors.textMuted} />
                <Text style={[styles.statChipText, { color: colors.textSecondary }]}>
                  {room.activeSession.participantCount} focusing now
                </Text>
              </View>
            )}
            {room.taskStats?.total > 0 && (
              <View style={styles.statChip}>
                <FontAwesome5 name="tasks" size={11} color={colors.textMuted} />
                <Text style={[styles.statChipText, { color: colors.textSecondary }]}>
                  {room.taskStats.done}/{room.taskStats.total} tasks done
                </Text>
              </View>
            )}
          </View>

          {/* Avatar stack + progress */}
          <View style={styles.roomCardFooter}>
            <View style={styles.avatarStack}>
              {room.memberAvatars?.slice(0, 4).map((m, i) => (
                <AvatarInitials
                  key={m.id}
                  name={m.name}
                  imgUrl={m.profileImage}
                  size={30}
                  fontSize={11}
                  bgColor={typeConfig.color}
                  textColor="#FFF"
                  style={[styles.stackedAvatar, { marginLeft: i > 0 ? -10 : 0, borderColor: colors.surface }]}
                />
              ))}
              {room.memberCount > 4 && (
                <View style={[styles.extraAvatar, { borderColor: colors.surface, backgroundColor: colors.surfaceBorder }]}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>+{room.memberCount - 4}</Text>
                </View>
              )}
            </View>
            {room.taskStats?.total > 0 && (
              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
                  <View style={[styles.progressFill, { width: `${taskPercent}%`, backgroundColor: room.bannerColor ?? typeConfig.color }]} />
                </View>
                <Text style={[styles.progressPct, { color: colors.textSecondary }]}>{taskPercent}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Full-bleed Right Image Area (Absolute to avoid layout stretch issues) */}
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, backgroundColor: room.bannerColor ?? typeConfig.color }}>
          <Image source={{ uri: getRoomAvatarUrl(room.emoji) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Discover Card ────────────────────────────────────────────────────────────
const DiscoverCard = ({ room, onJoin, joining, colors }) => {
  const typeConfig = ROOM_TYPES.find(t => t.key === room.type) ?? ROOM_TYPES[0];
  const isPrivate = !room.isPublic;
  return (
    <View style={[styles.discoverCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={{ flex: 1, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={[styles.discoverTitle, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
            {isPrivate ? (
              <View style={[styles.visibilityIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <FontAwesome5 name="lock" size={9} color="#EF4444" solid />
              </View>
            ) : (
              <View style={[styles.visibilityIcon, { backgroundColor: colors.primary + '18' }]}>
                <FontAwesome5 name="globe" size={9} color={colors.primary} />
              </View>
            )}
          </View>
          <Text style={[styles.discoverMeta, { color: colors.textMuted }]}>
            {room._count?.members ?? 0} members · {room.subject}
          </Text>
          {room.description && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }} numberOfLines={1}>{room.description}</Text>
          )}

          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity 
              style={[styles.joinBtn, { backgroundColor: colors.primary, flex: 1 }]} 
              onPress={onJoin} 
              disabled={joining}
            >
              {joining ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[styles.joinBtnText, { color: '#FFF' }]}>Join</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-bleed Right Image Area (Absolute) */}
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 110, backgroundColor: room.bannerColor ?? typeConfig.color }}>
          <Image source={{ uri: getRoomAvatarUrl(room.emoji) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
    </View>
  );
};

// ─── Create Room Modal ────────────────────────────────────────────────────────
const CreateRoomModal = ({ visible, onClose, onCreated, colors, isDarkMode }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'STUDY_GROUP', name: '', subject: '', description: '',
    emoji: MOCK_COVERS[0], bannerColor: BANNER_COLORS[0], isPublic: true,
    weeklyGoalSessions: '', deadline: '',
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Please enter a room name.');
    setLoading(true);
    try {
      const res = await roomsApi.createRoom({
        ...form,
        weeklyGoalSessions: form.weeklyGoalSessions ? parseInt(form.weeklyGoalSessions) : 0,
      });
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
        setStep(1);
        setForm({ type: 'STUDY_GROUP', name: '', subject: '', description: '', emoji: MOCK_COVERS[0], bannerColor: BANNER_COLORS[0], isPublic: true, weeklyGoalSessions: '', deadline: '' });
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error ?? 'Failed to create room');
    } finally { setLoading(false); }
  };

  const pickCustomImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        upd('emoji', `data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick image'); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[FONTS.h2, { color: colors.text }]}>
              {step === 1 ? '🏗️ Room Type' : step === 2 ? '✏️ Details' : '⚙️ Settings'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Step 1: Room Type */}
            {step === 1 && (
              <View style={{ gap: 12 }}>
                {ROOM_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeOption, form.type === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }, { borderColor: colors.surfaceBorder }]}
                    onPress={() => upd('type', t.key)}
                  >
                    <View style={[styles.typeIconWrap, { backgroundColor: t.color + '20' }]}>
                      <FontAwesome5 name={t.icon} size={20} color={t.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.typeLabel, { color: colors.text }]}>{t.label}</Text>
                    </View>
                    {form.type === t.key && <FontAwesome5 name="check-circle" size={18} color={t.color} solid />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 2: Name + Subject + Emoji */}
            {step === 2 && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Room Name *</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                    placeholder="e.g. DBMS Finals Prep"
                    placeholderTextColor={colors.textMuted}
                    value={form.name}
                    onChangeText={v => upd('name', v)}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject Tag</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                    placeholder="e.g. CSE, Maths, Physics"
                    placeholderTextColor={colors.textMuted}
                    value={form.subject}
                    onChangeText={v => upd('subject', v)}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder, height: 80 }]}
                    placeholder="What is this room for?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    value={form.description}
                    onChangeText={v => upd('description', v)}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Room Photo</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.emojiBtn, { borderColor: colors.surfaceBorder, padding: 0, overflow: 'hidden' }]}
                        onPress={pickCustomImage}
                      >
                        <FontAwesome5 name="camera" size={20} color={colors.textMuted} />
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>Custom</Text>
                      </TouchableOpacity>
                      {MOCK_COVERS.map(e => (
                        <TouchableOpacity
                          key={e}
                          style={[styles.emojiBtn, form.emoji === e && { borderColor: colors.primary, borderWidth: 2 }, { borderColor: colors.surfaceBorder, padding: 0, overflow: 'hidden' }]}
                          onPress={() => upd('emoji', e)}
                        >
                          <Image source={{ uri: e }} style={{ width: '100%', height: '100%' }} />
                        </TouchableOpacity>
                      ))}
                      {!MOCK_COVERS.includes(form.emoji) && isImageUrl(form.emoji) && (
                        <View style={[styles.emojiBtn, { borderColor: colors.primary, borderWidth: 2, padding: 0, overflow: 'hidden' }]}>
                           <Image source={{ uri: form.emoji }} style={{ width: '100%', height: '100%' }} />
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
                {/* Banner color */}
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Banner Color</Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    {BANNER_COLORS.map(c => (
                      <TouchableOpacity key={c} onPress={() => upd('bannerColor', c)}
                        style={[styles.colorBtn, { backgroundColor: c }, form.bannerColor === c && styles.colorBtnSelected]}>
                        {form.bannerColor === c && <FontAwesome5 name="check" size={12} color="#FFF" solid />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[styles.typeLabel, { color: colors.text }]}>Public Room</Text>
                    <Text style={[styles.discoverMeta, { color: colors.textMuted }]}>Anyone can discover and join</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, form.isPublic && { backgroundColor: '#10B981' }]}
                    onPress={() => upd('isPublic', !form.isPublic)}
                  >
                    <View style={[styles.toggleKnob, form.isPublic && { transform: [{ translateX: 20 }] }]} />
                  </TouchableOpacity>
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weekly Pomodoro Goal</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                    placeholder="e.g. 20 sessions/week"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={form.weeklyGoalSessions}
                    onChangeText={v => upd('weeklyGoalSessions', v)}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Deadline (optional)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={form.deadline}
                    onChangeText={v => upd('deadline', v)}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation buttons */}
          <View style={styles.modalFooter}>
            {step > 1 && (
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.surfaceBorder }]} onPress={() => setStep(s => s - 1)}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => setStep(s => s + 1)}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Create Room 🚀</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Join by Code Modal ───────────────────────────────────────────────────────
const JoinByCodeModal = ({ visible, onClose, onJoined, colors, isDarkMode }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await roomsApi.joinByCode(code.trim().toUpperCase());
      if (res.data.success) {
        onJoined();
        onClose();
        setCode('');
        Alert.alert('🎉 Joined!', `You've joined ${res.data.data.name}`);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error ?? 'Invalid invite code');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.joinCodeSheet, { backgroundColor: colors.surface }]}>
          <Text style={[FONTS.h2, { color: colors.text, marginBottom: 6 }]}>Enter Invite Code</Text>
          <Text style={[FONTS.body2, { color: colors.textMuted, marginBottom: 20 }]}>Ask a room admin for the 8-character code</Text>
          <TextInput
            style={[styles.codeInput, { color: colors.text, borderColor: colors.primary, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
            placeholder="e.g. A3F9B1C2"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            maxLength={8}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.surfaceBorder }]} onPress={onClose}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleJoin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Join Room</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RoomsScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const navigation = useNavigation();

  const [myRooms, setMyRooms] = useState([]);
  const [discoverRooms, setDiscoverRooms] = useState([]);
  const [streakInfo, setStreakInfo] = useState({ streak: 0, sessions: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(null);
  const [searchDiscover, setSearchDiscover] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = async () => {
    try {
      const [myRes, discRes, notifRes] = await Promise.all([
        roomsApi.getMyRooms(),
        roomsApi.discoverRooms(),
        notificationsApi.getAll().catch(() => null),
      ]);
      const rooms = myRes.data.data ?? [];
      setMyRooms(rooms);
      setDiscoverRooms(discRes.data.data ?? []);
      if (notifRes?.data?.data) setUnreadCount(notifRes.data.data.unreadCount ?? 0);

      // Compute overall streak from best room
      const bestStreak = rooms.reduce((max, r) => Math.max(max, r.streakCount ?? 0), 0);
      setStreakInfo({ streak: bestStreak, sessions: 0, tasks: 0 });
    } catch (e) {
      console.error('Failed to fetch rooms:', e.message);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    // Wait until auth session is restored before making API calls
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      // Not logged in — stop loading spinner
      setLoading(false);
    }
  }, [authLoading, user]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleJoinDiscover = async (room) => {
    if (joiningRoom) return;
    // Direct join if public, no code needed
    setJoiningRoom(room.id);
    try {
      const res = await roomsApi.joinByCode(room.inviteCode);
      if (res.data.success) {
        Alert.alert('🎉 Joined!', `Welcome to ${room.name}!`);
        fetchData();
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error ?? 'Could not join room');
    } finally { setJoiningRoom(null); }
  };

  const filteredDiscover = discoverRooms.filter(r => {
    const matchesSearch = !searchDiscover ||
      r.name.toLowerCase().includes(searchDiscover.toLowerCase()) ||
      r.subject?.toLowerCase().includes(searchDiscover.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.subject === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[FONTS.body2, { color: colors.textMuted, marginTop: 12 }]}>Loading Rooms…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16 }}>
          <Header rightAction={
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={() => setShowJoinCode(true)}
            >
              <FontAwesome5 name="link" size={15} color={colors.primary} />
            </TouchableOpacity>
          } />
        </View>

        {/* Streak Card */}
        {myRooms.length > 0 && (
          <LinearGradient
            colors={['#2D5016', '#4A7C24']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <Text style={styles.streakLabel}>Room streak</Text>
            <Text style={styles.streakValue}>{streakInfo.streak} days {streakInfo.streak > 0 ? '🔥' : '⭐'}</Text>
            <Text style={styles.streakSub}>Keep the streak going — open a room and study!</Text>
            <View style={styles.streakDots}>
              {Array(7).fill(0).map((_, i) => (
                <View key={i} style={[styles.streakDot, i < Math.min(7, streakInfo.streak) && styles.streakDotFilled]} />
              ))}
            </View>
          </LinearGradient>
        )}

        {/* Your Rooms */}
        {myRooms.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>YOUR ROOMS</Text>
            {myRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                colors={colors}
                isDarkMode={isDarkMode}
                onPress={() => navigation.navigate('RoomDetail', { roomId: room.id, roomName: room.name })}
              />
            ))}
          </View>
        )}

        {/* Discover Rooms */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DISCOVER ROOMS</Text>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <FontAwesome5 name="search" size={13} color={colors.textMuted} />
            <TextInput
              style={[{ flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 }]}
              placeholder="Search rooms, subjects…"
              placeholderTextColor={colors.textMuted}
              value={searchDiscover}
              onChangeText={setSearchDiscover}
            />
            {searchDiscover.length > 0 && (
              <TouchableOpacity onPress={() => setSearchDiscover('')}>
                <FontAwesome5 name="times" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              {CATEGORY_FILTERS.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategoryFilter(cat.key)}
                  style={[styles.categoryChip,
                    categoryFilter === cat.key
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }
                  ]}
                >
                  <Text style={[styles.categoryChipText, {
                    color: categoryFilter === cat.key ? '#FFF' : colors.textSecondary
                  }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filteredDiscover.length === 0 ? (
            <View style={[styles.emptyDiscover, { borderColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="compass" size={28} color={colors.textMuted} />
              <Text style={[FONTS.body2, { color: colors.textMuted, marginTop: 10, textAlign: 'center' }]}>
                {discoverRooms.length === 0
                  ? 'No public rooms yet.\nCreate the first one!'
                  : 'No rooms match your filter.'}
              </Text>
            </View>
          ) : (
            filteredDiscover.map(room => (
              <DiscoverCard
                key={room.id}
                room={room}
                colors={colors}
                joining={joiningRoom === room.id}
                onJoin={() => handleJoinDiscover(room)}
              />
            ))
          )}
        </View>

        {/* Empty state */}
        {myRooms.length === 0 && discoverRooms.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <FontAwesome5 name="users" size={36} color={colors.primary} />
            </View>
            <Text style={[FONTS.h3, { color: colors.text, marginTop: 20, textAlign: 'center' }]}>No Rooms Yet</Text>
            <Text style={[FONTS.body2, { color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }]}>
              Create a room and invite your study group.{"\n"}Together you'll go further.
            </Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 15 }}>Create Your First Room</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB — Create Room (fixed above tab bar) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <FontAwesome5 name="plus" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Modals */}
      <CreateRoomModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchData()}
        colors={colors}
        isDarkMode={isDarkMode}
      />
      <JoinByCodeModal
        visible={showJoinCode}
        onClose={() => setShowJoinCode(false)}
        onJoined={fetchData}
        colors={colors}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  pageTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  streakCard: { borderRadius: 20, padding: 20, marginBottom: 28 },
  streakLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  streakValue: { color: '#FFF', fontSize: 32, fontWeight: '800', marginBottom: 4 },
  streakSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 14 },
  streakDots: { flexDirection: 'row', gap: 6 },
  streakDot: { width: 28, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  streakDotFilled: { backgroundColor: 'rgba(255,255,255,0.85)' },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },

  roomCardWrap: { marginBottom: 14 },
  roomCard: { borderRadius: 16, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', padding: 0, paddingRight: 120 },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  roomCardTitleArea: { flex: 1 },
  roomCardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  roomCardSubtitle: { fontSize: 13, fontWeight: '500' },

  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  liveText: { fontSize: 9, fontWeight: '800', color: '#EF4444', marginLeft: 4, letterSpacing: 0.5 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statChipText: { fontSize: 12, fontWeight: '600' },

  roomCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackedAvatar: { borderWidth: 2 },
  extraAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginLeft: -10 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12, justifyContent: 'flex-end' },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '700', minWidth: 35, textAlign: 'right' },

  discoverCard: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 16, marginBottom: 12, borderWidth: 1, padding: 0, overflow: 'hidden', paddingRight: 110 },
  discoverTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  discoverMeta: { fontSize: 12 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 58, alignItems: 'center' },
  joinBtnText: { fontSize: 13, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, marginBottom: 12 },

  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  categoryChipText: { fontSize: 12, fontWeight: '700' },

  visibilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },

  emptyDiscover: { alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  createFirstBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },

  fab: {
    position: 'absolute',
    bottom: 90,  // above the bottom tab bar (tab bar ~60px + safe area)
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  visibilityIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  footerBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  typeOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5 },
  typeIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 15, fontWeight: '700' },

  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputField: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },

  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  colorBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorBtnSelected: { borderWidth: 3, borderColor: '#FFF' },

  toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: '#D1D5DB', justifyContent: 'center', paddingHorizontal: 3 },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3 },

  joinCodeSheet: { borderRadius: 24, margin: 24, padding: 24 },
  codeInput: { borderWidth: 2, borderRadius: 14, padding: 16, fontSize: 22, fontWeight: '800', letterSpacing: 4, textAlign: 'center' },
});

export default RoomsScreen;
