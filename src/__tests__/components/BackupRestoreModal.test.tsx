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
import { useSettingsStore } from '@/stores/settingsStore';
import { useDBContext, useDBReload } from '@/providers/DBProvider';
import { importBackup } from '@/services/backupService';
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
