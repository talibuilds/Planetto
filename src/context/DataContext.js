import React, { createContext, useContext, useState } from 'react';

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
  const [tasks, setTasks] = useState([
    // --- TODAY'S TASKS (mix of done/pending for a realistic velocity ≠ 100%) ---
    { id: 't1', title: 'Quantum Physics Final Review', desc: 'Chapters 12-18 and past papers.', priority: 'HIGH', pColor: '#EF4444', completed: false, date: today, subject: 'Physics', inFocusQueue: true },
    { id: 't2', title: 'Lab Report: Thermal Dynamics', desc: 'Finalize data visualization and abstract.', priority: 'HIGH', pColor: '#EF4444', completed: false, date: today, subject: 'Chemistry', inFocusQueue: true },
    { id: 't3', title: 'Literature Analysis', desc: 'Chapter 7 — Metaphors in Modernism.', priority: 'MED', pColor: '#A1A1AA', completed: false, date: today, subject: 'Literature', inFocusQueue: true },
    { id: 't4', title: 'Library Book Return', desc: 'Return "The Art of War" and "Digital Design".', priority: 'LOW', pColor: '#2D5A3C', completed: true, date: today, subject: 'General', inFocusQueue: false },
    { id: 't5', title: 'Morning Revision Notes', desc: 'Write concise revision notes from yesterday.', priority: 'MED', pColor: '#A1A1AA', completed: true, date: today, subject: 'Physics', inFocusQueue: false },
    { id: 't6', title: 'Data Structures Assignment', desc: 'Complete tree traversal problems set 3.', priority: 'HIGH', pColor: '#EF4444', completed: true, date: today, subject: 'Computer Science', inFocusQueue: false },
    // --- TOMORROW'S TASKS ---
    { id: 't7', title: 'Organic Chemistry: Isomers', desc: 'Study isomerism types and practice naming.', priority: 'HIGH', pColor: '#EF4444', completed: false, date: tomorrow, subject: 'Chemistry', inFocusQueue: false },
    { id: 't8', title: 'Essay: Industrial Revolution', desc: 'Write 1500 words essay for History class.', priority: 'MED', pColor: '#A1A1AA', completed: false, date: tomorrow, subject: 'History', inFocusQueue: false },
    { id: 't9', title: 'Group Study: Economics', desc: 'Meet with study group at 4PM in Room B2.', priority: 'LOW', pColor: '#2D5A3C', completed: false, date: tomorrow, subject: 'Economics', inFocusQueue: false },
    // --- DAY AFTER ---
    { id: 't10', title: 'Maths: Integration Practice', desc: 'Solve 30 integration problems from textbook.', priority: 'HIGH', pColor: '#EF4444', completed: false, date: dayAfter, subject: 'Mathematics', inFocusQueue: false },
    { id: 't11', title: 'Biology: Cell Division', desc: 'Review mitosis vs meiosis diagrams.', priority: 'MED', pColor: '#A1A1AA', completed: false, date: dayAfter, subject: 'Biology', inFocusQueue: false },
  ]);

  // Stats: sessions=4 (velocity gauge), focusTimeToday=2.8 — these are separate from Daily Orbit (task count)
  const [stats, setStats] = useState({
    dayStreak: 14,
    focusTimeToday: 2.8,   // hours of actual focused timer usage
    sessionsToday: 4,       // number of completed pomodoro sessions  
    focusQuality: 78,       // quality % based on pauses
    // Velocity = sessionsToday / daily session goal (8) × 100 = 50%
    // Daily Orbit = completedTasks / totalTasks × 100 = 3/6 = 50% today BUT they use different scales
    // velocity represents SPEED of sessions, daily orbit represents BREADTH of task completion
  });

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

  const addTask = (task) => setTasks(prev => [...prev, task]);
  
  const toggleTaskCompletion = (id) => setTasks(prev =>
    prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  );
  
  const deleteTask = (id) => setTasks(prev => {
    const filtered = prev.filter(t => t.id !== id);
    // After deletion, auto-add next highest priority pending task to queue if the deleted task was in queue
    return filtered;
  });

  const toggleFocusQueue = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, inFocusQueue: !t.inFocusQueue } : t));

  const toggleRoomJoin = (id) => setJoinedRooms(prev => ({ ...prev, [id]: !prev[id] }));

  const logFocusSession = (durationSeconds, pauses) => {
    // Focus Quality formula: Base 100 - (pauses * 5), min 50%
    const quality = Math.max(50, 100 - (pauses * 5));
    setStats(prev => ({
      ...prev,
      focusTimeToday: parseFloat((prev.focusTimeToday + (durationSeconds / 3600)).toFixed(1)),
      sessionsToday: prev.sessionsToday + 1,
      focusQuality: Math.round((prev.focusQuality + quality) / 2),
    }));
  };

  return (
    <DataContext.Provider value={{
      tasks, addTask, toggleTaskCompletion, deleteTask, toggleFocusQueue,
      stats, logFocusSession,
      rooms, joinedRooms, toggleRoomJoin
    }}>
      {children}
    </DataContext.Provider>
  );
};
