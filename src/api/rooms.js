import { apiClient } from './client';

// ─── Room CRUD ───────────────────────────────────────────────────────────────
export const roomsApi = {
  getMyRooms: () => apiClient.get('/rooms'),
  discoverRooms: (search) => apiClient.get('/rooms/discover', { params: { search } }),
  getRoomById: (id) => apiClient.get(`/rooms/${id}`),
  createRoom: (data) => apiClient.post('/rooms', data),
  updateRoom: (id, data) => apiClient.patch(`/rooms/${id}`, data),
  deleteRoom: (id) => apiClient.delete(`/rooms/${id}`),

  // ─── Membership ─────────────────────────────────────────────────────────
  joinByCode: (inviteCode) => apiClient.post(`/rooms/join/${inviteCode}`),
  leaveRoom: (id) => apiClient.post(`/rooms/${id}/leave`),
  generateInvite: (id, expiresInHours = 24, maxUses = 50) =>
    apiClient.post(`/rooms/${id}/invite`, { expiresInHours, maxUses }),
  removeMember: (id, memberId) => apiClient.delete(`/rooms/${id}/members/${memberId}`),
  transferAdmin: (id, newAdminId) => apiClient.patch(`/rooms/${id}/transfer-admin`, { newAdminId }),

  // ─── Messages ────────────────────────────────────────────────────────────
  getMessages: (id, cursor) => apiClient.get(`/rooms/${id}/messages`, { params: { cursor } }),
  sendMessage: (id, content, type = 'TEXT', parentId, mediaUrl) =>
    apiClient.post(`/rooms/${id}/messages`, { content, type, parentId, mediaUrl }),
  pinMessage: (id, msgId) => apiClient.patch(`/rooms/${id}/messages/${msgId}/pin`),
  getPinnedMessages: (id) => apiClient.get(`/rooms/${id}/messages/pinned`),

  // ─── Tasks ───────────────────────────────────────────────────────────────
  getTasks: (id) => apiClient.get(`/rooms/${id}/tasks`),
  createTask: (id, data) => apiClient.post(`/rooms/${id}/tasks`, data),
  updateTask: (id, taskId, data) => apiClient.patch(`/rooms/${id}/tasks/${taskId}`, data),

  // ─── Pomodoro Sessions ───────────────────────────────────────────────────
  startSession: (id, durationMinutes = 25) =>
    apiClient.post(`/rooms/${id}/sessions/start`, { durationMinutes }),
  joinSession: (id, sid) => apiClient.post(`/rooms/${id}/sessions/${sid}/join`),
  endSession: (id, sid) => apiClient.post(`/rooms/${id}/sessions/${sid}/end`),
  getActiveSession: (id) => apiClient.get(`/rooms/${id}/sessions/active`),

  // ─── Stats ───────────────────────────────────────────────────────────────
  getRoomStats: (id) => apiClient.get(`/rooms/${id}/stats`),

  // ─── Resources ──────────────────────────────────────────────────────────
  getResources: (id) => apiClient.get(`/rooms/${id}/resources`),
  addResource: (id, data) => apiClient.post(`/rooms/${id}/resources`, data),
  deleteResource: (id, resId) => apiClient.delete(`/rooms/${id}/resources/${resId}`),

  // ─── Check-Ins ──────────────────────────────────────────────────────────
  getCheckIns: (id) => apiClient.get(`/rooms/${id}/checkins`),
  checkIn: (id, note) => apiClient.post(`/rooms/${id}/checkins`, { note }),
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  getAllRooms: () => apiClient.get('/admin/rooms'),
  getAllUsers: () => apiClient.get('/admin/users'),
  getRoomDetail: (id) => apiClient.get(`/admin/rooms/${id}`),
  updateRoom: (id, data) => apiClient.patch(`/admin/rooms/${id}`, data),
  deleteRoom: (id) => apiClient.delete(`/admin/rooms/${id}`),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  toggleRoomEnabled: (id) => apiClient.patch(`/admin/rooms/${id}/toggle-enabled`),
  seedRooms: () => apiClient.post('/admin/seed-rooms'),
};

// --- Notifications API ---
export const notificationsApi = {
  getAll: () => apiClient.get('/notifications'),
  markAllRead: () => apiClient.patch('/notifications/mark-all-read'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};
