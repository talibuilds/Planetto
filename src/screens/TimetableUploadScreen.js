import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import TextRecognition from '@react-native-ml-kit/text-recognition';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { reconstructTableFromOCR } from '../utils/ocrParser';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TYPE_COLORS = { THEORY: '#6366F1', LAB: '#10B981', TUTORIAL: '#F59E0B' };
const TYPE_ICONS  = { THEORY: 'chalkboard-teacher', LAB: 'flask', TUTORIAL: 'book-open' };

// ─── Single Class Preview Card (Editable) ─────────────────────────────────────
const PreviewCard = ({ entry, colors, onChange }) => {
  const typeColor = TYPE_COLORS[entry.type] || '#6366F1';
  return (
    <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <FontAwesome5 name={TYPE_ICONS[entry.type] || 'book'} size={11} color={typeColor} />
          <Text style={[styles.typeLabel, { color: typeColor }]}>{entry.type}</Text>
        </View>
        <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{entry.dayOfWeek}</Text>
      </View>

      <TextInput
        style={[styles.subjectText, { color: colors.text, padding: 0, margin: 0 }]}
        value={entry.subject}
        onChangeText={(text) => onChange('subject', text)}
        multiline
        placeholder="Subject Name"
        placeholderTextColor={colors.textMuted}
      />

      <TextInput
        style={[styles.codeText, { color: colors.primary, padding: 0, margin: 0, marginBottom: 8 }]}
        value={entry.code || ''}
        onChangeText={(text) => onChange('code', text)}
        placeholder="Short Code (e.g. ADA)"
        placeholderTextColor={colors.textMuted}
      />

      <View style={styles.detailRow}>
        <FontAwesome5 name="clock" size={11} color={colors.textMuted} />
        <TextInput
          style={[styles.detailText, { color: colors.textSecondary, padding: 0, margin: 0 }]}
          value={`${entry.startTime} – ${entry.endTime}`}
          onChangeText={(text) => {
            const parts = text.split('–').map(p => p.trim());
            if (parts.length === 2) {
              onChange('startTime', parts[0]);
              onChange('endTime', parts[1]);
            }
          }}
        />
      </View>

      <View style={styles.detailRow}>
        <FontAwesome5 name="user-tie" size={11} color={colors.textMuted} />
        <TextInput
          style={[styles.detailText, { color: colors.textSecondary, padding: 0, margin: 0 }]}
          value={entry.teacher || ''}
          onChangeText={(text) => onChange('teacher', text)}
          placeholder="Teacher Name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.detailRow}>
        <FontAwesome5 name="door-open" size={11} color={colors.textMuted} />
        <TextInput
          style={[styles.detailText, { color: colors.textSecondary, padding: 0, margin: 0 }]}
          value={entry.room || ''}
          onChangeText={(text) => onChange('room', text)}
          placeholder="Room Number"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TimetableUploadScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  // Phases: upload → ocr → parsing → preview → saving → done
  const [phase, setPhase] = useState('upload');
  const [parsedEntries, setParsedEntries] = useState([]);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // ─── Pick image from gallery ──────────────────────────────────────────────
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType
          ? [ImagePicker.MediaType.images]
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // ─── Take a photo with camera ────────────────────────────────────────────
  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera permission is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // ─── Pick document ────────────────────────────────────────────────────────
  const pickDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
      });
      if (!result.canceled && result.assets?.[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  // ─── CORE: Process image with on-device ML Kit OCR, then send text to AI ──
  const processImage = async (imageUri) => {
    setError(null);

    if (Platform.OS === 'web') {
      // WEB FALLBACK: Send image directly to backend since ML Kit is native-only
      setPhase('parsing');
      setStatusMsg('AI is analyzing your timetable image directly (Web Mode)...');

      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('timetable', blob, 'timetable.jpg');

        const apiResponse = await apiClient.post('/timetable/parse', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Image upload takes a bit longer
        });

        if (apiResponse.data.success && apiResponse.data.data.length > 0) {
          const entries = apiResponse.data.data;
          entries.sort((a, b) => {
            const di = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
            if (di !== 0) return di;
            return a.startTime.localeCompare(b.startTime);
          });
          setParsedEntries(entries);
          setPhase('preview');
        } else {
          setError('AI could not find classes in the image. Try a clearer image.');
          setPhase('upload');
        }
      } catch (e) {
        console.error('Web AI parse error:', e);
        const msg = e.response?.data?.error || e.message || 'Failed to parse timetable image';
        setError(msg);
        setPhase('upload');
      }
      return; // Exit here for web
    }

    // STEP 1: On-device OCR (instant, ~1-2 seconds) - ONLY FOR NATIVE
    setPhase('ocr');
    setStatusMsg('Extracting text from image...');

    let ocrResult;
    try {
      ocrResult = await TextRecognition.recognize(imageUri);
    } catch (e) {
      console.error('ML Kit OCR error:', e);
      setError('Failed to read text from image. Please try a clearer photo.');
      setPhase('upload');
      return;
    }

    if (!ocrResult || !ocrResult.blocks || ocrResult.blocks.length === 0) {
      setError('No text detected in image. Please use a clearer, well-lit photo.');
      setPhase('upload');
      return;
    }

    // STEP 2: Reconstruct table from bounding boxes
    const tableText = reconstructTableFromOCR(ocrResult);
    console.log('📋 OCR extracted ' + tableText.length + ' chars');

    if (tableText.length < 30) {
      setError('Very little text detected. Please try a clearer image with the full timetable visible.');
      setPhase('upload');
      return;
    }

    // STEP 3: Send tiny text string to backend AI (fast, ~2-5 seconds)
    setPhase('parsing');
    setStatusMsg('AI is organizing your classes...');

    try {
      const response = await apiClient.post('/timetable/parse-text', {
        text: tableText,
      }, {
        timeout: 30000, // 30 sec max — text parsing is fast
      });

      if (response.data.success && response.data.data.length > 0) {
        const entries = response.data.data;
        entries.sort((a, b) => {
          const di = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
          if (di !== 0) return di;
          return a.startTime.localeCompare(b.startTime);
        });
        setParsedEntries(entries);
        setPhase('preview');
      } else {
        setError('AI could not find classes in the text. Try a clearer image.');
        setPhase('upload');
      }
    } catch (e) {
      console.error('AI parse error:', e);
      const msg = e.response?.data?.error || e.message || 'Failed to parse timetable';
      setError(msg);
      setPhase('upload');
    }
  };

  // ─── Save confirmed entries ───────────────────────────────────────────────
  const confirmAndSave = async () => {
    setPhase('saving');
    try {
      const response = await apiClient.post('/timetable/confirm', {
        entries: parsedEntries,
      });
      if (response.data.success) {
        setPhase('done');
      } else {
        setError('Failed to save. Please try again.');
        setPhase('preview');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
      setPhase('preview');
    }
  };

  // ─── Group entries by day for preview ─────────────────────────────────────
  const entriesByDay = DAY_ORDER.reduce((acc, day) => {
    const dayEntries = parsedEntries.filter(e => e.dayOfWeek === day);
    if (dayEntries.length > 0) acc[day] = dayEntries;
    return acc;
  }, {});

  // ─── Render: Done ─────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'AA']}
            style={styles.successCircle}
          >
            <FontAwesome5 name="check" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.text }]}>Timetable Saved!</Text>
          <Text style={[styles.successSub, { color: colors.textMuted }]}>
            {parsedEntries.length} classes have been added to your schedule.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 32 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryBtnText}>View My Classes →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: OCR in progress ──────────────────────────────────────────────
  if (phase === 'ocr') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.parsingTitle, { color: colors.text }]}>
            📷 Reading timetable text...
          </Text>
          <Text style={[styles.parsingSub, { color: colors.textMuted }]}>
            On-device OCR — instant, no upload needed
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: AI parsing in progress ───────────────────────────────────────
  if (phase === 'parsing') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.parsingTitle, { color: colors.text }]}>
            🤖 AI is organizing classes...
          </Text>
          <Text style={[styles.parsingSub, { color: colors.textMuted }]}>
            Matching subjects to teachers.{'\n'}This takes just a few seconds.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Saving ───────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.parsingTitle, { color: colors.text }]}>Saving your timetable…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Preview (editable) ───────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhase('upload')} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={16} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI Extracted {parsedEntries.length} Classes
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              Tap any field to edit before saving
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
          {Object.entries(entriesByDay).map(([day, entries]) => (
            <View key={day} style={{ marginBottom: 20 }}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
                <View style={[styles.dayCount, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.dayCountText, { color: colors.primary }]}>
                    {entries.length} classes
                  </Text>
                </View>
              </View>
              {entries.map((entry, idx) => {
                const globalIdx = parsedEntries.findIndex(e => e === entry);
                return (
                  <PreviewCard
                    key={idx}
                    entry={entry}
                    colors={colors}
                    onChange={(field, value) => {
                      const newEntries = [...parsedEntries];
                      if (globalIdx !== -1) {
                        newEntries[globalIdx] = { ...newEntries[globalIdx], [field]: value };
                        setParsedEntries(newEntries);
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.surfaceBorder }]}
            onPress={() => setPhase('upload')}
          >
            <FontAwesome5 name="redo" size={14} color={colors.textSecondary} />
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Re-scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={confirmAndSave}
          >
            <FontAwesome5 name="save" size={14} color="#FFF" />
            <Text style={styles.primaryBtnText}>Save to My Classes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Upload phase (default) ───────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={16} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Timetable Scanner</Text>
      </View>

      <ScrollView contentContainerStyle={styles.uploadContent}>
        {/* Hero area */}
        <LinearGradient
          colors={[colors.primary + '18', 'transparent']}
          style={styles.heroCard}
        >
          <Text style={{ fontSize: 56, marginBottom: 12 }}>🤖</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Scan Your Timetable
          </Text>
          <Text style={[styles.heroSub, { color: colors.textMuted }]}>
            Take a photo or upload your college timetable.{'\n'}
            AI will extract all classes automatically.
          </Text>
        </LinearGradient>

        {/* Error box */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <FontAwesome5 name="exclamation-circle" size={14} color="#EF4444" />
            <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
          </View>
        )}

        {/* Upload options */}
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={takePhoto}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#6366F120' }]}>
              <FontAwesome5 name="camera" size={26} color="#6366F1" />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Take Photo</Text>
            <Text style={[styles.optionSub, { color: colors.textMuted }]}>Use camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#10B98120' }]}>
              <FontAwesome5 name="image" size={26} color="#10B981" />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Gallery</Text>
            <Text style={[styles.optionSub, { color: colors.textMuted }]}>JPG / PNG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={pickDoc}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#F59E0B20' }]}>
              <FontAwesome5 name="file-image" size={26} color="#F59E0B" />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Files</Text>
            <Text style={[styles.optionSub, { color: colors.textMuted }]}>Any image</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>⚡ How it works</Text>
          {[
            '📷 Step 1: ML Kit reads text on your phone (instant)',
            '🤖 Step 2: AI maps subjects → teachers (2-5 sec)',
            '✏️ Step 3: Review & edit before saving',
            '✅ Step 4: Save to My Classes',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: 16 }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>📸 Tips for best accuracy</Text>
          {[
            'Make sure the full timetable is visible',
            'Good lighting — avoid glare and shadows',
            'Hold the camera steady for sharp text',
            'Include the legend table at the bottom',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, gap: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },

  uploadContent: { paddingHorizontal: 20, paddingBottom: 60 },

  heroCard: {
    borderRadius: 24, padding: 28, alignItems: 'center',
    marginBottom: 24, marginTop: 8,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },

  optionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  optionCard: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    padding: 18, alignItems: 'center', gap: 10,
  },
  optionIcon: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  optionSub: { fontSize: 11, textAlign: 'center' },

  tipsCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  tipsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Preview
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dayTitle: { fontSize: 16, fontWeight: '800' },
  dayCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dayCountText: { fontSize: 11, fontWeight: '700' },

  previewCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 'auto',
  },
  typeLabel: { fontSize: 11, fontWeight: '700' },
  dayLabel: { fontSize: 12, fontWeight: '600', marginLeft: 'auto' },
  subjectText: { fontSize: 15, fontWeight: '800', marginBottom: 4, lineHeight: 20 },
  codeText: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  detailText: { fontSize: 12, flex: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 20,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, gap: 8,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 18, borderRadius: 16,
    borderWidth: 1.5, gap: 8,
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 14 },

  // Success
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // Parsing
  parsingTitle: { fontSize: 20, fontWeight: '800', marginTop: 24, textAlign: 'center' },
  parsingSub: { fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 22 },
});

export default TimetableUploadScreen;
