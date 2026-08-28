import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function generateDatedFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `SPARKPLATE_${y}${mo}${d}_${h}${mi}${s}${ms}.jpg`;
}

// 相機/ImagePicker 給的暫存檔名是亂數字串，MediaLibrary.saveToLibraryAsync 會把它原樣
// 帶進系統相簿，導致依檔名排序時是亂的；先複製成日期時間格式的檔名再存。
export async function saveDatedPhotoToLibrary(sourceUri: string): Promise<void> {
  const destUri = `${FileSystem.cacheDirectory}${generateDatedFilename()}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  await MediaLibrary.saveToLibraryAsync(destUri);
}
