import React, { useState } from 'react';
import {
  Modal, View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEME_COLORS } from '@/constants/themeColors';
import { AppText } from '@/components/AppText';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const {
    fontColor, openCameraOnStart, autoSavePhoto, volumeQuickCapture,
    setFontColor, setOpenCameraOnStart, setAutoSavePhoto, setVolumeQuickCapture,
  } = useSettingsStore();
  const [pendingColor, setPendingColor] = useState(fontColor);
  const [backupMode, setBackupMode]     = useState<'export' | 'import' | null>(null);
  const insets = useSafeAreaInsets();

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
        <ScrollView contentContainerStyle={[styles.sheet, { paddingTop: insets.top + 24 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>設定</Text>

          {/* Open camera on start */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <AppText style={styles.label}>開啟時直接用相機打開</AppText>
              <Text style={styles.hint}>開啟 APP 後自動跳過首頁，直接開啟相機</Text>
            </View>
            <Switch
              testID="open-camera-on-start-switch"
              value={openCameraOnStart}
              onValueChange={setOpenCameraOnStart}
            />
          </View>

          {/* Auto save photo */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <AppText style={styles.label}>拍照時自動下載照片</AppText>
              <Text style={styles.hint}>每次拍照後自動將照片儲存到手機相簿</Text>
            </View>
            <Switch
              testID="auto-save-photo-switch"
              value={autoSavePhoto}
              onValueChange={setAutoSavePhoto}
            />
          </View>

          {/* Volume key quick capture */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <AppText style={styles.label}>音量鍵快門</AppText>
              <Text style={styles.hint}>拍照畫面開啟時，快速連按兩下音量鍵即可拍照</Text>
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

          {/* Backup & Restore */}
          <AppText style={styles.backupSectionLabel}>備份與還原</AppText>
          <TouchableOpacity
            testID="backup-export-btn"
            onPress={() => setBackupMode('export')}
            activeOpacity={0.8}
          >
            <View style={[styles.backupBtnFill, { backgroundColor: fontColor }]}>
              <Text style={styles.confirmBtnText}>匯出備份（ZIP）</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            testID="backup-import-btn"
            onPress={() => setBackupMode('import')}
            activeOpacity={0.8}
            style={{ marginTop: 10 }}
          >
            <View style={[styles.backupBtnOutline, { borderColor: fontColor }]}>
              <Text style={[styles.backupBtnOutlineText, { color: fontColor }]}>匯入備份（ZIP）</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.backupHint}>覆蓋：清除現有資料後還原</Text>

          <TouchableOpacity testID="settings-close-btn" style={[styles.closeBtn, { marginTop: 20 }]} onPress={onClose}>
            <Text style={styles.closeBtnText}>關閉</Text>
          </TouchableOpacity>

          {backupMode && (
            <BackupRestoreModal
              visible={!!backupMode}
              mode={backupMode}
              onClose={() => setBackupMode(null)}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingBottom: 48 },
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
  backupSectionLabel: { fontSize: 20, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  backupBtnFill: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backupBtnOutline: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, backgroundColor: '#fff' },
  backupBtnOutlineText: { fontSize: 15, fontWeight: '700' },
  backupHint: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 8, marginBottom: 4 },
});
