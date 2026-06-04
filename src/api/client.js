import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically resolve backend URL.
// On Android emulators, 10.0.2.2 always maps to the host machine's localhost.
// On physical devices, we derive the host IP from Metro's hostUri (both Metro
// and the backend must be reachable at the same IP in that case).
const getBaseUrl = () => {
  if (__DEV__) {
    // Android emulator: always use the loopback alias — the backend runs on host localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    // iOS simulator / physical device: derive from Metro hostUri
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  // Production URL
  return 'https://api.planetto.app/api';
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
