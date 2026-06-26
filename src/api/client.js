import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Set the production URL for the backend deployed on Render
const PRODUCTION_URL = 'https://planetto-backend.onrender.com/api';

const getBaseUrl = () => {
  // Always use the live production server for Web (Vercel) and the APK
  return PRODUCTION_URL;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  maxContentLength: 10 * 1024 * 1024, // 10 MB for receiving base64 files
  maxBodyLength: 10 * 1024 * 1024,    // 10 MB for sending base64 files
});

// ─── Auth Interceptor ─────────────────────────────────────────────────────────
// Attaches the current user's ID as x-user-id header on every request.
// The userId is stored in module-level state and updated by setApiUserId().
let _currentUserId = null;

export const setApiUserId = (userId) => {
  _currentUserId = userId;
};

apiClient.interceptors.request.use((config) => {
  if (_currentUserId) {
    config.headers['x-user-id'] = _currentUserId;
  }
  return config;
});
