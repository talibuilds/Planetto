import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const today = new Date().toISOString().split('T')[0];

// Tomorrow's date
const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

// Day after tomorrow
const dayAfter = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
})();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    dayStreak: 0,
    focusTimeToday: 0,
    sessionsToday: 0,
    focusQuality: 100,
  });

  // Fetch tasks and stats when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
      fetchStats();
    } else {
      setTasks([]);
      setStats({ dayStreak: 0, focusTimeToday: 0, sessionsToday: 0, focusQuality: 100 });
    }
  }, [user?.id]);

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
        });
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const [rooms, setRooms] = useState([
    {
      id: 'r1',
      title: 'University Library',
      desc: 'The ultimate silence for deep research and thesis writing. No talking allowed. Perfect for exams.',
      owner: 'Talib Khan',
      date: 'Today, 10:00 AM',
      image: { uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800' },
      live: true,
      count: 142,
      subject: 'ACADEMICS',
      ambience: 'Silent / Library',
      intensity: 'Extreme',
      participants: [
        { img: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/22.jpg' },
        { img: 'https://randomuser.me/api/portraits/women/12.jpg' },
      ],
    },
    {
      id: 'r2',
      title: 'Late Night Coding',
      desc: 'Focused environment for software engineering and building side projects. Mic off, camera optional.',
      owner: 'Arjun S.',
      date: 'Today, 11:00 PM',
      image: { uri: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800' },
      live: true,
      count: 86,
      subject: 'ENGINEERING',
      ambience: 'Lo-Fi / Rain',
      intensity: 'Focused',
      participants: [
        { img: 'https://randomuser.me/api/portraits/men/33.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/11.jpg' },
        { img: 'https://randomuser.me/api/portraits/women/65.jpg' },
      ],
    },
    {
      id: 'r3',
      title: 'Medical Study Hub',
      desc: 'Flashcards and intense memorization for upcoming clinicals and NEET prep. High focus required.',
      owner: 'Priya M.',
      date: 'Today, 6:00 PM',
      image: { uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800' },
      live: true,
      count: 58,
      subject: 'MEDICINE',
      ambience: 'Classical Music',
      intensity: 'High',
      participants: [
        { img: 'https://randomuser.me/api/portraits/women/55.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/77.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/45.jpg' },
      ],
    },
    {
      id: 'r4',
      title: 'JEE / NEET Batch 2025',
      desc: 'Dedicated competitive exam prep hub. Solve questions, share doubts, stay accountable.',
      owner: 'Rohan K.',
      date: 'Tomorrow, 9:00 AM',
      image: { uri: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800' },
      live: false,
      count: 234,
      subject: 'COMPETITIVE',
      ambience: 'White Noise',
      intensity: 'Extreme',
      participants: [
        { img: 'https://randomuser.me/api/portraits/men/62.jpg' },
        { img: 'https://randomuser.me/api/portraits/women/33.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/91.jpg' },
      ],
    },
    {
      id: 'r5',
      title: 'Creative Writing Room',
      desc: 'A calm space for essay drafting, creative writing, and literary exploration. Relaxed vibe.',
      owner: 'Kavya R.',
      date: 'Today, 3:00 PM',
      image: { uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800' },
      live: true,
      count: 31,
      subject: 'ARTS',
      ambience: 'Café Sounds',
      intensity: 'Light',
      participants: [
        { img: 'https://randomuser.me/api/portraits/women/88.jpg' },
        { img: 'https://randomuser.me/api/portraits/men/14.jpg' },
      ],
    },
  ]);

  const [joinedRooms, setJoinedRooms] = useState({ r1: true });

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
      }
    } catch (e) {
      console.error('Failed to add task', e);
    }
  };
  
  const toggleTaskCompletion = async (id) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
      await apiClient.patch(`/tasks/${id}/toggle`);
    } catch (e) {
      console.error('Failed to toggle completion', e);
      fetchTasks(); // Revert on failure
    }
  };
  
  const deleteTask = async (id) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await apiClient.delete(`/tasks/${id}`);
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
    } catch (e) {
      console.error('Failed to log session', e);
    }
  };

  return (
    <DataContext.Provider value={{
      tasks, addTask, toggleTaskCompletion, deleteTask, toggleFocusQueue,
      stats, logFocusSession,
      rooms, joinedRooms, toggleRoomJoin, addRoom
    }}>
      {children}
    </DataContext.Provider>
  );
};
