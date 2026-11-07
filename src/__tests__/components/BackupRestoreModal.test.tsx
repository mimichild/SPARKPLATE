jest.mock('expo-document-picker');
jest.mock('expo-sharing');
jest.mock('@/stores/settingsStore');
jest.mock('@/services/backupService');
jest.mock('@/providers/DBProvider', () => ({
  useDBContext: jest.fn(),
  useDBReload: jest.fn(),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDBContext, useDBReload } from '@/providers/DBProvider';
import { importBackup, exportBackup } from '@/services/backupService';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';

const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const mockUseSettingsStore = useSettingsStore as unknown as jest.Mock;
const mockUseDBContext = useDBContext as jest.Mock;
const mockUseDBReload = useDBReload as jest.Mock;
const mockImportBackup = importBackup as jest.Mock;

describe('BackupRestoreModal — 匯入流程', () => {
  const closeAsync = jest.fn().mockResolvedValue(undefined);
  const reloadDB = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({ fontColor: '#000' });
    mockUseDBContext.mockReturnValue({ closeAsync });
    mockUseDBReload.mockReturnValue(reloadDB);
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///backup.zip' }],
    });
    mockImportBackup.mockResolvedValue(undefined);
  });

  it('匯入成功後會關閉舊連線、匯入、再重新開一個新連線（不需要使用者重開 App）', async () => {
    render(<BackupRestoreModal visible mode="import" onClose={jest.fn()} />);

    await waitFor(() => expect(mockImportBackup).toHaveBeenCalled());
    await waitFor(() => expect(reloadDB).toHaveBeenCalled());

    // closeAsync 必須在 importBackup 之前，reloadDB 必須在 importBackup 之後，
    // 順序錯了會導致覆蓋檔案時連線還占用著，或匯入後 context 還停留在已關閉的連線上。
    const closeOrder  = closeAsync.mock.invocationCallOrder[0];
    const importOrder = mockImportBackup.mock.invocationCallOrder[0];
    const reloadOrder = reloadDB.mock.invocationCallOrder[0];
    expect(closeOrder).toBeLessThan(importOrder);
    expect(importOrder).toBeLessThan(reloadOrder);
  });
});

describe('BackupRestoreModal — Android 匯出流程', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({ fontColor: '#000' });
    mockUseDBContext.mockReturnValue({ closeAsync: jest.fn() });
    mockUseDBReload.mockReturnValue(jest.fn());
    (exportBackup as jest.Mock).mockResolvedValue('file:///docs/sparkplate_backup_2026-11-07.zip');
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('匯出後改用分享面板儲存，不再整包讀成字串寫入資料夾（避免 OutOfMemoryError）', async () => {
    const readSpy = jest.spyOn(FileSystem, 'readAsStringAsync' as any);
    render(<BackupRestoreModal visible mode="export" onClose={jest.fn()} />);

    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///docs/sparkplate_backup_2026-11-07.zip',
      expect.objectContaining({ mimeType: 'application/zip' }),
    ));
    expect(readSpy).not.toHaveBeenCalled();
  });
});
