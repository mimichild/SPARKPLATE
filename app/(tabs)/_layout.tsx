import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, PanResponder, Text } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

function BackHeader() {
  const insets = useSafeAreaInsets();
  const { fontColor, triggerExportOpen } = useSettingsStore();
  const pathname = usePathname();
  const isGallery = pathname.includes('gallery');

  return (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: fontColor }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={goBack}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 24 }}
      >
        <Text style={styles.backText}>返回</Text>
      </TouchableOpacity>
      {isGallery && (
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={triggerExportOpen}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 8 }}
        >
          <Text style={styles.backText}>分享</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { fontColor } = useSettingsStore();
  const insets = useSafeAreaInsets();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 20 && Math.abs(gs.dy) < Math.abs(gs.dx) && gs.moveX < 80,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 80 && gs.vx > 0.3) {
          goBack();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <BackHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
          tabBarStyle: {
            backgroundColor: fontColor,
            borderTopWidth: 0,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarItemStyle: { justifyContent: 'center', paddingBottom: 12 },
          tabBarLabelStyle: { fontSize: 16, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="gallery" options={{ title: '照片牆', tabBarLabel: '照片', tabBarIcon: () => null }} />
        <Tabs.Screen name="filter" options={{ title: '標籤', tabBarLabel: '標籤', tabBarIcon: () => null }} />
        <Tabs.Screen name="today" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  shareBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
