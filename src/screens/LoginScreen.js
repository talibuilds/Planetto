import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const logoImage = require('../../assets/logo.png');

const InputField = ({ label, value, onChangeText, placeholder, secure, keyboardType, error, icon, onToggleSecure, showPassword, colors }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    <View style={[styles.inputWrapper, {
      backgroundColor: colors.surface,
      borderColor: error ? colors.danger : colors.surfaceBorder,
    }]}>
      <FontAwesome5 name={icon} size={14} color={error ? colors.danger : colors.textMuted} style={{ marginRight: 12 }} />
      <TextInput
        style={[styles.inputInner, { color: colors.text, flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !showPassword}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
      {onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure}>
          <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    {error && (
      <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
    )}
  </View>
);

const LoginScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!emailRegex.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupName.trim()) errs.signupName = 'Name is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail.trim()) errs.signupEmail = 'Email is required.';
    else if (!emailRegex.test(signupEmail.trim())) errs.signupEmail = 'Enter a valid email.';
    if (!signupPassword) errs.signupPassword = 'Password is required.';
    else if (signupPassword.length < 6) errs.signupPassword = 'Min 6 characters.';
    if (signupConfirm !== signupPassword) errs.signupConfirm = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      navigation.replace('MainApp');
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    setIsLoading(true);
    const success = await register(signupName, signupEmail, signupPassword);
    setIsLoading(false);
    if (success) {
      if (Platform.OS === 'web') {
        window.alert(`Account Created! Welcome aboard, ${signupName.split(' ')[0]}! Your Planetto account is ready.`);
        navigation.replace('MainApp');
      } else {
        Alert.alert('Account Created!', `Welcome aboard, ${signupName.split(' ')[0]}! Your Planetto account is ready.`, [
          { text: 'Launch App', onPress: () => navigation.replace('MainApp') },
        ]);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const success = await googleLogin();
    setIsLoading(false);
    if (success) {
      navigation.replace('MainApp');
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Your Email', 'Type your email address above, then tap "Forgot Password" to receive a reset link.');
      return;
    }
    Alert.alert('Reset Link Sent', `A password reset link has been sent to ${email}. Check your inbox.`);
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={[
            styles.scrollContent, 
            mode === 'signup' && { paddingVertical: 12, paddingBottom: 400 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo - only show in login mode to save vertical space */}
          {mode === 'login' && (
            <View style={styles.logoContainer}>
              <Image
                source={logoImage}
                style={{ width: 180, height: 180 }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Mode Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && { backgroundColor: colors.primary }]}
              onPress={() => { setMode('login'); setErrors({}); }}
            >
              <Text style={[FONTS.subtitle, { fontSize: 10, color: mode === 'login' ? '#FFF' : colors.textMuted }]}>LOGIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && { backgroundColor: colors.primary }]}
              onPress={() => { setMode('signup'); setErrors({}); }}
            >
              <Text style={[FONTS.subtitle, { fontSize: 10, color: mode === 'signup' ? '#FFF' : colors.textMuted }]}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {mode === 'login' ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Login</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Enter your details to login.</Text>

              <InputField
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                }}
                placeholder="alex@planetto.space"
                keyboardType="email-address"
                error={errors.email}
                icon="envelope"
                colors={colors}
              />
              <InputField
                label="PASSWORD"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                placeholder="••••••••"
                secure
                error={errors.password}
                icon="lock"
                onToggleSecure={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                colors={colors}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 30, marginTop: -10 }}>
                <Text style={[FONTS.subtitle, { color: colors.primary, fontSize: 9 }]}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
                <LinearGradient colors={colors.gradientPrimary} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>LOGIN</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGoogleLogin}
                style={[styles.demoBtn, { borderColor: colors.surfaceBorder, backgroundColor: '#FFF' }]}
              >
                <FontAwesome5 name="google" size={13} color="#DB4437" />
                <Text style={[FONTS.subtitle, { color: '#000', fontSize: 11, marginLeft: 8 }]}>CONTINUE WITH GOOGLE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create your account.</Text>

              <InputField
                label="FULL NAME"
                value={signupName}
                onChangeText={(t) => {
                  setSignupName(t);
                  if (errors.signupName) setErrors(prev => ({ ...prev, signupName: null }));
                }}
                placeholder="Alex Mercer"
                error={errors.signupName}
                icon="user"
                colors={colors}
              />
              <InputField
                label="EMAIL ADDRESS"
                value={signupEmail}
                onChangeText={(t) => {
                  setSignupEmail(t);
                  if (errors.signupEmail) setErrors(prev => ({ ...prev, signupEmail: null }));
                }}
                placeholder="alex@planetto.space"
                keyboardType="email-address"
                error={errors.signupEmail}
                icon="envelope"
                colors={colors}
              />
              <InputField
                label="PASSWORD"
                value={signupPassword}
                onChangeText={(t) => {
                  setSignupPassword(t);
                  if (errors.signupPassword) setErrors(prev => ({ ...prev, signupPassword: null }));
                }}
                placeholder="Min 6 characters"
                secure
                error={errors.signupPassword}
                icon="lock"
                onToggleSecure={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                colors={colors}
              />
              <InputField
                label="CONFIRM PASSWORD"
                value={signupConfirm}
                onChangeText={(t) => {
                  setSignupConfirm(t);
                  if (errors.signupConfirm) setErrors(prev => ({ ...prev, signupConfirm: null }));
                }}
                placeholder="Re-enter password"
                secure
                error={errors.signupConfirm}
                icon="lock"
                colors={colors}
              />

              <TouchableOpacity style={styles.loginBtn} onPress={handleSignup} disabled={isLoading}>
                <LinearGradient colors={colors.gradientPrimary} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>SIGN UP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 28 },
  logoContainer: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  modeTabs: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 28 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  title: { ...FONTS.h2, fontSize: 24, marginBottom: 6 },
  subtitle: { ...FONTS.body1, marginBottom: 28 },
  inputContainer: { marginBottom: 18 },
  label: { ...FONTS.subtitle, marginBottom: 8, fontSize: 10 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputInner: { ...FONTS.body1, fontSize: 14 },
  errorText: { ...FONTS.body2, fontSize: 11, marginTop: 5, marginLeft: 2 },
  loginBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  loginBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  loginBtnText: { ...FONTS.subtitle, fontSize: 13, letterSpacing: 1.5 },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});

export default LoginScreen;
