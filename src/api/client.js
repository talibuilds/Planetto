import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── API Configuration ───────────────────────────────────────────────
// Set your Dev Tunnel URL here to access the backend from your physical device APK.
const DEV_TUNNEL_URL = 'https://k9hbpmb2-5000.inc1.devtunnels.ms/'; // Replace with your active tunnel URL

const getBaseUrl = () => {
  // 1. Physical Device (APK installed on your phone)
  if (Constants.isDevice) {
    return DEV_TUNNEL_URL || 'https://api.planetto.space/api';
  }

  // 2. Android Emulator (uses 10.0.2.2 to access host's localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // 3. Fallback (Web / iOS Simulator)
  return 'http://127.0.0.1:5000/api';
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
