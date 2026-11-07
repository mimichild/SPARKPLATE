// 以記憶體模擬檔案系統，驗證備份匯出／匯入不再把整包 ZIP 轉成一大段 base64 字串
// （Android 實機曾因此 OutOfMemoryError：134MB 字串配置失敗）。

const mockFs = new Map<string, Uint8Array>();
const mockWriteSizes: number[] = [];
const mockReadSizes: number[] = [];

function mockFileSystemModule() {
  class FileHandle {
    offset = 0;
    uri: string;
    constructor(u: string) { this.uri = u; }
    get size() { return (mockFs.get(this.uri) ?? new Uint8Array(0)).length; }
    writeBytes(bytes: Uint8Array) {
      mockWriteSizes.push(bytes.length);
      const cur = mockFs.get(this.uri) ?? new Uint8Array(0);
      const next = new Uint8Array(Math.max(cur.length, this.offset + bytes.length));
      next.set(cur);
      next.set(bytes, this.offset);
      mockFs.set(this.uri, next);
      this.offset += bytes.length;
    }
    readBytes(length: number) {
      const cur = mockFs.get(this.uri) ?? new Uint8Array(0);
      const out = cur.slice(this.offset, this.offset + length);
      mockReadSizes.push(out.length);
      this.offset += out.length;
      return out;
    }
    close() {}
  }
  class File {
    uri: string;
    constructor(u: string) { this.uri = u; }
    get exists() { return mockFs.has(this.uri); }
    create() { mockFs.set(this.uri, new Uint8Array(0)); }
    delete() { mockFs.delete(this.uri); }
    open() { return new FileHandle(this.uri); }
    async bytes() { return new Uint8Array(mockFs.get(this.uri)!); }
    write(content: Uint8Array) { mockWriteSizes.push(content.length); mockFs.set(this.uri, new Uint8Array(content)); }
  }
  return {
    File,
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(async (p: string) => ({ exists: mockFs.has(p) })),
  readDirectoryAsync: jest.fn(async (dir: string) => {
    const names = new Set<string>();
    for (const k of mockFs.keys()) {
      if (k.startsWith(dir)) names.add(k.slice(dir.length).split('/')[0]);
    }
    return [...names];
  }),
  makeDirectoryAsync: jest.fn(async () => {}),
  deleteAsync: jest.fn(async (p: string) => { mockFs.delete(p); }),
  readAsStringAsync: jest.fn(() => { throw new Error('不應再整包讀成字串'); }),
  writeAsStringAsync: jest.fn(() => { throw new Error('不應再整包寫成字串'); }),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  };
}

// moduleNameMapper 讓 'expo-file-system/legacy' 與 'expo-file-system' 指向同一個模擬檔，
// 所以兩者共用同一份合併後的模擬（新版 File API + legacy 函式）。
jest.mock('expo-file-system', () => mockFileSystemModule());
jest.mock('expo-file-system/legacy', () => mockFileSystemModule());

import { exportBackup, importBackup } from '@/services/backupService';

const MB = 1024 * 1024;

function bytes(len: number, seed: number) {
  const a = new Uint8Array(len);
  for (let i = 0; i < len; i++) a[i] = (i * 31 + seed) & 0xff;
  return a;
}

describe('backupService', () => {
  beforeEach(() => {
    mockFs.clear();
    mockWriteSizes.length = 0;
    mockReadSizes.length = 0;
  });

  it('匯出時以每段不超過 1MB 的方式寫入 ZIP，不使用整包字串', async () => {
    mockFs.set('file:///docs/SQLite/sparkplate.db', bytes(5000, 1));
    mockFs.set('file:///docs/photos/p1/detail.jpg', bytes(3 * MB, 2));
    mockFs.set('file:///docs/photos/p2/detail.jpg', bytes(2 * MB, 3));

    const dest = await exportBackup(() => {});

    expect(mockFs.get(dest)!.length).toBeGreaterThan(5 * MB);
    expect(mockWriteSizes.length).toBeGreaterThan(1);
    expect(Math.max(...mockWriteSizes)).toBeLessThanOrEqual(MB);
  });

  it('匯出後再匯入，資料庫與照片內容完全還原', async () => {
    const db = bytes(5000, 1);
    const wal = bytes(300, 9);
    const p1 = bytes(1.5 * MB, 2);
    const p2 = bytes(1000, 3);
    mockFs.set('file:///docs/SQLite/sparkplate.db', db);
    mockFs.set('file:///docs/SQLite/sparkplate.db-wal', wal);
    mockFs.set('file:///docs/photos/p1/detail.jpg', p1);
    mockFs.set('file:///docs/photos/p2/thumb.jpg', p2);

    const zipPath = await exportBackup(() => {});
    const zip = mockFs.get(zipPath)!;
    mockFs.clear();
    mockFs.set('file:///cache/picked.zip', zip);
    mockReadSizes.length = 0;

    await importBackup('file:///cache/picked.zip', () => {});

    expect(mockFs.get('file:///docs/SQLite/sparkplate.db')).toEqual(db);
    expect(mockFs.get('file:///docs/SQLite/sparkplate.db-wal')).toEqual(wal);
    expect(mockFs.get('file:///docs/photos/p1/detail.jpg')).toEqual(p1);
    expect(mockFs.get('file:///docs/photos/p2/thumb.jpg')).toEqual(p2);
    // 匯入讀取 ZIP 也要分段
    expect(mockReadSizes.length).toBeGreaterThan(1);
    expect(Math.max(...mockReadSizes)).toBeLessThanOrEqual(MB);
  });
});
