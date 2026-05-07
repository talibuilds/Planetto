import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import AvatarInitials from '../components/AvatarInitials';

// null img = show initials; string img = show photo
const TOP_PERFORMERS = [
  { id: 'p1', name: 'Talib Khan',    hrs: '48h', img: null },
  { id: 'p2', name: 'Mohit Sharma',  hrs: '42h', img: null },
  { id: 'p3', name: 'Muzammil Syed', hrs: '38h', img: null },
  { id: 'p4', name: 'Priya Mehta',   hrs: '31h', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 'p5', name: 'Arjun Kapoor',  hrs: '28h', img: 'https://randomuser.me/api/portraits/men/22.jpg' },
];


const PulseCircle = ({ colors }) => {
  const pulseAnim = new Animated.Value(1);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.pulse, { borderColor: colors.danger, transform: [{ scale: pulseAnim }] }]} />
  );
};

const RoomsScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { rooms, joinedRooms, toggleRoomJoin } = useData();
  
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleJoin = (room) => {
    const isJoining = !joinedRooms[room.id];
    toggleRoomJoin(room.id);
    if (isJoining) {
      Alert.alert('🎉 Joined Hub', `You've entered ${room.title}. Good luck!`);
    } else {
      Alert.alert('👋 Left Hub', `You've left ${room.title}.`);
    }
  };

  const RenderRoomCard = ({ room }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedRoom(room)} style={{ marginBottom: 24 }}>
      <GlassCard padding={0} style={styles.roomCard}>
        <View style={styles.imageContainer}>
          <Image source={room.image} style={styles.roomImage} />
          <View style={styles.badgeTopContainer}>
            {room.live ? (
              <View style={[styles.liveBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <PulseCircle colors={colors} />
                <View style={[styles.liveIndicator, { backgroundColor: colors.danger }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : (
              <View style={[styles.tagBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Text style={styles.tagText}>SCHEDULED</Text>
              </View>
            )}
            <View style={[styles.subjectBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={[styles.subjectText, { color: colors.primary }]}>{room.subject}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{room.title}</Text>
          <Text style={[styles.descText, { color: colors.textMuted }]} numberOfLines={2}>{room.desc}</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder, borderBottomWidth: 1 }]}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="headphones" size={12} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{room.ambience}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="bolt" size={12} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{room.intensity}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.participants}>
              {room.participants?.map((p, i) => (
                <Image key={i} source={{ uri: p.img }} style={[styles.avatar, { marginLeft: i > 0 ? -12 : 0, borderColor: colors.surface }]} />
              ))}
              <Text style={[styles.countText, { color: colors.textSecondary }]}>+{room.count} Students</Text>
            </View>

            <TouchableOpacity 
              onPress={() => handleJoin(room)}
              style={[styles.joinBtn, { backgroundColor: joinedRooms[room.id] ? colors.primary : colors.background, borderColor: joinedRooms[room.id] ? colors.primary : colors.surfaceBorder }]}
            >
              <Text style={[styles.joinBtnText, { color: joinedRooms[room.id] ? '#FFF' : colors.text }]}>
                {joinedRooms[room.id] ? "LEAVE" : "JOIN"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const joinedRoomsList = rooms.filter(room => joinedRooms[room.id]);
  const availableRoomsList = rooms.filter(room => !joinedRooms[room.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.headerText}>
          <Text style={[styles.superTitle, { color: colors.primary }]}>PLANETARY NETWORK</Text>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Collaborative Hubs</Text>
        </View>

        {/* Top Performers Section */}
        <View style={{ marginBottom: 35 }}>
          <Text style={[FONTS.h3, { color: colors.text, marginBottom: 15 }]}>Top Performers</Text>
          <View style={{ gap: 12 }}>
            {TOP_PERFORMERS.map((p, index) => (
              <GlassCard key={p.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                <Text style={{ width: 28, ...FONTS.subtitle, fontSize: 12, color: colors.primary }}>#{index + 1}</Text>
                <AvatarInitials
                  name={p.name}
                  imgUrl={p.img}
                  size={40}
                  fontSize={14}
                  bgColor={colors.primary}
                  textColor="#FFF"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[FONTS.h4, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                </View>
                <Text style={[FONTS.body2, { color: colors.textSecondary }]}>{p.hrs} studied</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Your Hubs Section */}
        {joinedRoomsList.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[FONTS.h3, { color: colors.text, marginBottom: 15 }]}>Your Hubs</Text>
            {joinedRoomsList.map(room => <RenderRoomCard key={room.id} room={room} />)}
          </View>
        )}

        {/* Available Hubs Section */}
        {availableRoomsList.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[FONTS.h3, { color: colors.text, marginBottom: 15 }]}>Available Hubs</Text>
            {availableRoomsList.map(room => <RenderRoomCard key={room.id} room={room} />)}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Room Details Modal */}
      {selectedRoom && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(11,14,23,0.92)' : 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <GlassCard style={{ width: '100%' }} padding={25}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={[FONTS.h2, { color: colors.text, marginBottom: 5 }]}>{selectedRoom.title}</Text>
                <Text style={[FONTS.subtitle, { color: colors.primary }]}>{selectedRoom.subject}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRoom(null)}>
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[FONTS.body1, { color: colors.textSecondary, marginBottom: 20, lineHeight: 22 }]}>{selectedRoom.desc}</Text>

            <View style={{ gap: 12, marginBottom: 25 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="user-tie" size={14} color={colors.textMuted} style={{ width: 20 }} />
                <Text style={[FONTS.body2, { color: colors.text }]}>Owner: {selectedRoom.owner}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="calendar-alt" size={14} color={colors.textMuted} style={{ width: 20 }} />
                <Text style={[FONTS.body2, { color: colors.text }]}>Date: {selectedRoom.date}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="headphones" size={14} color={colors.textMuted} style={{ width: 20 }} />
                <Text style={[FONTS.body2, { color: colors.text }]}>Ambience: {selectedRoom.ambience}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="bolt" size={14} color={colors.textMuted} style={{ width: 20 }} />
                <Text style={[FONTS.body2, { color: colors.text }]}>Intensity: {selectedRoom.intensity}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: joinedRooms[selectedRoom.id] ? colors.surfaceBorder : colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => { handleJoin(selectedRoom); setSelectedRoom(null); }}
            >
              <Text style={[FONTS.h3, { color: joinedRooms[selectedRoom.id] ? colors.text : '#FFF' }]}>
                {joinedRooms[selectedRoom.id] ? "Leave Hub" : "Join Hub Now"}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  headerText: { marginBottom: 30, marginTop: 10 },
  superTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  mainTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },

  roomCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeTopContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulse: {
    position: 'absolute',
    left: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subjectText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  contentContainer: {
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  descText: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participants: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  countText: { fontSize: 12, fontWeight: '700', marginLeft: 10 },
  
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default RoomsScreen;
