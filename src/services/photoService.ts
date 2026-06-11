import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { SQLiteDatabase } from './dbService';
import { Photo, PhotoSize, PHOTO_SIZE_CONFIG } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function compressAndSave(
  sourceUri: string,
  size: PhotoSize,
  destPath: string
): Promise<string> {
  const config = PHOTO_SIZE_CONFIG[size];

  // 先取得來源尺寸，做中心裁切成正方形後再 resize，避免非 1:1 來源被拉伸
  const info = await ImageManipulator.manipulateAsync(sourceUri, []);
  const srcW = info.width;
  const srcH = info.height;
  const squareSize = Math.min(srcW, srcH);
  const originX = Math.floor((srcW - squareSize) / 2);
  const originY = Math.floor((srcH - squareSize) / 2);

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [
      { crop: { originX, originY, width: squareSize, height: squareSize } },
      { resize: { width: config.width } },
    ],
    { compress: config.quality, format: ImageManipulator.SaveFormat.JPEG }
  );
  await FileSystem.copyAsync({ from: result.uri, to: destPath });
  return destPath;
}

export async function savePhoto(
  db: SQLiteDatabase,
  sourceUri: string
): Promise<Photo> {
  const id = generateId();
  const baseDir = `${FileSystem.documentDirectory}photos/${id}/`;

  await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });

  const thumbUri = await compressAndSave(sourceUri, 'thumb', `${baseDir}thumb.jpg`);
  const gridUri = await compressAndSave(sourceUri, 'grid', `${baseDir}grid.jpg`);
  const detailUri = await compressAndSave(sourceUri, 'detail', `${baseDir}detail.jpg`);
  const backupLiteUri = await compressAndSave(sourceUri, 'backup-lite', `${baseDir}backup-lite.jpg`);

  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO photos (id, thumb_uri, grid_uri, detail_uri, backup_lite_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, thumbUri, gridUri, detailUri, backupLiteUri, createdAt]
  );

  return { id, thumbUri, gridUri, detailUri, backupLiteUri, createdAt };
}

export async function getPhotoById(
  db: SQLiteDatabase,
  id: string
): Promise<Photo | null> {
  const row = await db.getFirstAsync<{
    id: string;
    thumb_uri: string;
    grid_uri: string;
    detail_uri: string;
    backup_lite_uri: string;
    original_uri?: string;
    width?: number;
    height?: number;
    created_at: string;
  }>('SELECT * FROM photos WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    thumbUri: row.thumb_uri,
    gridUri: row.grid_uri,
    detailUri: row.detail_uri,
    backupLiteUri: row.backup_lite_uri,
    originalUri: row.original_uri,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

export async function deletePhoto(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM photos WHERE id = ?', [id]);
  const dir = `${FileSystem.documentDirectory}photos/${id}/`;
  await FileSystem.deleteAsync(dir, { idempotent: true });
}
