jest.mock('expo-sqlite');
jest.mock('expo-file-system');
jest.mock('expo-image-manipulator');

import { openDatabaseAsync } from 'expo-sqlite';
import { makeDirectoryAsync, copyAsync, deleteAsync } from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import { savePhoto, deletePhoto, compressAndSave } from '@/services/photoService';

const mockOpenDb = openDatabaseAsync as jest.Mock;

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

describe('photoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDb.mockResolvedValue(mockDb);
    (manipulateAsync as jest.Mock).mockResolvedValue({
      uri: '/mock/compressed.jpg',
      width: 400,
      height: 400,
    });
  });

  describe('savePhoto', () => {
    it('calls manipulateAsync 4 times (one per size)', async () => {
      await savePhoto(mockDb as any, '/source/photo.jpg');
      expect(manipulateAsync).toHaveBeenCalledTimes(4);
    });

    it('calls makeDirectoryAsync to create photo directory', async () => {
      await savePhoto(mockDb as any, '/source/photo.jpg');
      expect(makeDirectoryAsync).toHaveBeenCalled();
    });

    it('calls copyAsync 4 times to persist each size', async () => {
      await savePhoto(mockDb as any, '/source/photo.jpg');
      expect(copyAsync).toHaveBeenCalledTimes(4);
    });

    it('inserts one row into photos table', async () => {
      await savePhoto(mockDb as any, '/source/photo.jpg');
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const sql: string = (mockDb.runAsync as jest.Mock).mock.calls[0][0];
      expect(sql).toContain('INSERT INTO photos');
    });

    it('returns a Photo object with all URIs', async () => {
      const photo = await savePhoto(mockDb as any, '/source/photo.jpg');
      expect(photo.id).toBeDefined();
      expect(photo.thumbUri).toBeDefined();
      expect(photo.gridUri).toBeDefined();
      expect(photo.detailUri).toBeDefined();
      expect(photo.backupLiteUri).toBeDefined();
      expect(photo.createdAt).toBeDefined();
    });
  });

  describe('deletePhoto', () => {
    it('deletes the photo record from photos table', async () => {
      await deletePhoto(mockDb as any, 'photo-123');
      const sql: string = (mockDb.runAsync as jest.Mock).mock.calls[0][0];
      expect(sql).toContain('DELETE FROM photos');
    });

    it('calls deleteAsync to remove photo directory', async () => {
      await deletePhoto(mockDb as any, 'photo-123');
      expect(deleteAsync).toHaveBeenCalled();
      const path: string = (deleteAsync as jest.Mock).mock.calls[0][0];
      expect(path).toContain('photo-123');
    });
  });

  describe('compressAndSave', () => {
    it('calls manipulateAsync with correct resize dimensions', async () => {
      await compressAndSave('/source.jpg', 'grid', '/dest/grid.jpg');
      // 等比例縮放：只指定 width，height 交給原始比例（ecf502d 移除自動裁切）
      expect(manipulateAsync).toHaveBeenCalledWith(
        '/source.jpg',
        expect.arrayContaining([
          expect.objectContaining({ resize: { width: 400 } }),
        ]),
        expect.objectContaining({ compress: 0.85 })
      );
    });

    it('copies compressed file to destination path', async () => {
      await compressAndSave('/source.jpg', 'thumb', '/dest/thumb.jpg');
      expect(copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/dest/thumb.jpg' })
      );
    });

    it('returns the destination path', async () => {
      const result = await compressAndSave('/source.jpg', 'detail', '/dest/detail.jpg');
      expect(result).toBe('/dest/detail.jpg');
    });
  });
});
