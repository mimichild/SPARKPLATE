import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/SettingsModal';
import { AppText } from '@/components/AppText';

export default function SplashScreen() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
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
        style={styles.startBtn}
        onPress={() => router.replace('/(tabs)/today')}
        activeOpacity={0.85}
      >
        <Text style={styles.startBtnText}>開始使用</Text>
      </TouchableOpacity>

      {showSettings ? <SettingsModal visible onClose={() => setShowSettings(false)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: 3, marginBottom: 16 },
  tagline: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22 },
  settingsBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginBottom: 24 },
  settingsBtnText: { fontSize: 14, color: '#888' },
  sisterApps: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 32 },
  sisterLink: { fontSize: 13, color: '#aaa', textDecorationLine: 'underline' },
  startBtn: {
    backgroundColor: '#111', borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginBottom: 48,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
});
