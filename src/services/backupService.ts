import * as FileSystem from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import JSZip from 'jszip';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const DB_DIR = `${FileSystem.documentDirectory}SQLite/`;
const DB_NAME = 'sparkplate.db';

// 備份檔可能上百 MB。過去把整包 ZIP 轉成一個 base64 字串一次寫入／讀取，
// Android 會在原生端配置同樣大小的字串而 OutOfMemoryError（Java heap 上限約 256MB）。
// 現在一律以 Uint8Array 分段（每段最多 1MB）透過 FileHandle 讀寫，記憶體用量與檔案大小脫鉤。
const CHUNK_SIZE = 1024 * 1024;

async function readBytesSafe(path: string): Promise<Uint8Array | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await new File(path).bytes();
  } catch {
    return null;
  }
}

/** 以 JSZip 串流產生 ZIP，邊產生邊分段寫入檔案，不在記憶體保留整包 ZIP。 */
function writeZipStreaming(
  zip: JSZip,
  dest: string,
  onPercent: (percent: number) => void,
): Promise<void> {
  const out = new File(dest);
  if (out.exists) out.delete();
  out.create();
  const handle = out.open();

  return new Promise<void>((resolve, reject) => {
    let buffer = new Uint8Array(CHUNK_SIZE);
    let used = 0;
    let failed = false;

    const flush = () => {
      if (used > 0) {
        handle.writeBytes(buffer.slice(0, used));
        used = 0;
      }
    };
    const fail = (e: unknown) => {
      if (failed) return;
      failed = true;
      try { handle.close(); } catch { /* ignore */ }
      reject(e instanceof Error ? e : new Error(String(e)));
    };

    zip
      .generateInternalStream({ type: 'uint8array', streamFiles: true })
      .on('data', (chunk: Uint8Array, meta: { percent: number }) => {
        if (failed) return;
        try {
          let pos = 0;
          while (pos < chunk.length) {
            const n = Math.min(CHUNK_SIZE - used, chunk.length - pos);
            buffer.set(chunk.subarray(pos, pos + n), used);
            used += n;
            pos += n;
            if (used === CHUNK_SIZE) {
              handle.writeBytes(buffer);
              buffer = new Uint8Array(CHUNK_SIZE);
              used = 0;
            }
          }
          onPercent(meta.percent);
        } catch (e) {
          fail(e);
        }
      })
      .on('error', fail)
      .on('end', () => {
        if (failed) return;
        try {
          flush();
          handle.close();
          resolve();
        } catch (e) {
          fail(e);
        }
      })
      .resume();
  });
}

/** 分段讀取整個檔案成 Uint8Array（避免原生端一次配置整包字串）。 */
function readFileChunked(uri: string): Uint8Array {
  const handle = new File(uri).open();
  try {
    const size = handle.size ?? 0;
    const result = new Uint8Array(size);
    let offset = 0;
    while (offset < size) {
      const chunk = handle.readBytes(Math.min(CHUNK_SIZE, size - offset));
      if (chunk.length === 0) break;
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return offset === size ? result : result.subarray(0, offset);
  } finally {
    handle.close();
  }
}

export async function exportBackup(onProgress: (p: number) => void): Promise<string> {
  const zip = new JSZip();

  // 1. Pack DB files（資料庫壓縮效果好，用 DEFLATE）
  onProgress(5);
  const dbMain = await readBytesSafe(`${DB_DIR}${DB_NAME}`);
  if (dbMain) zip.file(`db/${DB_NAME}`, dbMain, { compression: 'DEFLATE' });
  const dbWal = await readBytesSafe(`${DB_DIR}${DB_NAME}-wal`);
  if (dbWal) zip.file(`db/${DB_NAME}-wal`, dbWal, { compression: 'DEFLATE' });
  onProgress(15);

  // 2. Pack photos（JPEG 本身已壓縮，用 STORE 省時間）
  let photoFolders: string[] = [];
  try { photoFolders = await FileSystem.readDirectoryAsync(PHOTOS_DIR); } catch { /* no photos */ }
  const total = photoFolders.length;

  for (let i = 0; i < total; i++) {
    const folder = photoFolders[i];
    let files: string[] = [];
    try { files = await FileSystem.readDirectoryAsync(`${PHOTOS_DIR}${folder}/`); } catch { /* skip */ }

    for (const file of files) {
      const content = await readBytesSafe(`${PHOTOS_DIR}${folder}/${file}`);
      if (content) zip.file(`photos/${folder}/${file}`, content, { compression: 'STORE' });
    }
    onProgress(15 + Math.round(((i + 1) / Math.max(total, 1)) * 65));
  }

  // 3. Generate ZIP & write to Documents（而非 cacheDirectory）：搭配 app.json 的
  // UIFileSharingEnabled + LSSupportsOpeningDocumentsInPlace，讓 iOS 版
  // 備份檔案直接出現在「檔案」App 的「我的 iPhone / SPARKPLATE」。
  onProgress(80);
  const date = new Date().toISOString().slice(0, 10);
  const dest = `${FileSystem.documentDirectory}sparkplate_backup_${date}.zip`;
  await writeZipStreaming(zip, dest, (percent) => onProgress(80 + Math.round(percent * 0.2)));
  onProgress(100);
  return dest;
}

export async function importBackup(
  zipUri: string,
  onProgress: (p: number) => void,
): Promise<void> {
  // 1. Read ZIP（分段讀取，避免整包轉成字串）
  onProgress(5);
  const zipBytes = readFileChunked(zipUri);

  onProgress(15);
  const zip = await JSZip.loadAsync(zipBytes);

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
    const content = await entry.async('uint8array');

    if (name.startsWith('db/')) {
      const dest = `${DB_DIR}${name.slice('db/'.length)}`;
      await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
      new File(dest).write(content);
    } else if (name.startsWith('photos/')) {
      const rel = name.slice('photos/'.length);
      const dest = `${PHOTOS_DIR}${rel}`;
      const dir = dest.substring(0, dest.lastIndexOf('/') + 1);
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      new File(dest).write(content);
    }

    onProgress(15 + Math.round(((i + 1) / Math.max(total, 1)) * 83));
  }

  onProgress(100);
}
