import React, { useState } from 'react';
import {
  Modal, View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEME_COLORS } from '@/constants/themeColors';
import { AppText } from '@/components/AppText';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';
import { AdBanner } from '@/components/AdBanner';
import { useProGate } from '@/hooks/useProGate';
import { purchasePro, restorePurchases } from '@/services/purchases';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const {
    fontColor, openCameraOnStart, autoSavePhoto, volumeQuickCapture,
    setFontColor, setOpenCameraOnStart, setAutoSavePhoto, setVolumeQuickCapture,
    setProUnlocked,
  } = useSettingsStore();
  const { isProUnlocked, requirePro } = useProGate();
  const [pendingColor, setPendingColor] = useState(fontColor);
  const [backupMode, setBackupMode]     = useState<'export' | 'import' | null>(null);
  const [purchasing, setPurchasing]     = useState(false);
  const [restoring, setRestoring]       = useState(false);
  const insets = useSafeAreaInsets();

  function handleOpen() {
    setPendingColor(fontColor); // reset to current on open
  }

  async function handleConfirm() {
    if (!requirePro('主題色')) return;
    await setFontColor(pendingColor);
    onClose();
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const isPro = await purchasePro();
      if (isPro) {
        await setProUnlocked(true);
        Alert.alert('升級成功', 'Pro 功能已啟用');
      }
    } catch (e) {
      Alert.alert('升級失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const isPro = await restorePurchases();
      await setProUnlocked(isPro);
      Alert.alert(isPro ? '還原成功' : '沒有找到可還原的購買紀錄', isPro ? 'Pro 功能已啟用' : '若你曾經購買過，請確認使用的是同一個 Apple ID');
    } catch (e) {
      Alert.alert('還原失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setRestoring(false);
    }
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

          {/* Pro 解鎖 */}
          <AppText style={styles.colorSectionLabel}>PRO 解鎖</AppText>
          <View style={styles.row}>
            {Platform.OS === 'android' ? (
              <AppText style={styles.proBadge}>✓ Pro 已解鎖（Android 版全功能免費開放）</AppText>
            ) : isProUnlocked ? (
              <AppText style={styles.proBadge}>✓ Pro 已解鎖</AppText>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.hint}>升級 Pro 即可解鎖分享、截圖、開機用相機、拍照自動下載、主題色、匯出匯入，並移除廣告</Text>
                <TouchableOpacity onPress={handlePurchase} disabled={purchasing} activeOpacity={0.8}>
                  <View style={[styles.backupBtnFill, { backgroundColor: fontColor, marginTop: 12 }]}>
                    <Text style={styles.confirmBtnText}>{purchasing ? '處理中…' : '升級 Pro'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.8} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ color: fontColor, fontSize: 13, fontWeight: '600' }}>{restoring ? '還原中…' : '恢復購買'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Open camera on start */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <AppText style={styles.label}>開啟時直接用相機打開</AppText>
              <Text style={styles.hint}>開啟 APP 後自動跳過首頁，直接開啟相機</Text>
            </View>
            <Switch
              testID="open-camera-on-start-switch"
              value={openCameraOnStart}
              onValueChange={(v) => { if (!requirePro('開啟時直接用相機打開')) return; setOpenCameraOnStart(v); }}
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
              onValueChange={(v) => { if (!requirePro('拍照時自動下載照片')) return; setAutoSavePhoto(v); }}
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
            onPress={() => { if (!requirePro('匯出備份')) return; setBackupMode('export'); }}
            activeOpacity={0.8}
          >
            <View style={[styles.backupBtnFill, { backgroundColor: fontColor }]}>
              <Text style={styles.confirmBtnText}>匯出備份（ZIP）</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            testID="backup-import-btn"
            onPress={() => { if (!requirePro('匯入備份')) return; setBackupMode('import'); }}
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

          <AdBanner />
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
  proBadge: { fontSize: 15, fontWeight: '600', color: '#43a047' },
});
