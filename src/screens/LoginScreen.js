import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import { FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const logoFull = require('../../assets/logo_full.png');

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupName.trim()) errs.signupName = 'Name is required.';
    if (!signupEmail.trim()) errs.signupEmail = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupEmail)) errs.signupEmail = 'Enter a valid email.';
    if (!signupPassword) errs.signupPassword = 'Password is required.';
    else if (signupPassword.length < 6) errs.signupPassword = 'Min 6 characters.';
    if (signupConfirm !== signupPassword) errs.signupConfirm = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;
    setIsLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('MainApp');
    }, 1200);
  };

  const handleSignup = () => {
    if (!validateSignup()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Account Created!', `Welcome aboard, ${signupName.split(' ')[0]}! Your Planetto account is ready.`, [
        { text: 'Launch App', onPress: () => navigation.replace('MainApp') },
      ]);
    }, 1200);
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Your Email', 'Type your email address above, then tap "Forgot Password" to receive a reset link.');
      return;
    }
    Alert.alert('Reset Link Sent', `A password reset link has been sent to ${email}. Check your inbox.`);
  };

  const InputField = ({ label, value, onChangeText, placeholder, secure, keyboardType, errorKey, icon, onToggleSecure }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, {
        backgroundColor: colors.surface,
        borderColor: errors[errorKey] ? colors.danger : colors.surfaceBorder,
      }]}>
        <FontAwesome5 name={icon} size={14} color={errors[errorKey] ? colors.danger : colors.textMuted} style={{ marginRight: 12 }} />
        <TextInput
          style={[styles.inputInner, { color: colors.text, flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }));
          }}
          secureTextEntry={secure && !showPassword}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
        />
        {onToggleSecure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {errors[errorKey] && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={logoFull} style={{ width: 150, height: 150 }} resizeMode="contain" />
          </View>

          {/* Mode Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && { backgroundColor: colors.primary }]}
              onPress={() => { setMode('login'); setErrors({}); }}
            >
              <Text style={[FONTS.subtitle, { fontSize: 10, color: mode === 'login' ? '#FFF' : colors.textMuted }]}>SIGN IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && { backgroundColor: colors.primary }]}
              onPress={() => { setMode('signup'); setErrors({}); }}
            >
              <Text style={[FONTS.subtitle, { fontSize: 10, color: mode === 'signup' ? '#FFF' : colors.textMuted }]}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>

          {mode === 'login' ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>System Access</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Enter your credentials to synchronize.</Text>

              <InputField
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                placeholder="alex@planetto.space"
                keyboardType="email-address"
                errorKey="email"
                icon="envelope"
              />
              <InputField
                label="PASSWORD"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secure
                errorKey="password"
                icon="lock"
                onToggleSecure={() => setShowPassword(!showPassword)}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 30, marginTop: -10 }}>
                <Text style={[FONTS.subtitle, { color: colors.primary, fontSize: 9 }]}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
                <LinearGradient colors={colors.gradientPrimary} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>INITIALIZE LAUNCH</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick demo access */}
              <TouchableOpacity
                onPress={() => navigation.replace('MainApp')}
                style={[styles.demoBtn, { borderColor: colors.surfaceBorder }]}
              >
                <FontAwesome5 name="rocket" size={11} color={colors.textMuted} />
                <Text style={[FONTS.subtitle, { color: colors.textMuted, fontSize: 9, marginLeft: 8 }]}>DEMO MODE — SKIP LOGIN</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Join Planetto</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create your academic command account.</Text>

              <InputField
                label="FULL NAME"
                value={signupName}
                onChangeText={setSignupName}
                placeholder="Alex Mercer"
                errorKey="signupName"
                icon="user"
              />
              <InputField
                label="EMAIL ADDRESS"
                value={signupEmail}
                onChangeText={setSignupEmail}
                placeholder="alex@planetto.space"
                keyboardType="email-address"
                errorKey="signupEmail"
                icon="envelope"
              />
              <InputField
                label="PASSWORD"
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="Min 6 characters"
                secure
                errorKey="signupPassword"
                icon="lock"
                onToggleSecure={() => setShowPassword(!showPassword)}
              />
              <InputField
                label="CONFIRM PASSWORD"
                value={signupConfirm}
                onChangeText={setSignupConfirm}
                placeholder="Re-enter password"
                secure
                errorKey="signupConfirm"
                icon="lock"
              />

              <TouchableOpacity style={styles.loginBtn} onPress={handleSignup} disabled={isLoading}>
                <LinearGradient colors={colors.gradientPrimary} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>CREATE ACCOUNT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
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
