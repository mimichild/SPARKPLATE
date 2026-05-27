# SPARK PLATE — 實作規格書

> 本文件為單一開發規格來源，橋接 `prd.md`（產品需求）與 `tech.md`（技術選型），供 `/repar` skill 逐步開發使用。

---

## 1. 專案概述

| 項目 | 內容 |
|------|------|
| APP 名稱 | SPARK PLATE |
| 核心功能 | 以照片紀錄每日早中晚三餐，並標記心情、事件、餐點等級 |
| 平台 | iOS / Android（React Native + Expo SDK 54） |
| 目標使用者 | 想記錄飲食習慣、見證自身蛻變的個人用戶 |
| 資料儲存 | 完全本機（SQLite + 本機檔案系統），無雲端依賴 |

### 核心功能列表

1. **首頁 Splash**：品牌展示、設定快捷鍵、連結姊妹作
2. **今日紀錄**：早中晚三餐照片卡片、心情/事件/等級標記
3. **照片牆**：1:1 方格瀏覽所有餐點記錄、分頁載入、分享照片
4. **標籤篩選**：依時間範圍、心情、等級、餐別篩選，檢視對應照片

---

## 2. 路由結構（Expo Router）

```
app/
├── _layout.tsx              # Root layout：字型載入、SafeAreaProvider、DBProvider
├── index.tsx                # 首頁 Splash
└── (tabs)/
    ├── _layout.tsx          # Tab Bar layout（三個 Tab，含 Icon）
    ├── today.tsx            # Tab 1：今日紀錄
    ├── gallery.tsx          # Tab 2：照片牆
    └── filter.tsx           # Tab 3：標籤篩選
```

### Tab 設定（app/(tabs)/_layout.tsx）

| Tab | 路由 | 標籤文字 | Icon |
|-----|------|----------|------|
| 1 | `today` | 今日紀錄 | `calendar-today` |
| 2 | `gallery` | 照片牆 | `grid` |
| 3 | `filter` | 標籤 | `tag` |

---

## 3. 資料庫 Schema（SQLite）

資料庫名稱：`sparkplate.db`

### photos 資料表

```sql
CREATE TABLE IF NOT EXISTS photos (
  id              TEXT PRIMARY KEY,       -- UUID v4
  thumb_uri       TEXT NOT NULL,          -- 120×120
  grid_uri        TEXT NOT NULL,          -- 400×400
  detail_uri      TEXT NOT NULL,          -- 800×800
  backup_lite_uri TEXT NOT NULL,          -- 600×600 q0.6
  original_uri    TEXT,                   -- 選填，原始路徑
  width           INTEGER,
  height          INTEGER,
  created_at      TEXT NOT NULL           -- ISO 8601
);
```

### meals 資料表

```sql
CREATE TABLE IF NOT EXISTS meals (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,              -- 'YYYY-MM-DD'
  meal_type  TEXT NOT NULL,              -- 'breakfast' | 'lunch' | 'dinner'
  photo_id   TEXT REFERENCES photos(id) ON DELETE SET NULL,
  mood       TEXT,                       -- 'great'|'good'|'neutral'|'bad'|'terrible'
  event      TEXT,                       -- 自由文字
  grade      INTEGER,                    -- 1–5
  note       TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_date      ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_date_type ON meals(date, meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_mood      ON meals(mood);
CREATE INDEX IF NOT EXISTS idx_meals_grade     ON meals(grade);
```

### 唯一性約束（Business Rule）

每個 `(date, meal_type)` 組合只能有一筆紀錄。
應用層在 `createMeal` 前先檢查，若已存在則呼叫 `updateMeal`。

---

## 4. TypeScript 型別定義

**路徑：** `src/types/index.ts`

```typescript
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type MealGrade = 1 | 2 | 3 | 4 | 5;

export type PhotoSize = 'thumb' | 'grid' | 'detail' | 'backup-lite';

export interface Photo {
  id: string;
  thumbUri: string;
  gridUri: string;
  detailUri: string;
  backupLiteUri: string;
  originalUri?: string;
  width?: number;
  height?: number;
  createdAt: string; // ISO 8601
}

export interface Meal {
  id: string;
  date: string;        // 'YYYY-MM-DD'
  mealType: MealType;
  photoId?: string;
  photo?: Photo;       // JOIN 結果，非資料庫欄位
  mood?: Mood;
  event?: string;
  grade?: MealGrade;
  note?: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export interface DayRecord {
  date: string;        // 'YYYY-MM-DD'
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
}

export interface FilterCriteria {
  startDate?: string;  // 'YYYY-MM-DD'（含）
  endDate?: string;    // 'YYYY-MM-DD'（含）
  moods?: Mood[];
  grades?: MealGrade[];
  mealTypes?: MealType[];
}

export interface AppSettings {
  skipSplash: boolean;
  openCameraOnStart: boolean;
}

export interface PhotoSizeConfig {
  width: number;
  height: number;
  quality: number;
}

export const PHOTO_SIZE_CONFIG: Record<PhotoSize, PhotoSizeConfig> = {
  'thumb':       { width: 120,  height: 120,  quality: 0.80 },
  'grid':        { width: 400,  height: 400,  quality: 0.85 },
  'detail':      { width: 800,  height: 800,  quality: 0.90 },
  'backup-lite': { width: 600,  height: 600,  quality: 0.60 },
};
```

---

## 5. 服務層 API（src/services/）

服務層為**純函式**，接受 `db` 參數，不持有狀態，所有非同步操作回傳 `Promise`。

### dbService.ts

```typescript
import * as SQLite from 'expo-sqlite';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

export async function initDB(): Promise<SQLiteDatabase>
// 開啟 'sparkplate.db'，呼叫 migrateDB

export async function migrateDB(db: SQLiteDatabase): Promise<void>
// 建立 photos、meals 資料表與索引（IF NOT EXISTS）
```

### photoService.ts

```typescript
import { SQLiteDatabase } from './dbService';
import { Photo, PhotoSize } from '@/types';

export async function savePhoto(
  db: SQLiteDatabase,
  sourceUri: string
): Promise<Photo>
// 1. 對 sourceUri 執行 4 種尺寸壓縮（依 PHOTO_SIZE_CONFIG）
// 2. 將壓縮後檔案複製至 FileSystem.documentDirectory + 'photos/{uuid}/{size}.jpg'
// 3. 寫入 photos 表，回傳 Photo 物件

export async function getPhotoById(
  db: SQLiteDatabase,
  id: string
): Promise<Photo | null>

export async function deletePhoto(
  db: SQLiteDatabase,
  id: string
): Promise<void>
// 刪除 photos 表紀錄，並刪除本機目錄 'photos/{id}/'

export async function compressAndSave(
  sourceUri: string,
  size: PhotoSize,
  destPath: string
): Promise<string>
// 純函式：使用 expo-image-manipulator 壓縮後存至 destPath，回傳 destPath
// resize 策略：contain（長邊對齊，不裁切）
```

### mealService.ts

```typescript
import { SQLiteDatabase } from './dbService';
import { Meal, MealType, DayRecord, FilterCriteria } from '@/types';

export async function createMeal(
  db: SQLiteDatabase,
  data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt' | 'photo'>
): Promise<Meal>
// 產生 UUID，插入 meals 表，回傳完整 Meal（含 photo JOIN）

export async function getMealById(
  db: SQLiteDatabase,
  id: string
): Promise<Meal | null>
// LEFT JOIN photos，回傳含 photo 的 Meal 或 null

export async function getMealsByDate(
  db: SQLiteDatabase,
  date: string // 'YYYY-MM-DD'
): Promise<Meal[]>
// 回傳最多 3 筆，依 meal_type 排序（breakfast < lunch < dinner）
// 含 photos LEFT JOIN

export async function getMealsByDateRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<DayRecord[]>
// 回傳指定範圍內所有 DayRecord，依 date DESC 排序
// 在記憶體中分組為 DayRecord[]

export async function updateMeal(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Omit<Meal, 'id' | 'createdAt' | 'photo'>>
): Promise<Meal>
// 更新 updated_at = NOW()，回傳更新後的 Meal

export async function deleteMeal(
  db: SQLiteDatabase,
  id: string
): Promise<void>
// 僅刪除 meals 表紀錄；photos 由 photoService.deletePhoto 另行處理

export async function filterMeals(
  db: SQLiteDatabase,
  criteria: FilterCriteria
): Promise<Meal[]>
// 動態組合 WHERE 條件（所有條件為 AND 關係）
// moods/grades/mealTypes 用 IN (?, ?, ...)
// 依 date DESC, meal_type ASC 排序
// 含 photos LEFT JOIN
```

---

## 6. Hooks 設計（src/hooks/）

Hooks 封裝 `useState + useCallback`，提供 `reload()` 供手動刷新。

### useDB.ts

```typescript
export function useDB(): SQLiteDatabase
// 從 DBContext 取得 db 實例
// 若未初始化則 throw（需在 DBProvider 內使用）
```

### useTodayMeals.ts

```typescript
interface UseTodayMealsReturn {
  dayRecord: DayRecord;
  loading: boolean;
  error: string | null;
  reload: () => void;
  addMealWithPhoto: (
    mealType: MealType,
    sourceUri: string,
    meta?: {
      mood?: Mood;
      event?: string;
      grade?: MealGrade;
      note?: string;
    }
  ) => Promise<void>;
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
  deleteMealWithPhoto: (id: string, photoId?: string) => Promise<void>;
  // 同時刪除 meal 與對應 photo 檔案
}

export function useTodayMeals(): UseTodayMealsReturn
// 內部呼叫 getMealsByDate(db, today)
// addMealWithPhoto 流程：
//   1. savePhoto(db, sourceUri)
//   2. createMeal(db, { mealType, photoId, ...meta })
//   3. reload()
```

### useGallery.ts

```typescript
interface UseGalleryReturn {
  days: DayRecord[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

export function useGallery(pageSize?: number): UseGalleryReturn
// 預設 pageSize = 30（天）
// 使用日期 offset pagination（每次往前推 pageSize 天）
// 初始載入最近 pageSize 天
```

### useFilter.ts

```typescript
interface UseFilterReturn {
  criteria: FilterCriteria;
  results: Meal[];
  loading: boolean;
  totalCount: number;
  setCriteria: (criteria: Partial<FilterCriteria>) => void;
  clearCriteria: () => void;
}

export function useFilter(): UseFilterReturn
// criteria 變更時自動重新查詢（useEffect 依賴 criteria）
// setCriteria 做 merge（非覆蓋）
```

### usePhoto.ts

```typescript
interface UsePhotoReturn {
  takePicture: () => Promise<string | null>;
  // 請求相機權限 → 呼叫 launchCameraAsync → 回傳 assets[0].uri 或 null

  pickFromLibrary: () => Promise<string | null>;
  // 請求媒體庫權限 → 呼叫 launchImageLibraryAsync → 回傳 uri 或 null

  sharePhoto: (uri: string) => Promise<void>;
  // 使用 expo-sharing shareAsync(uri)

  saveToDevice: (uri: string) => Promise<void>;
  // 使用 expo-media-library saveToLibraryAsync(uri)
}

export function usePhoto(): UsePhotoReturn
```

---

## 7. Zustand Store 設計（src/stores/）

### settingsStore.ts

```typescript
import { create } from 'zustand';

interface SettingsState {
  skipSplash: boolean;
  openCameraOnStart: boolean;
  hydrated: boolean;
  setSkipSplash: (v: boolean) => Promise<void>;
  setOpenCameraOnStart: (v: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSettingsStore: UseBoundStore<StoreApi<SettingsState>>
// hydrate()：從 AsyncStorage 讀取兩個 key，設定 hydrated = true
// setSkipSplash/setOpenCameraOnStart：同時更新 state 與 AsyncStorage
```

---

## 8. 常數定義（src/constants/）

### storageKeys.ts

```typescript
export const STORAGE_KEYS = {
  SKIP_SPLASH:           'settings:skipSplash',
  OPEN_CAMERA_ON_START:  'settings:openCameraOnStart',
} as const;
```

### moodConfig.ts

```typescript
export const MOOD_CONFIG: Record<Mood, { label: string; emoji: string }> = {
  great:   { label: '很棒',  emoji: '😄' },
  good:    { label: '不錯',  emoji: '🙂' },
  neutral: { label: '普通',  emoji: '😐' },
  bad:     { label: '不好',  emoji: '😕' },
  terrible:{ label: '很差',  emoji: '😞' },
};
```

---

## 9. 各頁面規格

### app/index.tsx（首頁 Splash）

**生命週期：**
1. 掛載時呼叫 `settingsStore.hydrate()`
2. `hydrated === true` 後判斷：
   - `skipSplash && openCameraOnStart` → `router.replace('/(tabs)/today')` 並發送訊號觸發相機
   - `skipSplash && !openCameraOnStart` → `router.replace('/(tabs)/today')`
   - 其他 → 停在首頁

**UI 結構：**
```
<SafeAreaView>
  <Text testID="title">SPARK PLATE</Text>
  <Text testID="tagline">找回讓自己心動的自己，我要見證我的蛻變</Text>

  <TouchableOpacity testID="settings-btn" onPress={openSettingsModal}>
    設定
  </TouchableOpacity>

  <View testID="sister-apps">
    <Pressable onPress={() => Linking.openURL(SPARK_SHAPE_URL)}>SPARK SHAPE</Pressable>
    <Pressable onPress={() => Linking.openURL(SPARK_FIT_URL)}>SPARK FIT</Pressable>
  </View>

  <TouchableOpacity testID="start-btn" onPress={() => router.push('/(tabs)/today')}>
    開始使用
  </TouchableOpacity>

  <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
</SafeAreaView>
```

---

### app/(tabs)/today.tsx（今日紀錄）

**資料：** `useTodayMeals()`

**UI 結構：**
```
<ScrollView>
  <MealCard mealType="breakfast" meal={dayRecord.breakfast} onAdd={handleAdd} />
  <MealCard mealType="lunch"     meal={dayRecord.lunch}     onAdd={handleAdd} />
  <MealCard mealType="dinner"    meal={dayRecord.dinner}    onAdd={handleAdd} />
</ScrollView>

<FAB onPress={handleFABPress} />
// FAB 邏輯：
// - 今日三餐未滿 → ActionSheet 選「早/午/晚」
// - 全滿 → ActionSheet 選擇要更新哪一餐
```

**ActionSheet 選項（選定餐別後）：**
1. 拍照
2. 從相簿選取
3. 取消

**選取照片後流程：**
1. 開啟 `MealMetaModal`（選心情、輸入事件、選等級）
2. 確認後呼叫 `addMealWithPhoto(mealType, uri, meta)`

**MealCard 元件規格：**

```typescript
interface MealCardProps {
  mealType: MealType;
  meal?: Meal;
  onAdd: (mealType: MealType) => void;
  onLongPress?: (meal: Meal) => void;
}
```

- 有照片：`<Image source={{ uri: meal.photo.detailUri }} />`
- 無照片：佔位灰框 + `+` 圖示，點擊呼叫 `onAdd`
- 底部資訊列：`{MOOD_CONFIG[meal.mood].emoji}` `{meal.event（截斷 15 字）}` `{grade 星星}`
- 長按：顯示 ActionSheet（分享、刪除）

---

### app/(tabs)/gallery.tsx（照片牆）

**資料：** `useGallery(30)`

**UI 結構：**
```
<FlashList
  data={allMeals}          // 從 days 攤平為單一 Meal[]
  numColumns={3}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <GalleryCell meal={item} />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.3}
  ListFooterComponent={loading ? <ActivityIndicator /> : null}
/>
```

**GalleryCell 元件規格：**

```typescript
interface GalleryCellProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}
```

- 正方形，佔螢幕 1/3 寬
- 照片使用 `meal.photo.gridUri`
- 右下角 overlay：心情 emoji + 等級數字
- 點擊 → 全螢幕 `PhotoViewer`

---

### app/(tabs)/filter.tsx（標籤篩選）

**資料：** `useFilter()`

**UI 結構：**
```
<ScrollView stickyHeaderIndices={[0]}>
  <FilterPanel criteria={criteria} onChange={setCriteria} />

  <Text>共 {totalCount} 筆</Text>

  <FlashList
    data={results}
    numColumns={3}
    estimatedItemSize={120}
    renderItem={({ item }) => <GalleryCell meal={item} />}
  />
</ScrollView>
```

**FilterPanel 元件規格：**

```typescript
interface FilterPanelProps {
  criteria: FilterCriteria;
  onChange: (criteria: Partial<FilterCriteria>) => void;
}
```

- 快速時間選項：最近 7 天 / 30 天 / 90 天
- 自訂範圍：DatePicker（可選）
- 心情多選：5 個 chip，選中時 highlighted
- 等級多選：3 個 chip（S/A/B）
- 餐別多選：早 / 午 / 晚 chip

---

## 10. 照片處理流程

```
使用者觸發（拍照 / 選相簿）
        │
        ▼
usePhoto.takePicture() 或 pickFromLibrary()
        │ 回傳 sourceUri（原始高解析度圖）
        ▼
photoService.savePhoto(db, sourceUri)
   ├── compressAndSave(sourceUri, 'thumb',       destDir) → 120×120 q0.80
   ├── compressAndSave(sourceUri, 'grid',        destDir) → 400×400 q0.85
   ├── compressAndSave(sourceUri, 'detail',      destDir) → 800×800 q0.90
   └── compressAndSave(sourceUri, 'backup-lite', destDir) → 600×600 q0.60
        │ 所有檔案路徑
        ▼
寫入 photos 表 → 取得 photo.id
        │
        ▼
mealService.createMeal(db, { mealType, photoId: photo.id, ...meta })
        │
        ▼
useTodayMeals.reload() → UI 刷新

─── 分享流程 ─────────────────────────────────────────
長按 MealCard → ActionSheet → 分享
        │
        ▼
react-native-view-shot 截圖整個 MealCard（含心情/事件/等級）
        │ 回傳 screenshotUri
        ▼
expo-sharing.shareAsync(screenshotUri)
        │ 系統分享選單（AirDrop、Line、儲存到相簿...）

─── 下載流程 ─────────────────────────────────────────
使用 expo-media-library.saveToLibraryAsync(meal.photo.detailUri)
```

### 本機目錄結構

```
FileSystem.documentDirectory/
└── photos/
    └── {photoId}/
        ├── thumb.jpg
        ├── grid.jpg
        ├── detail.jpg
        └── backup-lite.jpg
```

---

## 11. 設定功能規格

### AsyncStorage Keys

| Key | 型別 | 預設值 | 說明 |
|-----|------|--------|------|
| `settings:skipSplash` | `'true'` \| `'false'` | `'false'` | 跳過首頁 |
| `settings:openCameraOnStart` | `'true'` \| `'false'` | `'false'` | 啟動時開啟相機 |

> AsyncStorage 存字串，讀取時需 `=== 'true'` 轉型。

### SettingsModal 元件規格

```typescript
interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}
```

**UI：**
```
<Modal>
  <Text>設定</Text>

  <View>
    <Text>快速啟動 - 直接進入今日紀錄</Text>
    <Switch
      value={skipSplash}
      onValueChange={setSkipSplash}
    />
  </View>

  {skipSplash && (
    <View>
      <Text>啟動時自動開啟相機</Text>
      <Switch
        value={openCameraOnStart}
        onValueChange={setOpenCameraOnStart}
      />
    </View>
  )}

  <Text style={styles.hint}>
    開啟後下次啟動 APP 將直接進入主頁
  </Text>

  <TouchableOpacity onPress={onClose}>關閉</TouchableOpacity>
</Modal>
```

---

## 12. 元件規格彙整（src/components/）

| 元件 | 檔案 | 說明 |
|------|------|------|
| `MealCard` | `MealCard.tsx` | 單餐卡片（必須上傳照片） |
| `MealMetaModal` | `MealMetaModal.tsx` | 心情選擇、事件輸入、等級選擇 |
| `SettingsModal` | `SettingsModal.tsx` | 快捷鍵設定 |
| `FAB` | `FAB.tsx` | 右下角浮動按鈕（+ 圖示） |
| `FilterPanel` | `FilterPanel.tsx` | 篩選條件面板 |
| `GalleryCell` | `GalleryCell.tsx` | 照片牆單格（1/3 寬正方形） |
| `PhotoViewer` | `PhotoViewer.tsx` | 全螢幕照片檢視（含左右滑動） |

### MealMetaModal 規格

```typescript
interface MealMetaModalProps {
  visible: boolean;
  mealType: MealType;
  onConfirm: (meta: {
    mood?: Mood;
    event?: string;
    grade?: MealGrade;
    note?: string;
  }) => void;
  onCancel: () => void;
}
```

---

## 13. Provider 設計（src/providers/）

### DBProvider.tsx

```typescript
// 在 app/_layout.tsx 包裹整個應用
// 初始化 SQLite，提供 db 至 Context
// 初始化期間顯示 SplashScreen（使用 expo-splash-screen）

export const DBContext = React.createContext<SQLiteDatabase | null>(null);

export function DBProvider({ children }: PropsWithChildren): JSX.Element
// 1. useEffect: initDB() → 成功後 setDb(db)、SplashScreen.hideAsync()
// 2. db 為 null 時回傳 null（不渲染子元件）
// 3. db 初始化完成後渲染 children
```

---

## 14. 測試策略

### Mock 位置（src/\_\_mocks\_\_/）

| Mock 檔案 | 模擬目標 |
|-----------|----------|
| `expo-sqlite.ts` | `openDatabaseAsync`、`runAsync`、`getAllAsync`、`getFirstAsync` |
| `expo-file-system.ts` | `copyAsync`、`deleteAsync`、`makeDirectoryAsync`、`documentDirectory` |
| `expo-image-picker.ts` | `launchCameraAsync`、`launchImageLibraryAsync`、`requestCameraPermissionsAsync` |
| `expo-image-manipulator.ts` | `manipulateAsync` |
| `expo-sharing.ts` | `shareAsync` |

### 單元測試（src/\_\_tests\_\_/services/）

**mealService.test.ts**
- `createMeal`：插入正確欄位，回傳含 id 的 Meal
- `getMealsByDate`：回傳正確日期的 3 筆資料
- `filterMeals`：moods 條件、grades 條件、日期範圍組合
- `deleteMeal`：呼叫 db.runAsync 含正確 id

**photoService.test.ts**
- `savePhoto`：呼叫 4 次 manipulateAsync、4 次 copyAsync、1 次 db insert
- `deletePhoto`：呼叫 db delete 與 FileSystem.deleteAsync（目錄）

**dbService.test.ts**
- `migrateDB`：執行 CREATE TABLE 語句

### 元件測試（src/\_\_tests\_\_/components/）

**MealCard.test.tsx**
- 有照片時渲染 Image，src 為 `detailUri`
- 長按呼叫 `onLongPress(meal)`

**FilterPanel.test.tsx**
- 點擊心情 chip 呼叫 `onChange({ moods: [...] })`
- 點擊「最近 7 天」設定正確日期範圍

### Hook 測試（src/\_\_tests\_\_/hooks/）

**useTodayMeals.test.ts**
- 初始化時呼叫 `getMealsByDate`
- `addMealWithPhoto` 依序呼叫 `savePhoto` → `createMeal` → reload

**useFilter.test.ts**
- `setCriteria` 後重新呼叫 `filterMeals`

---

## 15. 完整目錄結構

```
SPARKPLATE/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── today.tsx
│       ├── gallery.tsx
│       └── filter.tsx
├── src/
│   ├── types/
│   │   └── index.ts
│   ├── constants/
│   │   ├── storageKeys.ts
│   │   └── moodConfig.ts
│   ├── services/
│   │   ├── dbService.ts
│   │   ├── mealService.ts
│   │   └── photoService.ts
│   ├── hooks/
│   │   ├── useDB.ts
│   │   ├── useTodayMeals.ts
│   │   ├── useGallery.ts
│   │   ├── useFilter.ts
│   │   └── usePhoto.ts
│   ├── stores/
│   │   └── settingsStore.ts
│   ├── components/
│   │   ├── MealCard.tsx
│   │   ├── MealMetaModal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── FAB.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── GalleryCell.tsx
│   │   └── PhotoViewer.tsx
│   ├── providers/
│   │   └── DBProvider.tsx
│   └── __tests__/
│       ├── services/
│       │   ├── mealService.test.ts
│       │   ├── photoService.test.ts
│       │   └── dbService.test.ts
│       ├── hooks/
│       │   ├── useTodayMeals.test.ts
│       │   └── useFilter.test.ts
│       └── components/
│           ├── MealCard.test.tsx
│           └── FilterPanel.test.tsx
├── assets/
│   ├── images/
│   │   ├── icon.png
│   │   └── splash.png
│   └── fonts/
├── docs/
│   ├── prd.md
│   ├── tech.md
│   └── spec.md             ← 本文件
├── app.json
├── tsconfig.json
└── package.json
```

---

## 16. 開發順序建議（供 /repar 參考）

| 階段 | 內容 | 先決條件 |
|------|------|----------|
| 1 | Expo 初始化、`package.json`、`tsconfig.json` | 無 |
| 2 | `src/types/index.ts`、`src/constants/` | 無 |
| 3 | `dbService.ts` + 測試 | 型別定義 |
| 4 | `photoService.ts` + 測試 | dbService |
| 5 | `mealService.ts` + 測試 | dbService |
| 6 | `DBProvider.tsx`、`useDB.ts` | dbService |
| 7 | `settingsStore.ts` | 常數定義 |
| 8 | `useTodayMeals.ts` + 測試 | mealService、photoService |
| 9 | `useGallery.ts`、`useFilter.ts` + 測試 | mealService |
| 10 | `usePhoto.ts` | 無（wrap expo API） |
| 11 | `MealCard.tsx`、`FAB.tsx`、`MealMetaModal.tsx` | 型別定義 |
| 12 | `GalleryCell.tsx`、`FilterPanel.tsx`、`PhotoViewer.tsx` | 型別定義 |
| 13 | `SettingsModal.tsx` | settingsStore |
| 14 | `app/index.tsx` | settingsStore、SettingsModal |
| 15 | `app/(tabs)/today.tsx` | useTodayMeals、元件 |
| 16 | `app/(tabs)/gallery.tsx` | useGallery、GalleryCell |
| 17 | `app/(tabs)/filter.tsx` | useFilter、FilterPanel |
| 18 | `app/_layout.tsx`、`app/(tabs)/_layout.tsx` | DBProvider |
