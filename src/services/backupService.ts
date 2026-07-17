import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const DB_DIR = `${FileSystem.documentDirectory}SQLite/`;
const DB_NAME = 'sparkplate.db';

async function readBase64Safe(path: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    return null;
  }
}

export async function exportBackup(onProgress: (p: number) => void): Promise<string> {
  const zip = new JSZip();

  // 1. Pack DB files
  onProgress(5);
  const dbMain = await readBase64Safe(`${DB_DIR}${DB_NAME}`);
  if (dbMain) zip.file(`db/${DB_NAME}`, dbMain, { base64: true });
  const dbWal = await readBase64Safe(`${DB_DIR}${DB_NAME}-wal`);
  if (dbWal) zip.file(`db/${DB_NAME}-wal`, dbWal, { base64: true });
  onProgress(15);

  // 2. Pack photos
  let photoFolders: string[] = [];
  try { photoFolders = await FileSystem.readDirectoryAsync(PHOTOS_DIR); } catch { /* no photos */ }
  const total = photoFolders.length;

  for (let i = 0; i < total; i++) {
    const folder = photoFolders[i];
    let files: string[] = [];
    try { files = await FileSystem.readDirectoryAsync(`${PHOTOS_DIR}${folder}/`); } catch { /* skip */ }

    for (const file of files) {
      const content = await readBase64Safe(`${PHOTOS_DIR}${folder}/${file}`);
      if (content) zip.file(`photos/${folder}/${file}`, content, { base64: true });
    }
    onProgress(15 + Math.round(((i + 1) / Math.max(total, 1)) * 65));
  }

  // 3. Generate ZIP
  onProgress(80);
  const zipBase64 = await zip.generateAsync(
    { type: 'base64', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress(80 + Math.round(meta.percent * 0.1)),
  );

  // 4. Write to Documents（而非 cacheDirectory）：搭配 app.json 的
  // UIFileSharingEnabled + LSSupportsOpeningDocumentsInPlace，讓 iOS 版
  // 備份檔案直接出現在「檔案」App 的「我的 iPhone / SPARKPLATE」，不必
  // 依賴分享面板「儲存到檔案」是否真的操作成功。Android 流程會在存到
  // 使用者選擇的資料夾後清掉這個暫存檔，位置改變不影響其行為。
  const date = new Date().toISOString().slice(0, 10);
  const dest = `${FileSystem.documentDirectory}sparkplate_backup_${date}.zip`;
  await FileSystem.writeAsStringAsync(dest, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
  onProgress(100);
  return dest;
}

export async function importBackup(
  zipUri: string,
  onProgress: (p: number) => void,
): Promise<void> {
  // 1. Read ZIP
  onProgress(5);
  const zipBase64 = await FileSystem.readAsStringAsync(zipUri, { encoding: FileSystem.EncodingType.Base64 });

  onProgress(15);
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  // 清掉殘留的 -wal / -shm 檔案：若備份沒有附上 -wal（代表匯出當下沒有
  // 未 checkpoint 的資料），但硬碟上還留著舊的 -wal/-shm，這些殘留檔案
  // 的內容會跟即將寫入的新主檔案對不起來，讓 SQLite 之後拒絕寫入。
  await FileSystem.deleteAsync(`${DB_DIR}${DB_NAME}-wal`, { idempotent: true });
  await FileSystem.deleteAsync(`${DB_DIR}${DB_NAME}-shm`, { idempotent: true });

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    const name = entry.name;
    const content = await entry.async('base64');

    if (name.startsWith('db/')) {
      const dest = `${DB_DIR}${name.slice('db/'.length)}`;
      await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
      await FileSystem.writeAsStringAsync(dest, content, { encoding: FileSystem.EncodingType.Base64 });
    } else if (name.startsWith('photos/')) {
      const rel = name.slice('photos/'.length);
      const dest = `${PHOTOS_DIR}${rel}`;
      const dir = dest.substring(0, dest.lastIndexOf('/') + 1);
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      await FileSystem.writeAsStringAsync(dest, content, { encoding: FileSystem.EncodingType.Base64 });
    }

    onProgress(15 + Math.round(((i + 1) / Math.max(total, 1)) * 83));
  }

  onProgress(100);
}
