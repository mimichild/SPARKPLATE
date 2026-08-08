import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/SettingsModal';
import { AppText } from '@/components/AppText';
import { AdBanner } from '@/components/AdBanner';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SplashScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    openCameraOnStart, hydrated, autoOpenFired, triggerCameraOpen, markAutoOpenFired,
  } = useSettingsStore();

  useEffect(() => {
    if (!hydrated) return;
    if (openCameraOnStart && !autoOpenFired) {
      markAutoOpenFired();
      triggerCameraOpen();
      router.replace('/(tabs)/gallery');
    }
  }, [hydrated, openCameraOnStart, autoOpenFired]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <AppText style={styles.title}>SPARK PLATE</AppText>
          <AppText style={styles.tagline}>找回讓自己心動的自己，我要見證我的蛻變</AppText>
        </View>

        <TouchableOpacity
          testID="settings-btn"
          onPress={() => setShowSettings(true)}
          activeOpacity={0.85}
        >
          <View style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>設定</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="start-btn"
          onPress={() => router.push('/(tabs)/gallery')}
          activeOpacity={0.85}
        >
          <View style={styles.startBtn}>
            <Text style={styles.startBtnText}>開始使用</Text>
          </View>
        </TouchableOpacity>
      </View>

      <AdBanner />

      {showSettings ? <SettingsModal visible onClose={() => setShowSettings(false)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAAFB3' },
  content: { flex: 1, paddingHorizontal: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: 3, marginBottom: 16, color: '#fff' },
  tagline: { fontSize: 14, color: '#DDDDDD', textAlign: 'center', lineHeight: 22 },
  settingsBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  settingsBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  startBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 48 },
  startBtnText: { color: '#EAAFB3', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
});
