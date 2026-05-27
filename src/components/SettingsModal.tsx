import React, { useState } from 'react';
import {
  Modal, View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEME_COLORS } from '@/constants/themeColors';
import { AppText } from '@/components/AppText';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { fontColor, volumeQuickCapture, setFontColor, setVolumeQuickCapture } = useSettingsStore();
  const [pendingColor, setPendingColor] = useState(fontColor);

  function handleOpen() {
    setPendingColor(fontColor); // reset to current on open
  }

  async function handleConfirm() {
    await setFontColor(pendingColor);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.sheet} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>設定</Text>

          {/* Volume quick capture */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <AppText style={styles.label}>音量鍵快速拍照</AppText>
              <Text style={styles.hint}>連按兩次音量減少鍵即開啟相機</Text>
            </View>
            <Switch
              testID="volume-quick-capture-switch"
              value={volumeQuickCapture}
              onValueChange={setVolumeQuickCapture}
            />
          </View>

          {/* Font color */}
          <AppText style={styles.colorSectionLabel}>主題顏色</AppText>
          <View style={styles.colorGrid}>
            {THEME_COLORS.map((c) => {
              const selected = pendingColor === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  testID={`color-swatch-${c.value}`}
                  onPress={() => setPendingColor(c.value)}
                  activeOpacity={0.75}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: c.value,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: selected ? 3 : 0,
                    borderColor: '#fff',
                    elevation: selected ? 5 : 0,
                  }}>
                    {selected ? <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm + close */}
          <TouchableOpacity testID="color-confirm-btn" onPress={handleConfirm}>
            <View style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 12,
              backgroundColor: pendingColor,
            }}>
              <Text style={styles.confirmBtnText}>確認套用</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity testID="settings-close-btn" style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>關閉</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#111' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  labelGroup: { flex: 1, marginRight: 12 },
  label: { fontSize: 20, fontWeight: '700' },
  hint: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 12 },
  colorSectionLabel: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  closeBtn: { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
});
