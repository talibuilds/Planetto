import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';
import { notificationsApi } from '../api/rooms';

const DataContext = createContext();

export const useData = () => useContext(DataContext);




export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    dayStreak: 0,
    focusTimeToday: 0,
    sessionsToday: 0,
    focusQuality: 100,
  });
  const [extraFocusSeconds, setExtraFocusSeconds] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [latestNotification, setLatestNotification] = useState(null);
  const [isNotificationsBlocked, setIsNotificationsBlocked] = useState(false);

  // Fetch tasks and stats when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
      fetchStats();
      fetchBackendNotifications();
    } else {
      setTasks([]);
      setStats({ dayStreak: 0, focusTimeToday: 0, sessionsToday: 0, focusQuality: 100 });
      setNotifications([]);
    }
  }, [user?.id]);

  const fetchBackendNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      if (res.data?.data?.notifications) {
        const backendNotifs = res.data.data.notifications.map(n => ({
          id: n.id,
          icon: n.type === 'MESSAGE' ? 'comment-alt' : n.type === 'POMODORO' ? 'stopwatch' : 'bell',
          title: n.title,
          body: n.body,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.isRead,
          color: n.type === 'MESSAGE' ? '#3B82F6' : n.type === 'POMODORO' ? '#F59E0B' : '#10B981',
          isBackend: true,
        }));
        
        const userName = user?.name || 'User';
        const welcomeNotifs = [
          {
            id: `welcome-1`,
            icon: 'home',
            title: `Welcome ${userName} to Planetto!`,
            body: 'We are thrilled to have you here. Let\'s make today productive!',
            time: 'Just now',
            read: false,
            color: '#10B981',
          },
        ];

        setNotifications([...backendNotifs, ...welcomeNotifs]);
      }
    } catch (e) {
      console.log('Failed to fetch notifications');
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await notificationsApi.markAllRead(); } catch (e) {}
  };

  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const notif = notifications.find(n => n.id === id);
    if (notif?.isBackend) {
      try { await notificationsApi.markRead(id); } catch (e) {}
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      const backendIds = notifications.filter(n => n.isBackend).map(n => n.id);
      for (const id of backendIds) {
        await notificationsApi.delete(id);
      }
    } catch (e) {}
  };

  const addNotification = (title, body, icon = 'bell', color = '#6366F1') => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      icon,
      title,
      body,
      time: 'Just now',
      read: false,
      color,
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (!isNotificationsBlocked) {
      setLatestNotification(newNotif);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get(`/tasks/${user.id}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get(`/focus/${user.id}/stats`);
      if (res.data.success) {
        const data = res.data.data;
        setStats({
          dayStreak: data.dayStreak || 0,
          focusTimeToday: data.today?.focusHoursToday || 0,
          sessionsToday: data.today?.sessionsToday || 0,
          focusQuality: data.today?.avgQualityToday || 100,
          activity: data.activity || {},
        });
        setExtraFocusSeconds(0);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const [rooms, setRooms] = useState([]);

  const [joinedRooms, setJoinedRooms] = useState({});

  const addTask = async (taskData) => {
    if (!user) return;
    try {
      // Backend expects title, description, subject, priority, dueDate
      const res = await apiClient.post('/tasks', {
        ...taskData,
        userId: user.id
      });
      if (res.data.success) {
        setTasks(prev => [...prev, res.data.data]);
        await fetchStats();
      }
    } catch (e) {
      console.error('Failed to add task', e);
    }
  };
  
  const toggleTaskCompletion = async (id) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null } : t));
      await apiClient.patch(`/tasks/${id}/toggle`);
      await fetchStats();
    } catch (e) {
      console.error('Failed to toggle completion', e);
      fetchTasks(); // Revert on failure
    }
  };
  
  const deleteTask = async (id) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await apiClient.delete(`/tasks/${id}`);
      await fetchStats();
    } catch (e) {
      console.error('Failed to delete task', e);
      fetchTasks(); // Revert on failure
    }
  };

  const toggleFocusQueue = async (id) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, inFocusQueue: !t.inFocusQueue } : t));
      await apiClient.patch(`/tasks/${id}/focus`);
    } catch (e) {
      console.error('Failed to toggle focus queue', e);
      fetchTasks(); // Revert on failure
    }
  };

  const toggleRoomJoin = (id) => setJoinedRooms(prev => ({ ...prev, [id]: !prev[id] }));

  const addRoom = (room) => setRooms(prev => [room, ...prev]);

  const logFocusSession = async (durationSeconds, pauses) => {
    if (!user) return;
    try {
      await apiClient.post('/focus', {
        userId: user.id,
        duration: durationSeconds,
        pauses
      });
      // Refetch stats to get updated velocity/quality from DB
      await fetchStats();

      // Add a notification upon completing a Pomodoro session
      const minutes = Math.round(durationSeconds / 60);
      addNotification(
        'Session Complete',
        `You completed a ${minutes}-min focus session.`,
        'check-circle',
        '#10B981'
      );
    } catch (e) {
      console.error('Failed to log session', e);
    }
  };

  const incrementFocusTime = (seconds) => {
    setExtraFocusSeconds(prev => prev + seconds);
  };

  const updateTaskSessions = async (id, delta) => {
    try {
      let updatedTask = null;
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const nextVal = Math.max(1, (t.sessionsRequired || 2) + delta);
          updatedTask = { ...t, sessionsRequired: nextVal };
          return updatedTask;
        }
        return t;
      }));
      if (updatedTask) {
        await apiClient.patch(`/tasks/${id}`, {
          sessionsRequired: updatedTask.sessionsRequired
        });
      }
    } catch (e) {
      console.error('Failed to update task sessions', e);
      fetchTasks();
    }
  };

  const formatFocusTime = (hours) => {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}h ${m}m`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  const computedStats = {
    ...stats,
    focusTimeToday: parseFloat((stats.focusTimeToday + (extraFocusSeconds / 3600)).toFixed(3))
  };

  return (
    <DataContext.Provider value={{
      tasks, addTask, toggleTaskCompletion, deleteTask, toggleFocusQueue, updateTaskSessions,
      stats: computedStats, logFocusSession, incrementFocusTime, formatFocusTime,
      rooms, joinedRooms, toggleRoomJoin, addRoom,
      notifications, markAllNotificationsRead, markNotificationRead, clearAllNotifications, addNotification,
      isNotificationsBlocked, setIsNotificationsBlocked,
      latestNotification, setLatestNotification
    }}>
      {children}
    </DataContext.Provider>
  );
};
