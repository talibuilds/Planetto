import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import AvatarInitials from '../components/AvatarInitials';
import { adminApi } from '../api/rooms';

const ADMIN_TABS = ['Overview', 'Rooms', 'Users'];

// ─── Stat Card (green-themed) ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: accent + '22' }]}>
        <FontAwesome5 name={icon} size={16} color={accent} solid />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value ?? 0}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

// ─── Room Row ─────────────────────────────────────────────────────────────────
const RoomRow = ({ room, onToggle, onDelete, onExpand, expanded, detail, loadingDetail, colors }) => {
  const isEnabled = room.isEnabled !== false;

  return (
    <View style={[styles.adminCard, { backgroundColor: colors.surface, borderColor: isEnabled ? colors.surfaceBorder : '#FEE2E2' }]}>
      {/* Header */}
      <TouchableOpacity style={styles.adminCardHeader} onPress={() => onExpand(room)}>
        <View style={[styles.roomTypeBar, { backgroundColor: colors.primary + '22' }]}>
          <FontAwesome5 name="door-open" size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
            {!isEnabled && (
              <View style={styles.disabledBadge}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#EF4444' }}>DISABLED</Text>
              </View>
            )}
            {!room.isPublic && (
              <View style={[styles.privateBadge, { backgroundColor: colors.surfaceBorder }]}>
                <FontAwesome5 name="lock" size={8} color={colors.textMuted} />
                <Text style={{ fontSize: 8, fontWeight: '700', color: colors.textMuted, marginLeft: 3 }}>PRIVATE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
            {room._count?.members ?? 0} members · {room._count?.messages ?? 0} msgs · {room.subject}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.textMuted} />
          <Text style={{ fontSize: 9, color: colors.textMuted }}>Admin: {room.admin?.name?.split(' ')[0]}</Text>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={[styles.adminActions, { borderTopColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isEnabled ? '#FEF3C7' : '#D1FAE5' }]}
          onPress={() => onToggle(room)}
        >
          <FontAwesome5 name={isEnabled ? 'pause-circle' : 'play-circle'} size={12} color={isEnabled ? '#F59E0B' : '#10B981'} solid />
          <Text style={{ fontSize: 11, fontWeight: '700', color: isEnabled ? '#F59E0B' : '#10B981', marginLeft: 5 }}>
            {isEnabled ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
          onPress={() => onDelete(room)}
        >
          <FontAwesome5 name="trash-alt" size={12} color="#EF4444" solid />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', marginLeft: 5 }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={[styles.expandPanel, { borderTopColor: colors.surfaceBorder }]}>
          {loadingDetail ? (
            <ActivityIndicator color={colors.primary} style={{ margin: 12 }} />
          ) : detail ? (
            <>
              <Text style={[styles.expandLabel, { color: colors.textSecondary }]}>Members ({detail.members?.length ?? 0})</Text>
              {detail.members?.slice(0, 6).map(m => (
                <View key={m.id} style={styles.memberMini}>
                  <AvatarInitials name={m.user?.name} size={24} fontSize={9} bgColor={colors.primary} textColor="#FFF" />
                  <Text style={{ fontSize: 12, color: colors.text, marginLeft: 8, flex: 1 }}>{m.user?.name}</Text>
                  <View style={[styles.rolePill, { backgroundColor: m.role === 'ADMIN' ? '#FEF3C7' : colors.surfaceBorder }]}>
                    <Text style={{ fontSize: 8, fontWeight: '800', color: m.role === 'ADMIN' ? '#F59E0B' : colors.textMuted }}>{m.role}</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.expandLabel, { color: colors.textSecondary, marginTop: 10 }]}>Recent Chat</Text>
              {detail.messages?.filter(m => m.type !== 'SYSTEM').slice(0, 3).map(m => (
                <Text key={m.id} style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>
                  <Text style={{ fontWeight: '700', color: colors.textSecondary }}>{m.sender?.name}: </Text>{m.content}
                </Text>
              ))}
              {(detail.messages?.filter(m => m.type !== 'SYSTEM').length ?? 0) === 0 && (
                <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>No messages yet</Text>
              )}
              <Text style={[styles.expandLabel, { color: colors.textSecondary, marginTop: 10 }]}>Tasks ({detail.tasks?.length ?? 0})</Text>
              {detail.tasks?.slice(0, 3).map(t => (
                <Text key={t.id} style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                  [{t.status}] {t.title}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminPanelScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchRoom, setSearchRoom] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchAll = async () => {
    try {
      const [sRes, rRes, uRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAllRooms(),
        adminApi.getAllUsers(),
      ]);
      setStats(sRes.data.data);
      setRooms(rRes.data.data ?? []);
      setUsers(uRes.data.data ?? []);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error ?? 'Failed to load admin data');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleExpand = async (room) => {
    if (expandedRoom === room.id) { setExpandedRoom(null); setRoomDetail(null); return; }
    setExpandedRoom(room.id);
    setRoomDetail(null);
    setLoadingDetail(true);
    try {
      const res = await adminApi.getRoomDetail(room.id);
      setRoomDetail(res.data.data);
    } catch (e) { } finally { setLoadingDetail(false); }
  };

  const handleToggle = async (room) => {
    const action = room.isEnabled !== false ? 'disable' : 'enable';
    Alert.alert(
      `${action === 'disable' ? 'Disable' : 'Enable'} Room`,
      `${action === 'disable' ? 'Members will not be able to access' : 'Members will regain access to'} "${room.name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action === 'disable' ? 'Disable' : 'Enable', onPress: async () => {
          try {
            const res = await adminApi.toggleRoomEnabled(room.id);
            setRooms(prev => prev.map(r => r.id === room.id ? { ...r, isEnabled: res.data.data.isEnabled } : r));
          } catch (e) { Alert.alert('Error', 'Failed to toggle room'); }
        }},
      ]
    );
  };

  const handleDelete = (room) => {
    Alert.alert('Delete Room', `Permanently delete "${room.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteRoom(room.id);
          setRooms(p => p.filter(r => r.id !== room.id));
          if (expandedRoom === room.id) { setExpandedRoom(null); setRoomDetail(null); }
        } catch (e) { Alert.alert('Error', e.response?.data?.error ?? 'Failed'); }
      }},
    ]);
  };

  const handleDeleteUser = (u) => {
    Alert.alert('Delete User', `Delete ${u.name ?? u.email}? All their data will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteUser(u.id);
          setUsers(p => p.filter(x => x.id !== u.id));
        } catch (e) { Alert.alert('Error', e.response?.data?.error ?? 'Failed'); }
      }},
    ]);
  };

  const handleSeed = async () => {
    Alert.alert('Seed Sample Rooms', 'Create sample study rooms for demonstration?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Seed', onPress: async () => {
        setSeeding(true);
        try {
          await adminApi.seedRooms();
          Alert.alert('Done', 'Sample rooms created!');
          fetchAll();
        } catch (e) { Alert.alert('Error', e.response?.data?.error ?? 'Failed to seed rooms'); } finally { setSeeding(false); }
      }},
    ]);
  };

  const filteredRooms = rooms.filter(r => !searchRoom ||
    r.name?.toLowerCase().includes(searchRoom.toLowerCase()) ||
    r.subject?.toLowerCase().includes(searchRoom.toLowerCase())
  );
  const filteredUsers = users.filter(u => !searchUser ||
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[FONTS.body2, { color: colors.textMuted, marginTop: 12 }]}>Loading Admin Data…</Text>
      </SafeAreaView>
    );
  }

  const enabledRooms = rooms.filter(r => r.isEnabled !== false).length;
  const disabledRooms = rooms.length - enabledRooms;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header — green-themed */}
      <LinearGradient
        colors={isDarkMode ? ['#0B2210', '#0F2D15'] : ['#1B4332', '#2D5A3C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.adminHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <FontAwesome5 name="arrow-left" size={18} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <FontAwesome5 name="user-shield" size={16} color="#4ADE80" solid />
            <Text style={styles.adminTitle}>Admin Panel</Text>
          </View>
          <Text style={styles.adminSubtitle}>Planetto Control Centre</Text>
        </View>
        <View style={styles.adminBadge}>
          <FontAwesome5 name="shield-alt" size={10} color="#4ADE80" solid />
          <Text style={{ fontSize: 9, color: '#4ADE80', fontWeight: '800', marginLeft: 4 }}>ADMIN</Text>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {ADMIN_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textMuted }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <View>
            {/* Stats grid */}
            <View style={[styles.statsSection, { backgroundColor: isDarkMode ? 'rgba(74,222,128,0.04)' : 'rgba(45,90,60,0.03)' }]}>
              <View style={styles.statsGrid}>
                <StatCard icon="users" label="Total Users" value={stats?.totalUsers} accent={colors.primary} />
                <StatCard icon="door-open" label="Total Rooms" value={stats?.totalRooms} accent="#6366F1" />
                <StatCard icon="broadcast-tower" label="Live Sessions" value={stats?.activeRooms} accent="#EF4444" />
                <StatCard icon="comments" label="Msgs Today" value={stats?.todayMessages} accent="#F59E0B" />
                <StatCard icon="stopwatch" label="All Sessions" value={stats?.totalSessions} accent="#8B5CF6" />
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* Room health row */}
              <View style={[styles.healthCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Room Health</Text>
                <View style={styles.healthRow}>
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthNum, { color: colors.primary }]}>{enabledRooms}</Text>
                    <Text style={[styles.healthLabel, { color: colors.textMuted }]}>Active</Text>
                  </View>
                  <View style={[styles.healthDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthNum, { color: '#EF4444' }]}>{disabledRooms}</Text>
                    <Text style={[styles.healthLabel, { color: colors.textMuted }]}>Disabled</Text>
                  </View>
                  <View style={[styles.healthDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthNum, { color: colors.text }]}>{stats?.totalRooms ? (stats.totalSessions / stats.totalRooms).toFixed(1) : '—'}</Text>
                    <Text style={[styles.healthLabel, { color: colors.textMuted }]}>Sess/Room</Text>
                  </View>
                </View>
              </View>

              {/* Seed Button */}
              <TouchableOpacity
                style={[styles.seedBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={handleSeed}
                disabled={seeding}
              >
                {seeding ? <ActivityIndicator size="small" color={colors.primary} /> : (
                  <>
                    <FontAwesome5 name="seedling" size={13} color={colors.primary} solid />
                    <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 8, fontSize: 13 }}>Seed Sample Rooms</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Recent rooms summary */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20, marginBottom: 12 }]}>Recent Rooms</Text>
              {rooms.slice(0, 5).map(r => (
                <View key={r.id} style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <View style={[styles.summaryDot, { backgroundColor: r.isEnabled !== false ? colors.primary : '#EF4444' }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[{ fontSize: 14, fontWeight: '700', color: colors.text }]} numberOfLines={1}>{r.name}</Text>
                    <Text style={[{ fontSize: 11, color: colors.textMuted }]}>{r._count?.members ?? 0} members · {r.subject}</Text>
                  </View>
                  <View style={[styles.typePill, { backgroundColor: r.isPublic ? colors.primary + '20' : colors.surfaceBorder }]}>
                    <FontAwesome5 name={r.isPublic ? 'globe' : 'lock'} size={8} color={r.isPublic ? colors.primary : colors.textMuted} />
                    <Text style={{ fontSize: 8, fontWeight: '700', color: r.isPublic ? colors.primary : colors.textMuted, marginLeft: 3 }}>
                      {r.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Rooms Tab ── */}
        {activeTab === 'Rooms' && (
          <View style={{ padding: 16 }}>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="search" size={13} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 }}
                placeholder="Search rooms…"
                placeholderTextColor={colors.textMuted}
                value={searchRoom}
                onChangeText={setSearchRoom}
              />
              <TouchableOpacity onPress={handleSeed} disabled={seeding} style={{ marginLeft: 8 }}>
                {seeding
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <FontAwesome5 name="seedling" size={14} color={colors.primary} />}
              </TouchableOpacity>
            </View>
            <Text style={[{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }]}>
              {filteredRooms.length} rooms · {enabledRooms} active · {disabledRooms} disabled
            </Text>
            {filteredRooms.map(r => (
              <RoomRow
                key={r.id}
                room={r}
                colors={colors}
                expanded={expandedRoom === r.id}
                detail={expandedRoom === r.id ? roomDetail : null}
                loadingDetail={loadingDetail && expandedRoom === r.id}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onExpand={handleExpand}
              />
            ))}
            {filteredRooms.length === 0 && (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <FontAwesome5 name="door-open" size={40} color={colors.textMuted} />
                <Text style={[{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }]}>No rooms found</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'Users' && (
          <View style={{ padding: 16 }}>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <FontAwesome5 name="search" size={13} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 }}
                placeholder="Search users…"
                placeholderTextColor={colors.textMuted}
                value={searchUser}
                onChangeText={setSearchUser}
              />
            </View>
            <Text style={[{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }]}>{filteredUsers.length} users</Text>
            {filteredUsers.map(u => (
              <View key={u.id} style={[styles.userRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <AvatarInitials name={u.name ?? u.email} size={42} fontSize={14} bgColor={colors.primary} textColor={colors.background} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{u.name ?? '—'}</Text>
                    {u.isAdmin && (
                      <View style={[styles.adminBadge, { flexDirection: 'row', alignItems: 'center' }]}>
                        <FontAwesome5 name="shield-alt" size={7} color="#4ADE80" solid />
                        <Text style={{ fontSize: 8, color: '#4ADE80', fontWeight: '800', marginLeft: 3 }}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[{ fontSize: 11, color: colors.textMuted }]}>{u.email}</Text>
                  <Text style={[{ fontSize: 10, color: colors.textMuted, marginTop: 2 }]}>
                    {u._count?.roomMemberships ?? 0} rooms · {u._count?.tasks ?? 0} tasks · {u._count?.focusSessions ?? 0} sessions
                  </Text>
                </View>
                {!u.isAdmin && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(u)}>
                    <FontAwesome5 name="trash-alt" size={12} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminPanelScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  adminHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 18,
  },
  adminTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  adminSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },

  statsSection: { paddingVertical: 16, paddingHorizontal: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 8 },
  statCard: {
    flex: 1, minWidth: '28%', borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  healthCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthItem: { flex: 1, alignItems: 'center' },
  healthNum: { fontSize: 28, fontWeight: '900' },
  healthLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  healthDivider: { width: 1, height: 40 },

  seedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 4,
  },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 14, marginBottom: 8, borderWidth: 1,
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  typePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, marginBottom: 8,
  },

  adminCard: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  adminCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  roomTypeBar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardMeta: { fontSize: 11, marginTop: 2 },
  disabledBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  privateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  adminActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 0.5 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10 },

  expandPanel: { padding: 14, borderTopWidth: 1 },
  expandLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  memberMini: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  userRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, marginBottom: 10, borderWidth: 1,
  },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
});
