import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDBContext, useDBReload } from '@/providers/DBProvider';
import { exportBackup, importBackup } from '@/services/backupService';

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 200, useNativeDriver: false }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={{ width: '100%', marginTop: 16 }}>
      <View style={s.track}>
        <Animated.View style={[s.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={s.pct}>{Math.round(progress)}%</Text>
    </View>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

type Mode = 'export' | 'import';
type Step = 'idle' | 'picking' | 'running' | 'done' | 'error';

interface Props {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
}

export function BackupRestoreModal({ visible, mode, onClose }: Props) {
  const { fontColor } = useSettingsStore();
  const db = useDBContext();
  const reloadDB = useDBReload();
  const [step, setStep]         = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [savedName, setSavedName] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');

  useEffect(() => {
    if (visible) {
      setStep('idle');
      setProgress(0);
      setSavedName('');
      setErrorMsg('');
      if (mode === 'export') startExport();
      else startImport();
    }
  }, [visible]);

  // ── Export ──────────────────────────────────────────────────────────────────

  async function startExport() {
    try {
      const date     = new Date().toISOString().slice(0, 10);
      const filename = `sparkplate_backup_${date}.zip`;

      if (Platform.OS === 'android') {
        // Step 1: let user pick destination folder via SAF
        setStep('picking');
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) { onClose(); return; }

        // Step 2: generate ZIP with progress
        setStep('running');
        setProgress(0);
        const zipPath = await exportBackup((p) => setProgress(p * 0.85)); // 0-85%

        // Step 3: create file in chosen folder and write
        setProgress(88);
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          filename,
          'application/zip',
        );
        const base64 = await FileSystem.readAsStringAsync(zipPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setProgress(94);
        await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Clean up cache
        await FileSystem.deleteAsync(zipPath, { idempotent: true });
        setProgress(100);
        setSavedName(filename);
        setStep('done');

      } else {
        // iOS: generate ZIP then use share sheet to save
        setStep('running');
        setProgress(0);
        const zipPath = await exportBackup(setProgress);
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) throw new Error('此裝置不支援分享功能');
        await Sharing.shareAsync(zipPath, {
          mimeType: 'application/zip',
          dialogTitle: '選擇備份儲存位置',
          UTI: 'public.zip-archive',
        });
        setSavedName(filename);
        setStep('done');
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? '匯出失敗');
      setStep('error');
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function startImport() {
    try {
      setStep('picking');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) { onClose(); return; }

      const file = result.assets[0];
      setStep('running');
      setProgress(0);
      // 匯入是直接在硬碟上覆蓋 SQLite 檔案，覆蓋前必須先關閉現有連線，
      // 否則寫入時檔案正被佔用。但 closeAsync() 之後這個連線物件永久失效，
      // 若不重新開一個新連線並更新回 DBProvider 的 context，同一次 App
      // 執行期間所有後續查詢都會撞到「Access to closed resource」，只能
      // 逼使用者整個關掉 App 重開才能恢復。
      await db?.closeAsync();
      await importBackup(file.uri, setProgress);
      await reloadDB();
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e?.message ?? '匯入失敗');
      setStep('error');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isExport = mode === 'export';
  const title    = isExport ? '匯出備份' : '匯入備份';

  // 這裡刻意不用 <Modal>：這個元件已經是在另一個 <Modal>（SettingsModal）
  // 裡面開啟的，內部又會呼叫 DocumentPicker / Sharing（也是原生 Modal）。
  // iOS 上巢狀開三層原生 Modal 會讓畫面卡死不回應（匯入時實測會卡在選完
  // 檔案之後）。改成一般的絕對定位 View 疊在最上層可以避免這個問題。
  if (!visible) return null;

  return (
    <>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <AppText style={s.title}>{title}</AppText>

          {/* Waiting for folder/file picker */}
          {step === 'picking' && (
            <View style={s.center}>
              <Text style={s.label}>
                {isExport ? '請選擇備份儲存位置…' : '請選擇要匯入的備份檔案…'}
              </Text>
            </View>
          )}

          {/* Running with progress */}
          {step === 'running' && (
            <View style={s.center}>
              <Text style={s.label}>
                {isExport ? '打包備份中，請稍候…' : '還原資料中，請稍候…'}
              </Text>
              <ProgressBar progress={progress} color={fontColor} />
            </View>
          )}

          {/* Done */}
          {step === 'done' && (
            <View style={s.center}>
              <AppText style={s.doneTitle}>
                {isExport ? '備份完成！' : '匯入完成！'}
              </AppText>
              {isExport
                ? <Text style={s.hint}>已儲存：{savedName}</Text>
                : <Text style={s.hint}>資料已還原，請重新啟動 APP 使資料完整生效</Text>
              }
              <TouchableOpacity
                style={[s.btn, { backgroundColor: fontColor }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>完成</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error */}
          {step === 'error' && (
            <View style={s.center}>
              <Text style={s.errorText}>{errorMsg}</Text>
              <View style={s.row}>
                <TouchableOpacity style={s.outlineBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={s.outlineBtnText}>關閉</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: fontColor, flex: 1 }]}
                  onPress={isExport ? startExport : startImport}
                  activeOpacity={0.8}
                >
                  <Text style={s.btnText}>重試</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Idle placeholder */}
          {step === 'idle' && <View style={{ height: 60 }} />}
        </View>
      </View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 999,
    elevation: 999,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  center: { alignItems: 'center' },
  label: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  track: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden', width: '100%' },
  fill: { height: 10 },
  pct: { textAlign: 'right', fontSize: 12, color: '#888', marginTop: 4 },
  doneTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 6 },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorText: { fontSize: 13, color: '#e53935', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  outlineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
  },
  outlineBtnText: { color: '#666', fontWeight: '600' },
  row: { flexDirection: 'row', width: '100%', marginTop: 4 },
});
