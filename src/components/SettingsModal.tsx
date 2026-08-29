import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Linking,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEME_COLORS } from '@/constants/themeColors';
import { AppText } from '@/components/AppText';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';
import { AdBanner } from '@/components/AdBanner';
import { useProGate } from '@/hooks/useProGate';
import {
  purchasePackage, restorePurchases, fetchPackages,
} from '@/services/purchases';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/monetization';

function packagePlanLabel(pkg: PurchasesPackage): string {
  if (pkg.packageType === 'ANNUAL') return 'SPARK PLATE Pro 年費方案';
  if (pkg.packageType === 'MONTHLY') return 'SPARK PLATE Pro 月費方案';
  return pkg.product.title;
}

function packagePeriodLabel(pkg: PurchasesPackage): string {
  if (pkg.packageType === 'ANNUAL') return '訂閱期間：每年自動續訂';
  if (pkg.packageType === 'MONTHLY') return '訂閱期間：每月自動續訂';
  const iso = pkg.product.subscriptionPeriod;
  if (iso === 'P1Y') return '訂閱期間：每年自動續訂';
  if (iso === 'P1M') return '訂閱期間：每月自動續訂';
  if (iso === 'P1W') return '訂閱期間：每週自動續訂';
  return '訂閱期間：自動續訂';
}

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
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const insets = useSafeAreaInsets();

  function handleOpen() {
    setPendingColor(fontColor); // reset to current on open
  }

  // 供「重新整理」按鈕使用；掛載時的載入邏輯在下面的 useEffect（多了 cancelled 防護）。
  function loadPackages() {
    setLoadingPackages(true);
    return fetchPackages()
      .then(pkgs => setPackages(pkgs))
      .finally(() => setLoadingPackages(false));
  }

  // 需要顯示各方案的標題／期間／價格（Apple Guideline 3.1.2(c)），只有面板開啟、
  // iOS 且尚未解鎖 Pro 時才需要載入。
  useEffect(() => {
    if (!visible || Platform.OS === 'android' || isProUnlocked) return;
    let cancelled = false;
    setLoadingPackages(true);
    fetchPackages()
      .then(pkgs => { if (!cancelled) setPackages(pkgs); })
      .finally(() => { if (!cancelled) setLoadingPackages(false); });
    return () => { cancelled = true; };
  }, [visible, isProUnlocked]);

  async function handleConfirm() {
    if (!requirePro('主題色')) return;
    await setFontColor(pendingColor);
    onClose();
  }

  async function handlePurchasePackage(pkg: PurchasesPackage) {
    setPurchasing(true);
    try {
      const isPro = await purchasePackage(pkg);
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

                {loadingPackages ? (
                  <Text style={styles.hint}>載入方案中…</Text>
                ) : packages.length > 0 ? (
                  packages.map(pkg => (
                    <View key={pkg.identifier} style={styles.planRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{packagePlanLabel(pkg)}</Text>
                        <Text style={styles.planMeta}>{packagePeriodLabel(pkg)}</Text>
                        <Text style={styles.planMeta}>價格：{pkg.product.priceString}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handlePurchasePackage(pkg)}
                        disabled={purchasing}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.backupBtnFill, { backgroundColor: fontColor, paddingHorizontal: 18, paddingVertical: 10 }]}>
                          <Text style={styles.confirmBtnText}>{purchasing ? '處理中…' : '訂閱'}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  // 方案資料抓不到時不能顯示可直接購買的按鈕：Apple Guideline 3.1.2(c)
                  // 要求購買前必須先看到方案標題／期間／價格，這裡沒有這些資料可顯示，
                  // 只能讓使用者重試，不能繞過去直接觸發購買。
                  <View style={{ marginTop: 12 }} testID="pro-plans-load-error">
                    <Text style={styles.hint}>暫時無法載入方案資訊，請稍後再試</Text>
                    <TouchableOpacity onPress={loadPackages} activeOpacity={0.8} testID="pro-plans-retry-btn">
                      <View style={[styles.backupBtnFill, { backgroundColor: fontColor, marginTop: 8 }]}>
                        <Text style={styles.confirmBtnText}>重新整理</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.8} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ color: fontColor, fontSize: 13, fontWeight: '600' }}>{restoring ? '還原中…' : '恢復購買'}</Text>
                </TouchableOpacity>

                <View style={styles.legalRow}>
                  <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
                    <Text style={styles.legalLink}>隱私權政策</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalDot}>·</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)} hitSlop={8}>
                    <Text style={styles.legalLink}>服務條款</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.legalHint}>訂閱將自動續訂，可隨時於 App Store 帳號設定中取消</Text>
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
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  planTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  planMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  legalLink: { fontSize: 12, color: '#666', textDecorationLine: 'underline' },
  legalDot: { fontSize: 12, color: '#ccc' },
  legalHint: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
});
