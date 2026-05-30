import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { apiClient, setApiUserId } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const GOOGLE_WEB_CLIENT_ID = '548910505461-e6vu7gnc7hbrj64277tsj4um11ob46m5.apps.googleusercontent.com';

const isWeb = Platform.OS === 'web';

// Safely import native Google Sign-in (crashes on web)
let GoogleSignin = null;
if (!isWeb) {
  try {
    const gsi = require('@react-native-google-signin/google-signin');
    GoogleSignin = gsi.GoogleSignin;
  } catch (e) {
    console.warn('Native Google Sign-in not available:', e.message);
  }
}

const showAlert = (title, message) => {
  if (isWeb) {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure Native Google Sign-in (only on mobile)
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: '548910505461-qhvf50ncsh5i7ana0mhiqe3lsbmdng5k.apps.googleusercontent.com',
        offlineAccess: true,
      });
    }

    // Check for existing session
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@planetto_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUser(u);
          setApiUserId(u?.id ?? null);
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser(response.data.data);
        setApiUserId(response.data.data?.id ?? null);
        await AsyncStorage.setItem('@planetto_user', JSON.stringify(response.data.data));
        return true;
      }
    } catch (e) {
      showAlert('Login Failed', e.response?.data?.message || 'Network error');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      if (response.data.success) {
        setUser(response.data.data);
        setApiUserId(response.data.data?.id ?? null);
        await AsyncStorage.setItem('@planetto_user', JSON.stringify(response.data.data));
        return true;
      }
    } catch (e) {
      showAlert('Registration Failed', e.response?.data?.message || 'Network error');
      return false;
    }
  };

  // ─── Google Sign-In for WEB ─────────────────────────────────────────
  const googleLoginWeb = () => {
    return new Promise((resolve) => {
      if (window.confirm('Would you like to simulate Google Login for development? (Select Cancel to use real Google Sign-In)')) {
        const mockToken = 'mock-developer@planetto.space-Developer User-dev12345';
        apiClient.post('/auth/google', { idToken: mockToken })
          .then(async (response) => {
            if (response.data.success) {
              setUser(response.data.data);
              await AsyncStorage.setItem('@planetto_user', JSON.stringify(response.data.data));
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch((err) => {
            console.error('Mock Google login error:', err);
            showAlert('Mock Login Failed', err.response?.data?.message || 'Network error');
            resolve(false);
          });
        return;
      }

      // Load the Google Identity Services script dynamically
      if (document.getElementById('google-gsi-script')) {
        triggerGooglePrompt(resolve);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => triggerGooglePrompt(resolve);
      script.onerror = () => {
        showAlert('Google Login Failed', 'Could not load Google Sign-In.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  const triggerGooglePrompt = (resolve) => {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_WEB_CLIENT_ID,
        callback: async (response) => {
          try {
            const idToken = response.credential;
            if (!idToken) {
              showAlert('Google Login Failed', 'No credential received.');
              resolve(false);
              return;
            }
            const apiResponse = await apiClient.post('/auth/google', { idToken });
            if (apiResponse.data.success) {
              setUser(apiResponse.data.data);
              await AsyncStorage.setItem('@planetto_user', JSON.stringify(apiResponse.data.data));
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (err) {
            console.error('Google web login error:', err);
            showAlert('Google Login Failed', err.response?.data?.message || 'Server error');
            resolve(false);
          }
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use the button-based popup flow
          console.warn('Google One-Tap not displayed, trying popup...');
          // Create a temporary hidden div for the button
          const btnDiv = document.createElement('div');
          btnDiv.id = 'google-signin-btn-temp';
          btnDiv.style.position = 'fixed';
          btnDiv.style.top = '50%';
          btnDiv.style.left = '50%';
          btnDiv.style.transform = 'translate(-50%, -50%)';
          btnDiv.style.zIndex = '99999';
          btnDiv.style.background = 'white';
          btnDiv.style.padding = '30px';
          btnDiv.style.borderRadius = '16px';
          btnDiv.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
          document.body.appendChild(btnDiv);

          window.google.accounts.id.renderButton(btnDiv, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 300,
          });

          // Add a close button
          const closeBtn = document.createElement('button');
          closeBtn.textContent = '✕ Close';
          closeBtn.style.cssText = 'display:block;margin:15px auto 0;padding:8px 20px;border:1px solid #ccc;border-radius:8px;background:white;cursor:pointer;font-size:14px;';
          closeBtn.onclick = () => { btnDiv.remove(); resolve(false); };
          btnDiv.appendChild(closeBtn);
        }
      });
    } catch (err) {
      console.error('Google prompt error:', err);
      showAlert('Google Login Failed', 'Could not initialize Google Sign-In.');
      resolve(false);
    }
  };

  // ─── Google Sign-In for NATIVE ──────────────────────────────────────
  const googleLoginNative = async () => {
    try {
      if (!GoogleSignin) {
        return new Promise((resolve) => {
          Alert.alert(
            'Native Build Required',
            'Google Sign-In requires a native build. Would you like to simulate Google Login for development?',
            [
              {
                text: 'Cancel',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'Simulate',
                onPress: async () => {
                  try {
                    const mockToken = 'mock-developer@planetto.space-Developer User-dev12345';
                    const response = await apiClient.post('/auth/google', { idToken: mockToken });
                    if (response.data.success) {
                      setUser(response.data.data);
                      await AsyncStorage.setItem('@planetto_user', JSON.stringify(response.data.data));
                      resolve(true);
                    } else {
                      resolve(false);
                    }
                  } catch (err) {
                    console.error('Mock Google login error:', err);
                    showAlert('Mock Login Failed', err.response?.data?.message || 'Network error');
                    resolve(false);
                  }
                },
              },
            ]
          );
        });
      }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) throw new Error('No ID token received from Google');

      const response = await apiClient.post('/auth/google', { idToken });
      
      if (response.data.success) {
        setUser(response.data.data);
        await AsyncStorage.setItem('@planetto_user', JSON.stringify(response.data.data));
        return true;
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      showAlert('Google Login Failed', 'Could not complete Google Sign-In.');
      return false;
    }
  };

  // ─── Unified Google Login ───────────────────────────────────────────
  const googleLogin = isWeb ? googleLoginWeb : googleLoginNative;

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('@planetto_user');
      if (!isWeb && GoogleSignin) {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        }
      }
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return false;
    try {
      const response = await apiClient.patch(`/auth/profile/${user.id}`, updates);
      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        await AsyncStorage.setItem('@planetto_user', JSON.stringify(updatedUser));
        return true;
      }
    } catch (e) {
      console.error('Failed to update profile', e);
      showAlert('Update Failed', e.response?.data?.message || 'Network error');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
