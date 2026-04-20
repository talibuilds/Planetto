import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { FONTS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', icon: 'fire', title: '14-Day Streak!', body: 'You hit a new personal best streak. Keep it up!', time: '2m ago', read: false, color: '#FF6B35' },
  { id: 'n2', icon: 'bolt', title: '+30 XP Earned', body: 'You completed a 25-min focus session.', time: '18m ago', read: false, color: '#FFD700' },
  { id: 'n3', icon: 'user-friends', title: 'Elena joined your room', body: 'Elena V. joined "Deep Work Zone".', time: '1h ago', read: false, color: '#6E48F2' },
  { id: 'n4', icon: 'calendar-check', title: 'Task Due Soon', body: '"Quantum Physics Review" is due in 4 hours.', time: '2h ago', read: true, color: '#18FFFF' },
  { id: 'n5', icon: 'brain', title: 'Smart Flow Tip', body: 'Your peak hours are 8–10 AM. Schedule hard tasks then!', time: '5h ago', read: true, color: '#A480FF' },
];

const Header = ({ rightAction }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setNotifications([]);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={[FONTS.h3, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }]}>Planetto</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {rightAction && <View style={{ marginRight: 20 }}>{rightAction}</View>}

          {/* Theme Toggle */}
          <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 20 }}>
            <FontAwesome5 name={isDarkMode ? 'sun' : 'moon'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity onPress={() => setNotifOpen(true)} style={{ position: 'relative' }}>
            <FontAwesome5 name="bell" size={20} color={colors.accent} solid />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      <Modal visible={isNotifOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotifOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.notifPanel, {
              backgroundColor: isDarkMode ? '#151928' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
              shadowColor: colors.primary,
            }]}
          >
            {/* Panel Header */}
            <View style={styles.panelHeader}>
              <View>
                <Text style={[FONTS.h2, { fontSize: 18, color: colors.text }]}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={[FONTS.body2, { color: colors.textMuted, fontSize: 11, marginTop: 2 }]}>
                    {unreadCount} unread
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead}>
                    <Text style={[FONTS.subtitle, { color: colors.primary, fontSize: 9 }]}>MARK ALL READ</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={clearAll}>
                  <FontAwesome5 name="trash-alt" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            {/* Notification List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="bell-slash" size={28} color={colors.textMuted} />
                  <Text style={[FONTS.body2, { color: colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
                    You're all caught up!
                  </Text>
                </View>
              ) : (
                notifications.map((n, i) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => markRead(n.id)}
                    style={[
                      styles.notifItem,
                      !n.read && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                      i < notifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
                    ]}
                  >
                    <View style={[styles.notifIconWrap, { backgroundColor: `${n.color}22` }]}>
                      <FontAwesome5 name={n.icon} size={14} color={n.color} solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[FONTS.h3, { fontSize: 13, color: colors.text }]}>{n.title}</Text>
                        <Text style={[FONTS.body2, { fontSize: 10, color: colors.textMuted }]}>{n.time}</Text>
                      </View>
                      <Text style={[FONTS.body2, { fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 16 }]}>{n.body}</Text>
                    </View>
                    {!n.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: SIZES.padding,
  },
  notifPanel: {
    width: 320,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  divider: { height: 1, marginHorizontal: 0 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    gap: 12,
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default memo(Header);
