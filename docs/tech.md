# SPARKPLATE 技術規格

> 本文件記錄 SPARKPLATE APP 的技術選型、架構設計與開發規範，供開發新 APP 時參考。

---

## 語言與核心框架

| 項目 | 版本 | 說明 |
|------|------|------|
| TypeScript | ~5.9.2 | strict 模式，所有程式碼須有型別 |
| React | 19.1.0 | 函數式元件 + Hooks |
| React Native | 0.81.5 | 跨平台 iOS / Android / Web |
| Expo SDK | ~54.0.33 | newArchEnabled: true（新架構） |
| Expo Router | ~6.0.23 | 檔案式路由（類 Next.js） |

---

## 主要套件

### UI / 畫面

| 套件 | 版本 | 用途 |
|------|------|------|
| `react-native-safe-area-context` | ~5.6.0 | Safe area / Dynamic Island 處理 |
| `react-native-screens` | ~4.16.0 | 原生 Screen 容器 |
| `react-native-gesture-handler` | ~2.28.0 | 手勢支援 |
| `react-native-reanimated` | ~4.1.1 | 動畫 |
| `@shopify/flash-list` | 2.0.2 | 高效能長列表（取代 FlatList） |
| `react-native-view-shot` | ^5.1.0 | 截圖 / 分享圖 |

### 資料 / 狀態

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-sqlite` | ~16.0.10 | 本機 SQLite 資料庫 |
| `zustand` | ^5.0.13 | 全域輕量狀態管理 |
| `@react-native-async-storage/async-storage` | 2.2.0 | 設定持久化（主題色、排序等） |

### 檔案 / 媒體

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-image-picker` | ~17.0.11 | 從相簿選取照片 |
| `expo-image-manipulator` | ~14.0.8 | 照片壓縮 / 裁切 |
| `expo-file-system` | ~19.0.22 | 本機檔案讀寫 |
| `expo-sharing` | ~14.0.8 | 分享檔案到系統 |
| `expo-document-picker` | ~14.0.8 | 選取備份檔案 |
| `fflate` | ^0.8.3 | 快速 ZIP 壓縮（備份/還原） |
| `jszip` | ^3.10.1 | ZIP 解壓縮（舊備份相容） |

### 開發 / 測試

| 套件 | 版本 | 用途 |
|------|------|------|
| `jest` | ^29.7.0 | 單元測試框架 |
| `jest-expo` | ~54.0.17 | Expo 專用 Jest preset |
| `@testing-library/react-native` | ^13.3.3 | React Native 元件測試 |
| `typescript` | ~5.9.2 | 型別檢查 |

---

## 專案目錄結構

```
SPARKPLATE/
├── app/                        # Expo Router 路由頁面
│   ├── index.tsx               # 首頁
├── src/
├── assets/                     # 圖示、啟動圖
├── docs/                       # 文件
├── android/                    # Android 原生專案（由 Expo 生成）
├── app.json                    # Expo 設定
├── tsconfig.json               # TypeScript 設定
└── package.json
```

---

### 日期格式
- 所有日期一律 ISO 8601 字串：`'YYYY-MM-DD'` 或 `'YYYY-MM-DDTHH:mm:ss.sssZ'`
- SQLite 欄位型別 `TEXT`

---

## 架構設計原則

### 資料流
```
DB (SQLite)
  └─ services/     純函式，接受 db 參數，不持有狀態
       └─ hooks/   封裝 useState + useCallback，提供 reload()
            └─ screens (app/)   消費 hooks，只做 UI 渲染
```

### 狀態分層
| 層級 | 工具 | 用途 |
|------|------|------|
| 伺服器狀態 | expo-sqlite + custom hooks | 資料庫資料 |
| 全域 UI 狀態 | Zustand (`stores/`) | 主題、設定、選取模式 |
| 本機元件狀態 | useState | 表單欄位、Modal 開關 |
| 設定持久化 | AsyncStorage | 主題色、字體等設定 |

### 照片儲存
- 照片存在本機檔案系統（`expo-file-system`）
- 多尺寸：`thumb`（小圖）、`grid`（格狀）、`detail`（詳情）、`backup-lite`（備份輕量版）
- 路徑以 `photoId` 為索引，存在 `photos` 資料表

---

## 命名規範

### TypeScript / React
| 對象 | 規範 | 範例 |
|------|------|------|
| 變數 / 函式 | camelCase | `getItemById`, `usageCount` |
| 型別 / Interface | PascalCase | `Item`, `RankEntry`, `AppSettings` |
| React 元件 | PascalCase | `ItemCard`, `ConfirmDialog` |
| 常數 | UPPER_SNAKE_CASE | `DEFAULT_THEME_COLOR`, `DB_NAME` |
| Custom Hook | `use` 前綴 | `useItems`, `useRanking` |

### 檔案命名
| 類型 | 規範 | 範例 |
|------|------|------|
| React 元件 | PascalCase.tsx | `ItemCard.tsx` |
| Service | camelCase.ts | `itemService.ts` |
| Hook | camelCase.ts | `useItems.ts` |
| Store | camelCase.ts | `settingsStore.ts` |
| 路由頁面 | camelCase.tsx 或 `[param].tsx` | `form.tsx`, `[id].tsx` |

---

## Build 與部署

### 環境需求（Android）
```bash
# Java（必須手動設定，不可用 VS Code 內建 JRE）
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.7/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# ADB
export PATH="$PATH:/Users/{user}/Library/Android/sdk/platform-tools"
```

### 常用指令
```bash
# 開發伺服器
npx expo start --clear

# Release APK 建置
npx expo run:android --variant release

# 安裝到手機
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 型別檢查
npx tsc --noEmit

# 測試
npm test
npm run test:coverage
```

### APK 輸出路徑
```
android/app/build/outputs/apk/release/app-release.apk
```

### App 設定（app.json）
| 項目 | 值 |
|------|-----|
| Bundle ID（iOS） | `com.sparkplate.app` |
| Package（Android） | `com.sparkplate.app` |
| 方向 | portrait only |
| 新架構 | 啟用（newArchEnabled: true） |
| Android edgeToEdge | 啟用 |

---

## 測試規範

- 測試檔案放在 `src/__tests__/`，對應目錄結構
- 檔名格式：`{目標}.test.ts`
- Native 模組 mock 放 `src/__mocks__/`
- 測試框架：Jest + jest-expo + @testing-library/react-native

```bash
# 執行測試
npm test

# 監看模式
npm run test:watch

# 覆蓋率報告
npm run test:coverage
```

---

## TypeScript 設定摘要

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- `@/` 路徑別名對應 `src/`
- strict 模式全開（noImplicitAny, strictNullChecks 等）
