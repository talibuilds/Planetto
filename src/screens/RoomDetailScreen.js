import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch,
  FlatList, Alert, ActivityIndicator, Modal, RefreshControl, KeyboardAvoidingView, Platform, Image, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AvatarInitials from '../components/AvatarInitials';
import Header from '../components/Header';
import { roomsApi } from '../api/rooms';


const TASK_COLS = ['TODO', 'IN_PROGRESS', 'DONE'];
const TASK_COL_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const TASK_COL_COLORS = { TODO: '#6366F1', IN_PROGRESS: '#F59E0B', DONE: '#10B981' };

const MOCK_COVERS = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop', // Study Group
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop', // Class Room
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop', // Project
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop', // Productivity
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop', // Fun / Gaming
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const secondsLeft = (startedAt, durationMinutes) => {
  const end = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
};

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
const ChatTab = ({ roomId, myId, colors, isDarkMode, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const flatRef = useRef();
  const pollRef = useRef();

  // Helper: open a file from a data URI (base64) by saving to temp and opening
  const openFile = async (mediaUrl, fileName) => {
    try {
      if (!mediaUrl) return Alert.alert('Not Found', 'This file is no longer available.');
      if (mediaUrl.startsWith('data:')) {
        // Extract base64 content and extension
        const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return Alert.alert('Error', 'Invalid file data.');
        const [, mimeType, base64Data] = match;
        const safeName = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const tempPath = `${FileSystem.cacheDirectory}${safeName}`;
        await FileSystem.writeAsStringAsync(tempPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Use Sharing to open the file with the device's native viewer
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempPath, { mimeType });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device.');
        }
      } else if (mediaUrl.startsWith('http')) {
        Linking.openURL(mediaUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file (unsupported format).');
      }
    } catch (e) {
      console.error('openFile error:', e);
      Alert.alert('Error', 'Failed to open this file.');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await roomsApi.getMessages(roomId);
      if (res.data.success) {
        setMessages([...(res.data.data ?? [])].reverse());
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000); // poll every 3s
    return () => clearInterval(pollRef.current);
  }, [roomId]);

  const send = async (contentOverride = null, type = 'TEXT', mediaUrl = null) => {
    const finalContent = contentOverride ?? text.trim();
    if (!finalContent && !mediaUrl) return;
    setSending(true);
    if (!contentOverride) setText('');
    try {
      await roomsApi.sendMessage(roomId, finalContent || (type === 'IMAGE' ? 'Sent an image' : 'Sent a file'), type, replyTo?.id, mediaUrl);
      setReplyTo(null);
      await fetchMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
      if (!contentOverride) setText(finalContent);
    } finally { setSending(false); }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await send('Image attached', 'IMAGE', base64Uri);
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick image'); }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        // Limit file size to 5 MB
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          return Alert.alert('File Too Large', 'Please select a file smaller than 5 MB.');
        }
        // Read file as base64 so it can be stored in the database
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Determine MIME type from extension
        const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'bin';
        const mimeMap = {
          pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          txt: 'text/plain', zip: 'application/zip', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
          mp4: 'video/mp4', mp3: 'audio/mpeg',
        };
        const mime = mimeMap[ext] || 'application/octet-stream';
        const dataUri = `data:${mime};base64,${base64}`;
        await send(`📄 ${file.name}`, 'FILE', dataUri);
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick file'); }
  };


  const handlePin = async (msgId) => {
    try {
      await roomsApi.pinMessage(roomId, msgId);
      await fetchMessages();
    } catch (e) { Alert.alert('Error', 'Failed to pin message'); }
  };

  const renderMsg = ({ item }) => {
    const isMe = item.sender?.id === myId;
    const isSystem = item.type === 'SYSTEM';
    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={[styles.systemMsgText, { color: colors.textMuted }]}>{item.content}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <AvatarInitials name={item.sender?.name} size={28} fontSize={10} bgColor={colors.primary} textColor="#FFF" style={{ marginRight: 8, flexShrink: 0 }} />
        )}
        <View style={{ maxWidth: '72%' }}>
          {!isMe && <Text style={[styles.msgSender, { color: colors.textMuted }]}>{item.sender?.name}</Text>}
          {item.isPinned && (
            <View style={styles.pinnedBadge}>
              <FontAwesome5 name="thumbtack" size={9} color="#F59E0B" solid />
              <Text style={{ fontSize: 9, color: '#F59E0B', marginLeft: 3 }}>Pinned</Text>
            </View>
          )}
          {item.parent && (
            <View style={[styles.replyQuote, { backgroundColor: colors.surfaceBorder }]}>
              <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{item.parent?.content}</Text>
            </View>
          )}
          <View style={[styles.bubble, isMe ? { backgroundColor: colors.primary } : { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            {(() => {
              const isImg = item.type === 'IMAGE' || (item.type === 'FILE' && item.content.match(/\.(jpeg|jpg|gif|png|webp)$/i));
              if (isImg) {
                return (
                  <TouchableOpacity onPress={() => item.mediaUrl ? setPreviewImage(item.mediaUrl) : Alert.alert('Not Found', 'This image is no longer available on the server.')}>
                    {item.mediaUrl ? (
                      <Image source={{ uri: item.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <FontAwesome5 name="image" size={32} color={colors.textMuted} />
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 8, textAlign: 'center', paddingHorizontal: 4 }} numberOfLines={2}>
                          {item.content.replace('📄 ', '') || 'Image Unavailable'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }
              if (item.type === 'FILE') {
                const cleanName = (item.content || '').replace('📄 ', '') || 'Download File';
                return (
                  <TouchableOpacity 
                    onPress={() => openFile(item.mediaUrl, cleanName)} 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.surfaceBorder, padding: 8, borderRadius: 8, marginBottom: item.content ? 8 : 0 }}
                  >
                    <FontAwesome5 name="file-download" size={16} color={isMe ? '#FFF' : colors.primary} />
                    <Text style={{ marginLeft: 8, color: isMe ? '#FFF' : colors.text, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
                      {cleanName}
                    </Text>
                  </TouchableOpacity>
                );
              }
              return null;
            })()}
            {item.type === 'TEXT' && (
              <Text style={{ color: isMe ? '#FFF' : colors.text, fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
            )}
          </View>
          <View style={[styles.msgMeta, isMe && { justifyContent: 'flex-end' }]}>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>{formatTime(item.createdAt)}</Text>
            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setReplyTo(item)}>
              <FontAwesome5 name="reply" size={10} color={colors.textMuted} />
            </TouchableOpacity>
            {isAdmin && !item.isPinned && (
              <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handlePin(item.id)}>
                <FontAwesome5 name="thumbtack" size={10} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMsg}
        contentContainerStyle={{ padding: 16, paddingBottom: 4 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />
      {replyTo && (
        <View style={[styles.replyBar, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <FontAwesome5 name="reply" size={12} color={colors.primary} />
          <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>{replyTo.content}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <FontAwesome5 name="times" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.chatInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={pickDocument} style={styles.attachBtn}>
          <FontAwesome5 name="paperclip" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
          <FontAwesome5 name="image" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={[{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 8, marginHorizontal: 8 }]}
          placeholder="Message…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity onPress={() => send()} disabled={sending || !text.trim()} style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.surfaceBorder }]}>
          {sending ? <ActivityIndicator size="small" color="#FFF" /> : <FontAwesome5 name="paper-plane" size={14} color="#FFF" solid />}
        </TouchableOpacity>
      </View>

      {/* Fullscreen Image Preview */}
      <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 }}>
            <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <FontAwesome5 name="times" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openFile(previewImage, 'image.jpg')} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <FontAwesome5 name="download" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
const TasksTab = ({ roomId, colors, isDarkMode, members, isAdmin, myId }) => {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeIds: [], priority: 'MED', dueDate: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await roomsApi.getTasks(roomId);
      if (res.data.success) {
        const d = res.data.data;
        setTasks({ todo: d.todo ?? [], inProgress: d.inProgress ?? [], done: d.done ?? [] });
      }
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const moveTask = async (task, newStatus) => {
    const isAssigned = task.assigneeIds?.includes(myId) || task.assignee === myId;
    if (!isAdmin && !isAssigned) {
      return Alert.alert('Permission Denied', 'Only room admins or assigned users can update this task.');
    }
    try {
      await roomsApi.updateTask(roomId, task.id, { status: newStatus });
      fetchTasks();
    } catch (e) { Alert.alert('Error', 'Failed to update task'); }
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return Alert.alert('Required', 'Please enter a task title.');
    try {
      await roomsApi.createTask(roomId, {
        title: newTask.title,
        description: newTask.description || undefined,
        assigneeIds: newTask.assigneeIds,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      });
      setShowCreate(false);
      setNewTask({ title: '', description: '', assigneeIds: [], priority: 'MED', dueDate: null });
      fetchTasks();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error ?? 'Failed to create task');
    }
  };

  const TaskCard = ({ task, col }) => (
    <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={[styles.taskTitle, { color: colors.text, flex: 1 }]}>{task.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: task.priority === 'HIGH' ? '#FEE2E2' : task.priority === 'LOW' ? '#D1FAE5' : '#FEF3C7' }]}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: task.priority === 'HIGH' ? '#EF4444' : task.priority === 'LOW' ? '#10B981' : '#F59E0B' }}>{task.priority}</Text>
        </View>
      </View>
      {task.description && <Text style={[styles.taskDesc, { color: colors.textMuted }]} numberOfLines={2}>{task.description}</Text>}
      {/* Show all assignees (from assigneeIds matched to members, or fallback to single assignee) */}
      {(() => {
        const assigneeList = task.assigneeIds?.length > 0
          ? task.assigneeIds.map(uid => members.find(m => (m.userId ?? m.id) === uid)?.user ?? { id: uid, name: '?' })
          : task.assignee ? [task.assignee] : [];
        if (assigneeList.length === 0) return null;
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            {assigneeList.slice(0, 3).map((a, i) => (
              <AvatarInitials key={a.id ?? i} name={a.name} imgUrl={a.profileImage} size={22} fontSize={8} bgColor={colors.primary} textColor="#FFF" style={{ marginLeft: i > 0 ? -6 : 0, borderWidth: 1.5, borderColor: colors.surface }} />
            ))}
            <Text style={[styles.taskAssignee, { color: colors.textSecondary }]}>
              {assigneeList[0]?.name?.split(' ')[0]}{assigneeList.length > 1 ? ` +${assigneeList.length - 1}` : ''}
            </Text>
          </View>
        );
      })()}
      {task.dueDate && (
        <Text style={[{ fontSize: 10, color: colors.textMuted, marginTop: 4 }]}>📅 {formatDate(task.dueDate)}</Text>
      )}
      {/* Move buttons */}
      {(isAdmin || task.assigneeIds?.includes(myId) || task.assignee === myId) && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          {TASK_COLS.filter(c => c !== col).map(c => (
            <TouchableOpacity key={c} style={[styles.moveBtn, { borderColor: TASK_COL_COLORS[c] }]} onPress={() => moveTask(task, c)}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: TASK_COL_COLORS[c] }}>→ {TASK_COL_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      {/* Only admin can create tasks */}
      {isAdmin && (
        <TouchableOpacity style={[styles.addTaskBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <FontAwesome5 name="plus" size={13} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Add Task</Text>
        </TouchableOpacity>
      )}
      {!isAdmin && (
        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 12, borderRadius: 12, backgroundColor: colors.surface + '80', borderWidth: 1, borderColor: colors.surfaceBorder }}>
          <FontAwesome5 name="info-circle" size={12} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>Only the room admin can create tasks</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'column', gap: 16, padding: 16 }}>
          
          {/* Project Progress Bar */}
          <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Project Progress</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                {tasks.todo.length + tasks.inProgress.length + tasks.done.length > 0 
                  ? Math.round((tasks.done.length / (tasks.todo.length + tasks.inProgress.length + tasks.done.length)) * 100) 
                  : 0}%
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.surfaceBorder, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: colors.primary, 
                width: `${tasks.todo.length + tasks.inProgress.length + tasks.done.length > 0 ? (tasks.done.length / (tasks.todo.length + tasks.inProgress.length + tasks.done.length)) * 100 : 0}%` 
              }} />
            </View>
          </View>

          {TASK_COLS.map(col => {
            const colTasks = col === 'TODO' ? tasks.todo : col === 'IN_PROGRESS' ? tasks.inProgress : tasks.done;
            return (
              <View key={col} style={[styles.kanbanCol, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB' }]}>
                <View style={styles.kanbanHeader}>
                  <View style={[styles.kanbanDot, { backgroundColor: TASK_COL_COLORS[col] }]} />
                  <Text style={[styles.kanbanLabel, { color: colors.text }]}>{TASK_COL_LABELS[col]}</Text>
                  <View style={[styles.kanbanCount, { backgroundColor: TASK_COL_COLORS[col] + '20' }]}>
                    <Text style={{ fontSize: 11, color: TASK_COL_COLORS[col], fontWeight: '700' }}>{colTasks.length}</Text>
                  </View>
                </View>
                {colTasks.map(t => <TaskCard key={t.id} task={t} col={col} />)}
                {colTasks.length === 0 && (
                  <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>No tasks here yet</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Create Task Modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={[styles.createTaskSheet, { backgroundColor: colors.surface }]}>
            <Text style={[FONTS.h3, { color: colors.text, marginBottom: 20 }]}>New Task</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
              placeholder="Task title *" placeholderTextColor={colors.textMuted} value={newTask.title} onChangeText={v => setNewTask(p => ({ ...p, title: v }))} />
            <TextInput style={[styles.modalInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder, height: 70 }]}
              placeholder="Description (optional)" placeholderTextColor={colors.textMuted} multiline value={newTask.description} onChangeText={v => setNewTask(p => ({ ...p, description: v }))} />
            <Text style={[{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, marginTop: 6, letterSpacing: 0.5 }]}>Assign to (tap to select multiple)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {members?.map(m => {
                  const uid = m.userId ?? m.id;
                  const isSelected = newTask.assigneeIds.includes(uid);
                  return (
                    <TouchableOpacity
                      key={uid}
                      onPress={() => setNewTask(p => ({
                        ...p,
                        assigneeIds: isSelected
                          ? p.assigneeIds.filter(id => id !== uid)
                          : [...p.assigneeIds, uid],
                      }))}
                      style={[styles.assigneeChip,
                        isSelected
                          ? { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                          : { borderColor: colors.surfaceBorder }
                      ]}
                    >
                      <AvatarInitials
                        name={m.user?.name ?? m.name}
                        imgUrl={m.user?.profileImage}
                        size={28}
                        fontSize={10}
                        bgColor={isSelected ? colors.primary : colors.surfaceBorder}
                        textColor={isSelected ? '#FFF' : colors.text}
                      />
                      {isSelected && (
                        <View style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <FontAwesome5 name="check" size={7} color="#FFF" solid />
                        </View>
                      )}
                      <Text style={{ fontSize: 11, color: isSelected ? colors.primary : colors.text, marginLeft: 6, fontWeight: '700' }}>
                        {(m.user?.name ?? m.name ?? '?').split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['LOW', 'MED', 'HIGH'].map(p => (
                <TouchableOpacity key={p} onPress={() => setNewTask(pp => ({ ...pp, priority: p }))}
                  style={[styles.priorityChip, newTask.priority === p && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }, { borderColor: colors.surfaceBorder }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: newTask.priority === p ? colors.primary : colors.textSecondary }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={[{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 }]}>Deadline</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.modalInput, { flex: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', borderColor: colors.surfaceBorder, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: newTask.dueDate ? colors.text : colors.textMuted }}>
                    {newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString([], { dateStyle: 'short' }) : 'Select Date'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalInput, { flex: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', borderColor: colors.surfaceBorder, justifyContent: 'center' }]}
                  onPress={() => {
                    if (!newTask.dueDate) {
                      Alert.alert('Select Date First', 'Please select a date before setting the time.');
                    } else {
                      setShowTimePicker(true);
                    }
                  }}
                >
                  <Text style={{ color: newTask.dueDate ? colors.text : colors.textMuted }}>
                    {newTask.dueDate ? new Date(newTask.dueDate).toLocaleTimeString([], { timeStyle: 'short' }) : 'Time (Optional)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={newTask.dueDate ? new Date(newTask.dueDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      // Default to 11:59 PM (23:59:00)
                      selectedDate.setHours(23, 59, 0, 0);
                      setNewTask(p => ({ ...p, dueDate: selectedDate.toISOString() }));
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={newTask.dueDate ? new Date(newTask.dueDate) : new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (event.type === 'set' && selectedDate && newTask.dueDate) {
                      const updatedDate = new Date(newTask.dueDate);
                      updatedDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                      setNewTask(p => ({ ...p, dueDate: updatedDate.toISOString() }));
                    }
                  }}
                />
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.surfaceBorder }]} onPress={() => setShowCreate(false)}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleCreate}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Custom Room Tabs ────────────────────────────────────────────────────────
const LeaderboardTab = ({ roomId, colors, isDarkMode, members }) => {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      <FontAwesome5 name="trophy" size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Weekly Focus Leaderboard</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>Compete with your study group by completing Pomodoro sessions.</Text>
      
      {members.map((m, i) => (
        <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.surfaceBorder }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMuted, width: 24 }}>{i+1}</Text>
          <AvatarInitials name={m.user?.name} size={36} fontSize={14} bgColor={colors.primary} textColor="#FFF" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{m.user?.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{Math.floor(Math.random()*120 + (10-i)*10)}m</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const CheckinsTab = ({ roomId, colors, isDarkMode, members, myId }) => {
  const [checkinData, setCheckinData] = useState({ days: [], matrix: {} });
  const [loading, setLoading] = useState(true);
  const [checkedToday, setCheckedToday] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchCheckins = async () => {
    try {
      const res = await roomsApi.getCheckIns(roomId);
      if (res.data.success) {
        setCheckinData(res.data.data);
        setCheckedToday(!!res.data.data.matrix?.[myId]?.[today]);
      }
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCheckins(); }, []);

  const handleCheckIn = async () => {
    try {
      await roomsApi.checkIn(roomId);
      setCheckedToday(true);
      fetchCheckins();
    } catch (e) { Alert.alert('Error', 'Failed to check in'); }
  };

  // Calculate streaks per member
  const getStreak = (userId) => {
    const m = checkinData.matrix?.[userId] || {};
    let streak = 0;
    for (let i = checkinData.days.length - 1; i >= 0; i--) {
      if (m[checkinData.days[i]]) streak++;
      else break;
    }
    return streak;
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Productivity Check-ins</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>Track your daily commitment and stay on course.</Text>
      </View>

      <TouchableOpacity
        onPress={handleCheckIn}
        disabled={checkedToday}
        style={{ backgroundColor: checkedToday ? colors.surfaceBorder : colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: checkedToday ? colors.textMuted : '#FFF', fontWeight: '800', fontSize: 16 }}>
          {checkedToday ? 'Checked In Today' : 'Check In Today'}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 }}>Team Streak (Last 7 Days)</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 4 }}>
        {checkinData.days.map(d => (
          <Text key={d} style={{ flex: 1, fontSize: 8, color: colors.textMuted, textAlign: 'center' }}>
            {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
          </Text>
        ))}
      </View>

      {members.map(m => {
        const userId = m.userId ?? m.id;
        const matrix = checkinData.matrix?.[userId] || {};
        const streak = getStreak(userId);
        return (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <AvatarInitials name={m.user?.name} size={32} fontSize={12} bgColor={colors.primary} textColor="#FFF" />
            <View style={{ flex: 1, flexDirection: 'row', marginLeft: 10, gap: 6 }}>
              {checkinData.days.map(d => (
                <View key={d} style={{
                  flex: 1, height: 24, borderRadius: 6,
                  backgroundColor: matrix[d] ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
                }} />
              ))}
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, marginLeft: 10, width: 40, textAlign: 'right' }}>{streak}d</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const ResourcesTab = ({ roomId, colors, isDarkMode, isAdmin }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('LINK');

  const TYPES = ['LINK', 'PDF', 'IMAGE', 'FILE'];
  const TYPE_ICONS = { LINK: 'link', PDF: 'file-pdf', IMAGE: 'image', FILE: 'file-alt' };

  const fetchResources = async () => {
    try {
      const res = await roomsApi.getResources(roomId);
      if (res.data.success) setResources(res.data.data);
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) return Alert.alert('Required', 'Please fill in title and URL.');
    try {
      await roomsApi.addResource(roomId, { title: title.trim(), type, url: url.trim() });
      setTitle(''); setUrl(''); setType('LINK'); setShowAdd(false);
      fetchResources();
    } catch (e) { Alert.alert('Error', 'Failed to add resource'); }
  };

  const handleDelete = (resId) => {
    Alert.alert('Delete Resource?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await roomsApi.deleteResource(roomId, resId); fetchResources(); } catch(e) {}
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{showAdd ? 'Cancel' : 'Share Resource'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 20 }}>
          <TextInput placeholder="Title (e.g. Syllabus PDF)" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle}
            style={{ borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, marginBottom: 12, backgroundColor: colors.background }} />
          <TextInput placeholder="URL or Link" placeholderTextColor={colors.textMuted} value={url} onChangeText={setUrl}
            style={{ borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, marginBottom: 12, backgroundColor: colors.background }} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => setType(t)}
                style={{ flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', backgroundColor: type === t ? colors.primary : colors.surfaceBorder }}>
                <FontAwesome5 name={TYPE_ICONS[t]} size={14} color={type === t ? '#FFF' : colors.textMuted} />
                <Text style={{ fontSize: 9, marginTop: 4, fontWeight: '700', color: type === t ? '#FFF' : colors.textMuted }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Upload</Text>
          </TouchableOpacity>
        </View>
      )}

      {resources.length === 0 && !showAdd && (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <FontAwesome5 name="folder-open" size={40} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 12 }}>No resources shared yet</Text>
        </View>
      )}

      {resources.map(r => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <FontAwesome5 name={TYPE_ICONS[r.type] || 'file'} size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{r.title}</Text>
            <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }} numberOfLines={1}>{r.url}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>by {r.uploader?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(r.id)} style={{ padding: 8 }}>
            <FontAwesome5 name="trash-alt" size={12} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Session Tab ──────────────────────────────────────────────────────────────
const SessionTab = ({ roomId, colors, isAdmin, myId }) => {
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [duration, setDuration] = useState(25);
  const timerRef = useRef();
  const pollRef = useRef();

  const fetchSession = async () => {
    try {
      const res = await roomsApi.getActiveSession(roomId);
      const s = res.data.data;
      setSession(s);
      if (s) setTimeLeft(secondsLeft(s.startedAt, s.durationMinutes));
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSession();
    pollRef.current = setInterval(fetchSession, 5000);
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (session && session.isActive && !session.participants?.some(p => p.userId === myId)) {
      roomsApi.joinSession(roomId, session.id).then(fetchSession).catch(() => {});
    }
  }, [session?.id]);


  useEffect(() => {
    clearInterval(timerRef.current);
    if (session && session.isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); fetchSession(); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session?.id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await roomsApi.startSession(roomId, duration);
      if (res.data.success) { await fetchSession(); }
    } catch (e) { Alert.alert('Error', e.response?.data?.error ?? 'Failed to start session'); } finally { setStarting(false); }
  };

  const handleJoin = async () => {
    try {
      await roomsApi.joinSession(roomId, session.id);
      await fetchSession();
    } catch (e) { Alert.alert('Error', 'Failed to join session'); }
  };

  const handleEnd = async () => {
    Alert.alert('End Session?', 'This will end the session for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: async () => {
        try { await roomsApi.endSession(roomId, session.id); fetchSession(); } catch (e) { }
      }},
    ]);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const isParticipant = session?.participants?.some(p => p.userId === myId);
  const progress = session ? (1 - timeLeft / (session.durationMinutes * 60)) : 0;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      {session ? (
        <>
          <LinearGradient colors={['#2D5016', '#4A7C24']} style={styles.timerCard}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>GROUP POMODORO</Text>
            <Text style={{ color: '#FFF', fontSize: 64, fontWeight: '800', letterSpacing: 2, fontVariant: ['tabular-nums'] }}>{mm}:{ss}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Started by {session.startedBy?.name}</Text>
            <View style={styles.timerProgress}>
              <View style={[styles.timerProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </LinearGradient>

          <Text style={[FONTS.h4, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>
            {session.participants?.length ?? 0} Focusing Together 🧠
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
            {session.participants?.map(p => (
              <View key={p.userId} style={{ alignItems: 'center', gap: 4 }}>
                <AvatarInitials name={p.user?.name} size={44} fontSize={15} bgColor={colors.primary} textColor="#FFF" />
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>{p.user?.name?.split(' ')[0]}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            {!isParticipant && (
              <TouchableOpacity style={[styles.sessBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleJoin}>
                <FontAwesome5 name="play" size={14} color="#FFF" solid />
                <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Join Session</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || session.startedById === myId) && (
              <TouchableOpacity style={[styles.sessBtn, { backgroundColor: '#FEE2E2', flex: isParticipant ? 1 : 0 }]} onPress={handleEnd}>
                <FontAwesome5 name="stop" size={14} color="#EF4444" solid />
                <Text style={{ color: '#EF4444', fontWeight: '700', marginLeft: 8 }}>End</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={styles.noSessionCard}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>⏱️</Text>
            <Text style={[FONTS.h3, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>No Active Session</Text>
            <Text style={[FONTS.body2, { color: colors.textMuted, textAlign: 'center' }]}>
              Start a group Pomodoro and your roommates will get notified to join!
            </Text>
          </View>
          <Text style={[styles.inputLabel2, { color: colors.textSecondary }]}>Duration (minutes)</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[15, 25, 45, 60].map(d => (
              <TouchableOpacity key={d} onPress={() => setDuration(d)}
                style={[styles.durationChip, duration === d && { backgroundColor: colors.primary }, { borderColor: duration === d ? colors.primary : colors.surfaceBorder }]}>
                <Text style={{ fontWeight: '700', color: duration === d ? '#FFF' : colors.text }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.sessBtn, { backgroundColor: colors.primary, width: '100%' }]} onPress={handleStart} disabled={starting}>
            {starting ? <ActivityIndicator color="#FFF" /> : (
              <>
                <FontAwesome5 name="play" size={14} color="#FFF" solid />
                <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 16 }}>Start {duration}-min Session</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// ─── Members Tab ────────────────────────────────────────────────────────────
const MembersTab = ({ roomId, members, isAdmin, myId, onUpdate, colors }) => {
  const handleRemove = (m) => {
    Alert.alert(
      'Remove Member',
      `Remove ${m.user?.name} from the room?\n\nThey will lose access to all room content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await roomsApi.removeMember(roomId, m.userId);
            onUpdate();
          } catch (e) { Alert.alert('Error', e.response?.data?.error ?? 'Failed to remove member'); }
        }},
      ]
    );
  };

  const getActivityDot = (lastActiveAt) => {
    if (!lastActiveAt) return { color: '#6B7280', label: 'Never active' };
    const d = new Date(lastActiveAt);
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (d.getTime() > dayAgo) return { color: '#10B981', label: 'Active today' };
    if (d.getTime() > weekAgo) return { color: '#F59E0B', label: 'Active this week' };
    return { color: '#EF4444', label: 'Inactive' };
  };

  const adminCount = members?.filter(m => m.role === 'ADMIN').length ?? 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Member count header */}
      <View style={[styles.membersHeader, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.memberName, { color: colors.text }]}>{members?.length ?? 0} Members</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{adminCount} admin{adminCount !== 1 ? 's' : ''}</Text>
        </View>
        {isAdmin && (
          <View style={[styles.roleBadgeAdmin, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
            <FontAwesome5 name="user-shield" size={11} color={colors.primary} solid />
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, marginLeft: 5 }}>You are Admin</Text>
          </View>
        )}
      </View>

      {members?.map(m => {
        const isMe = m.userId === myId;
        const dot = getActivityDot(m.lastActiveAt);
        const isCreator = m.role === 'ADMIN';
        return (
          <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderLeftWidth: isMe ? 3 : 1, borderLeftColor: isMe ? colors.primary : colors.surfaceBorder }]}>
            <View style={{ position: 'relative' }}>
              <AvatarInitials name={m.user?.name} size={44} fontSize={15} bgColor={isCreator ? colors.primary : colors.surfaceBorder} textColor={isCreator ? colors.background : colors.text} />
              <View style={[styles.activityDot, { backgroundColor: dot.color }]} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.memberName, { color: colors.text }]}>{m.user?.name}</Text>
                {isMe && (
                  <View style={[styles.youBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ fontSize: 8, fontWeight: '800', color: colors.primary }}>YOU</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                {isCreator ? (
                  <View style={[styles.roleBadgeAdmin, { borderColor: '#F59E0B40', backgroundColor: '#FEF3C7' }]}>
                    <FontAwesome5 name="shield-alt" size={8} color="#F59E0B" solid />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: '#F59E0B', marginLeft: 3 }}>ADMIN</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>Member</Text>
                )}
                <Text style={{ fontSize: 10, color: dot.color, fontWeight: '600' }}>{dot.label}</Text>
              </View>
            </View>
            {/* Admin can remove any non-admin member; admin can also remove other admins if they're the room creator */}
            {isAdmin && !isMe && (
              <TouchableOpacity
                onPress={() => handleRemove(m)}
                style={[styles.removeBtn, { opacity: isCreator && m.userId !== myId ? 0.5 : 1 }]}
                disabled={isCreator && adminCount <= 1}
              >
                <FontAwesome5 name="user-minus" size={13} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Info Tab ────────────────────────────────────────────────────────────
const InfoTab = ({ room, roomId, isAdmin, onUpdate, colors, isDarkMode }) => {
  const [invite, setInvite] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: room?.name ?? '',
    description: room?.description ?? '',
    weeklyGoalSessions: String(room?.weeklyGoalSessions ?? 0),
    isPublic: room?.isPublic ?? true,
  });
  const [saving, setSaving] = useState(false);

  const genInvite = async () => {
    try {
      const res = await roomsApi.generateInvite(roomId, 24, 50);
      setInvite(res.data.data);
    } catch (e) { Alert.alert('Error', 'Failed to generate invite'); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await roomsApi.updateRoom(roomId, { ...form, weeklyGoalSessions: parseInt(form.weeklyGoalSessions) || 0 });
      onUpdate();
      setEditing(false);
    } catch (e) { Alert.alert('Error', 'Failed to update room'); } finally { setSaving(false); }
  };

  const handleLeave = () => {
    Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try { await roomsApi.leaveRoom(roomId); } catch (e) { }
      }},
    ]);
  };

  const currentCode = invite?.inviteCode ?? room?.inviteCode ?? '••••••••';

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* Room visibility status */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.visibilityIcon, { backgroundColor: room?.isPublic ? colors.primary + '15' : '#FEE2E2' }]}>
            <FontAwesome5 name={room?.isPublic ? 'globe' : 'lock'} size={16} color={room?.isPublic ? colors.primary : '#EF4444'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoCardTitle, { color: colors.text, marginBottom: 2 }]}>
              {room?.isPublic ? 'Public Room' : 'Private Room'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {room?.isPublic
                ? 'Anyone can discover and join this room'
                : 'Only members with an invite code can join'}
            </Text>
          </View>
        </View>
      </View>

      {/* Invite Code */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[styles.infoCardTitle, { color: colors.text, marginBottom: 0 }]}>Invite Code</Text>
          <FontAwesome5 name="key" size={13} color={colors.primary} />
        </View>
        <View style={[styles.codeBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}>
          <Text style={[styles.codeText, { color: colors.primary }]}>{currentCode}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={[styles.infoBtn, { backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary }]} onPress={genInvite}>
            <FontAwesome5 name="sync-alt" size={12} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, marginLeft: 8 }}>Generate New Code</Text>
          </TouchableOpacity>
        )}
        {invite && (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            Expires in 24h · Max 50 uses
          </Text>
        )}
      </View>

      {/* Edit Room — admin only */}
      {isAdmin && (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Room Settings</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: 4 }}>
              <FontAwesome5 name={editing ? 'times' : 'pen'} size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {editing ? (
            <View style={{ gap: 10, marginTop: 12 }}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))}
                placeholder="Room name" placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder, height: 70 }]}
                value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))}
                placeholder="Description" placeholderTextColor={colors.textMuted} multiline
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8F9FA', color: colors.text, borderColor: colors.surfaceBorder }]}
                value={form.weeklyGoalSessions} onChangeText={v => setForm(p => ({ ...p, weeklyGoalSessions: v }))}
                placeholder="Weekly goal (sessions)" placeholderTextColor={colors.textMuted} keyboardType="number-pad"
              />
              {/* Public/Private toggle */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8F9FA' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome5 name={form.isPublic ? 'globe' : 'lock'} size={13} color={form.isPublic ? colors.primary : '#EF4444'} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{form.isPublic ? 'Public Room' : 'Private Room'}</Text>
                </View>
                <Switch
                  value={form.isPublic}
                  onValueChange={v => setForm(p => ({ ...p, isPublic: v }))}
                  trackColor={{ false: '#F87171', true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              <TouchableOpacity style={[styles.infoBtn, { backgroundColor: colors.primary }]} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>{room?.name}</Text>
              {room?.description && <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>{room.description}</Text>}
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Subject: {room?.subject}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Weekly goal: {room?.weeklyGoalSessions} sessions</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Visibility: {room?.isPublic ? 'Public' : 'Private'}</Text>
            </View>
          )}
        </View>
      )}

      {/* Leave Room */}
      <TouchableOpacity style={[styles.infoBtn, { backgroundColor: '#FEE2E2' }]} onPress={handleLeave}>
        <FontAwesome5 name="sign-out-alt" size={13} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontWeight: '700', marginLeft: 8 }}>Leave Room</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RoomDetailScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId } = route.params;

  const [activeTab, setActiveTab] = useState('Chat');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const roomTabs = React.useMemo(() => {
    let secondTab = 'Tasks';
    if (room?.type === 'STUDY_GROUP') secondTab = 'Leaderboard';
    else if (room?.type === 'ACCOUNTABILITY_POD') secondTab = 'Check-ins';
    else if (room?.type === 'CLASSROOM') secondTab = 'Resources';
    return ['Chat', secondTab, 'Session', 'Members', 'Info'];
  }, [room?.type]);

  const fetchRoom = async () => {
    try {
      const res = await roomsApi.getRoomById(roomId);
      if (res.data.success) {
        setRoom(res.data.data);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load room');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRoom(); }, [roomId]);

  // Refresh when screen comes back into focus (handles profile photo changes)
  useFocusEffect(
    useCallback(() => {
      if (!loading) fetchRoom();
    }, [roomId])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isAdmin = room?.myRole === 'ADMIN';
  const members = room?.members ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={{ paddingHorizontal: 16 }}>
        <Header />
      </View>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <FontAwesome5 name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        {/* Room avatar mini */}
        <View style={[styles.topBarAvatar, { backgroundColor: room?.bannerColor ?? colors.primary, overflow: 'hidden' }]}>
          <Image source={{ uri: getRoomAvatarUrl(room?.emoji) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.roomTitle, { color: colors.text }]} numberOfLines={1}>{room?.name}</Text>
          <Text style={[styles.roomSubtitle, { color: colors.textMuted }]}>{members.length} members · {room?.subject}</Text>
        </View>
        {isAdmin && (
          <View style={[styles.adminBadge, { marginRight: 4 }]}>
            <FontAwesome5 name="shield-alt" size={9} color="#F59E0B" solid />
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {roomTabs.map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary }]}>
                <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textMuted }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Chat' && <ChatTab roomId={roomId} myId={user?.id} colors={colors} isDarkMode={isDarkMode} isAdmin={isAdmin} />}
        {activeTab === 'Tasks' && <TasksTab roomId={roomId} colors={colors} isDarkMode={isDarkMode} members={members} isAdmin={isAdmin} myId={user?.id} />}
        {activeTab === 'Leaderboard' && <LeaderboardTab roomId={roomId} colors={colors} isDarkMode={isDarkMode} members={members} />}
        {activeTab === 'Check-ins' && <CheckinsTab roomId={roomId} colors={colors} isDarkMode={isDarkMode} members={members} myId={user?.id} />}
        {activeTab === 'Resources' && <ResourcesTab roomId={roomId} colors={colors} isDarkMode={isDarkMode} isAdmin={isAdmin} />}
        {activeTab === 'Session' && <SessionTab roomId={roomId} colors={colors} isAdmin={isAdmin} myId={user?.id} />}
        {activeTab === 'Members' && <MembersTab roomId={roomId} members={members} isAdmin={isAdmin} myId={user?.id} onUpdate={fetchRoom} colors={colors} />}
        {activeTab === 'Info' && <InfoTab room={room} roomId={roomId} isAdmin={isAdmin} onUpdate={fetchRoom} colors={colors} isDarkMode={isDarkMode} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  topBarAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  roomTitle: { fontSize: 16, fontWeight: '800' },
  roomSubtitle: { fontSize: 12, marginTop: 1 },
  tabBar: { borderBottomWidth: 1 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  adminBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },

  // Chat
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgSender: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 2 },
  systemMsg: { alignItems: 'center', marginVertical: 6 },
  systemMsgText: { fontSize: 11, fontStyle: 'italic' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  replyQuote: { borderRadius: 8, padding: 8, marginBottom: 4 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 2 },
  chatInput: { flexDirection: 'row', alignItems: 'flex-end', margin: 12, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  attachBtn: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  // Tasks
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 14, borderRadius: 14, justifyContent: 'center' },
  kanbanCol: { width: '100%', borderRadius: 16, padding: 12 },
  kanbanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  kanbanDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  kanbanLabel: { fontSize: 13, fontWeight: '800', flex: 1 },
  kanbanCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  taskCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  taskTitle: { fontSize: 13, fontWeight: '700' },
  taskDesc: { fontSize: 12, marginTop: 4 },
  taskAssignee: { fontSize: 11, marginLeft: 6 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  moveBtn: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  createTaskSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 4 },
  assigneeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  priorityChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  footerBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Session
  timerCard: { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 8 },
  timerProgress: { width: '100%', height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  timerProgressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3 },
  sessBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  noSessionCard: { alignItems: 'center', paddingVertical: 32 },
  inputLabel2: { fontSize: 12, fontWeight: '600', marginBottom: 10, alignSelf: 'flex-start' },
  durationChip: { width: 60, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },

  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1 },
  memberName: { fontSize: 15, fontWeight: '700' },
  activityDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  youBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  roleBadgeAdmin: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },

  // Info
  infoCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  infoCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  visibilityIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  codeBox: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  codeText: { fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  infoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14 },
});

export default RoomDetailScreen;
