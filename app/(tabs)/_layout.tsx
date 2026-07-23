import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, PanResponder, Text } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProGate } from '@/hooks/useProGate';
import { useIsPro } from '@/hooks/useIsPro';
import { AdBanner } from '@/components/AdBanner';

const TAB_BAR_BASE_HEIGHT = 56;

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

function BackHeader() {
  const insets = useSafeAreaInsets();
  const { fontColor, triggerExportOpen, triggerFilterOpen, triggerScreenshot } = useSettingsStore();
  const { requirePro } = useProGate();
  const pathname = usePathname();
  const isGallery = pathname.includes('gallery');
  const isFilter = pathname.includes('filter');

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
        <View style={styles.rightBtns}>
          <TouchableOpacity
            onPress={() => requirePro('截圖') && triggerScreenshot()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>截圖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => requirePro('分享') && triggerExportOpen()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
          >
            <Text style={styles.backText}>分享</Text>
          </TouchableOpacity>
        </View>
      )}
      {isFilter && (
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={triggerFilterOpen}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 8 }}
        >
          <Text style={styles.backText}>篩選 ▼</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { fontColor } = useSettingsStore();
  const isPro = useIsPro();
  const insets = useSafeAreaInsets();
  // 有廣告時分頁列下方接的是 AdBanner，不用留安全區；沒有廣告（Android 全部、iOS Pro）
  // 時分頁列才是螢幕真正的底部，要補回安全區高度。
  const bottomInset = isPro ? insets.bottom : 0;

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
      {/* 分頁列下方接了 AdBanner，不是螢幕最底部，所以不用另外加 insets.bottom。 */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
          tabBarStyle: {
            backgroundColor: fontColor,
            borderTopWidth: 0,
            height: TAB_BAR_BASE_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
          },
          tabBarItemStyle: { justifyContent: 'center' },
          tabBarLabelStyle: { fontSize: 16, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="gallery" options={{ title: '照片牆', tabBarLabel: '照片', tabBarIcon: () => null }} />
        <Tabs.Screen name="filter" options={{ title: '標籤', tabBarLabel: '標籤', tabBarIcon: () => null }} />
        <Tabs.Screen name="today" options={{ href: null }} />
      </Tabs>

      <AdBanner />
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
  rightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
