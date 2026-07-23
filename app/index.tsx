import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/SettingsModal';
import { AppText } from '@/components/AppText';
import { AdBanner } from '@/components/AdBanner';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SplashScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    fontColor, openCameraOnStart, hydrated, autoOpenFired, triggerCameraOpen, markAutoOpenFired,
    pendingSettingsOpen, clearPendingSettingsOpen,
  } = useSettingsStore();

  useEffect(() => {
    if (!hydrated) return;
    if (openCameraOnStart && !autoOpenFired) {
      markAutoOpenFired();
      triggerCameraOpen();
      router.replace('/(tabs)/gallery');
    }
  }, [hydrated, openCameraOnStart, autoOpenFired]);

  useEffect(() => {
    if (pendingSettingsOpen) {
      setShowSettings(true);
      clearPendingSettingsOpen();
    }
  }, [pendingSettingsOpen, clearPendingSettingsOpen]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <AppText style={styles.title}>SPARK PLATE</AppText>
          <AppText style={styles.tagline}>找回讓自己心動的自己，我要見證我的蛻變</AppText>
        </View>

        <TouchableOpacity
          testID="settings-btn"
          style={styles.settingsBtn}
          onPress={() => setShowSettings(true)}
        >
          <AppText style={styles.settingsBtnText}>⚙️ 設定</AppText>
        </TouchableOpacity>

        <View style={styles.sisterApps}>
          <TouchableOpacity onPress={() => Linking.openURL('sparkshape://')}>
            <AppText style={styles.sisterLink}>SPARK SHAPE</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('sparkfit://')}>
            <AppText style={styles.sisterLink}>SPARK FIT</AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          testID="start-btn"
          onPress={() => router.push('/(tabs)/gallery')}
          activeOpacity={0.85}
        >
          <View style={{ backgroundColor: fontColor, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 48 }}>
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: 3, marginBottom: 16 },
  tagline: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22 },
  settingsBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginBottom: 24 },
  settingsBtnText: { fontSize: 14, color: '#888' },
  sisterApps: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 32 },
  sisterLink: { fontSize: 13, color: '#aaa', textDecorationLine: 'underline' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
});
