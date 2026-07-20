# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKPLATE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-20 為 91 tests passed）
- 目前最高優先級未完成功能：ios-004 EAS iOS 雲端建置成功（blocked：需先申請 Apple Developer Program 帳號）
- 目前 blocker：ios-004/ios-005 需要 Apple Developer Program（$99/年），尚未申請
- 背景：ios-001～ios-003、native-001 皆已 passing；2026-07-20 修好「匯入備份後資料庫唯讀」的既有 bug；native-001 的 config plugin（plugins/withRemoveRCTBridgeSourceURL.js）讓 expo prebuild --clean 不需手動改 ios/ 也能編譯成功，可直接複製給 SPARKSHAPE 用

## 工作階段日誌

### 工作階段 004

- 日期：2026-07-20
- 本輪目標：完成 native-001（把 RCTBridge 原生修復轉成 Expo config plugin）
- 已完成：
  - 備份本機 `ios/`（被 gitignore，git 救不回來）
  - 用未修的 prebuild --clean 重新產生 ios/，跑建置重現預期中的 `cannot find type 'RCTBridge' in scope` 編譯錯誤，證實問題在這套 Xcode 26.6 環境下仍會發生
  - 寫了 `plugins/withRemoveRCTBridgeSourceURL.js`，用 `@expo/config-plugins` 的 `withAppDelegate` mod 在 prebuild 時自動移除有問題的 `sourceURL(for bridge:)` override，保留 `bundleURL()`
  - 在 app.json 的 plugins 陣列註冊這個 plugin
  - 重跑 prebuild --clean + 建置，確認自動修復生效、建置成功、App 在模擬器正常開啟
  - 確認 icon alpha 透明通道問題（notes 提到的舊風險）已於先前 commit 修好，非本輪需處理
  - `prebuild --clean` 屬於會整個重新產生 ios/ 的操作，被 auto mode 分類器擋下，改請使用者用 `!` 前綴手動執行兩次
- 執行過的驗證：模擬器實測建置（修復前重現錯誤、修復後建置成功）、`./init.sh`（91 tests passed）、`sips -g hasAlpha` 檢查 icon
- 已擷取證據：見 feature_list.json native-001 evidence；截圖 docs/native-001-prebuild-clean-success.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：ios-004/ios-005 仍卡在 Apple Developer 帳號
- 下一步最佳動作：等使用者申請好 Apple Developer Program 後才能繼續 ios-004；在那之前 SPARKPLATE 沒有可獨立推進的 iOS 項目（可考慮把同一個 plugin 套到 SPARKSHAPE）

### 工作階段 003

- 日期：2026-07-20
- 本輪目標：接續工作階段 002，補完 ios-002 剩下沒測的「拍照開啟 CameraLaunchModal」步驟
- 已完成：
  - 在模擬器上點相機 FAB → 拍照，確認 CameraLaunchModal 正常開啟（快門/相簿/關閉鍵都在，無閃退），點 ✕ 關閉後畫面正常返回
  - 確認使用者反映的「畫面看起來不是 1:1」是模擬器無實體相機的視覺限制，非程式碼 bug：讀 `CameraLaunchModal.tsx` 確認 `cameraBox` 樣式為 `SCREEN_WIDTH × SCREEN_WIDTH` 正方形，只是容器背景與無畫面的相機都是黑色，肉眼分不出方框邊界；真正的 1:1 視覺驗證留待實機（ios-005）
  - ios-002 全部三項驗證完成，標記 passing
- 執行過的驗證：模擬器手動操作（新增餐點/相簿選圖、開關相機 modal、多次 `simctl terminate`+`launch` 確認資料持久化）
- 已擷取證據：見 feature_list.json ios-002 evidence；截圖 docs/ios-002-camera-modal.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增；native-001／ios-004／ios-005 仍待 Apple Developer 帳號與後續排程
- 下一步最佳動作：native-001（把 RCTBridge 原生修復轉成 Expo config plugin），為 EAS 建置鋪路

### 工作階段 002

- 日期：2026-07-20
- 本輪目標：接續上次未解決的「匯入備份後資料庫唯讀，新增餐點失敗」bug（見上次 commit dba2b50，wip 未解決）
- 已完成：
  - 用 systematic-debugging 方法重新排查，在模擬器上實際重現，抓到精確錯誤是 `Calling the 'prepareAsync' function has failed → Caused by: Access to closed resource`（比上次記錄的「readonly database」更準確）
  - 找到根本原因：`BackupRestoreModal` 匯入前呼叫 `db.closeAsync()` 關閉連線，但匯入完成後沒有任何程式碼重新開連線、更新回 `DBProvider` 的 context，導致同一次 App 執行期間所有後續查詢都撞到已關閉的舊連線；上次記錄「連重開 App 都救不回來」這點今天沒有重現（重開後其實會恢復，因為 `DBProvider` 的 `useEffect` 會重新 `initDB()`），但使用者體驗上不該逼人重開 App
  - 修復：`DBProvider` 新增 `reloadDB()`（開新連線＋更新 context，且不會讓 children 整個卸載重掛），`BackupRestoreModal` 在 `importBackup()` 成功後呼叫它
  - 新增測試：`src/__tests__/providers/DBProvider.test.tsx`、`src/__tests__/components/BackupRestoreModal.test.tsx`
  - 在模擬器上完整跑過一次「匯出→新增→匯入→（不重開 App）再新增」，直接用 sqlite3 查容器內的 db 檔案確認新記錄真的寫入成功（meals 3 筆，含當下時間戳記），Metro log 全程無錯誤
  - 順帶完成 ios-001（build＋啟動＋截圖）與 ios-003（匯出/匯入＋這次的回歸測試）的證據
  - 發現一個範圍外的既有限制並記錄：photos 表存絕對路徑，App 重灌會讓舊照片路徑失效（不在本次修復範圍，已寫入 ios-003 notes）
- 執行過的驗證：`pnpm test`（91 passed）、`pnpm typecheck`（既有錯誤與本次改動無關，本次改動的檔案本身型別乾淨）、模擬器手動操作＋sqlite3 直接驗證資料庫內容、Metro log 檢查
- 已擷取證據：見 feature_list.json ios-001／ios-003 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：ios-002 的「拍照開啟 CameraLaunchModal」尚未實測；photos 表絕對路徑的可攜性問題待開獨立項目處理
- 下一步最佳動作：完成 ios-002 剩下的相機 modal 驗證

### 工作階段 001

- 日期：2026-07-17
- 本輪目標：導入 harness-engineering 工作流（/harness-init）
- 已完成：安裝 harness 範本；init.sh 設定為 pnpm；修復 2 個過時測試（photoService 等比例縮放 ecf502d 後只給 width；TodayScreen 拍照改開 CameraLaunchModal），87 tests 全過；寫入 iOS 路線 6 項功能
- 執行過的驗證：./init.sh
- 已擷取證據：見下方工作階段記錄與 git commit
- 提交記錄：chore: 導入 harness-engineering 工作流（本輪 commit）
- 已知風險或未解決問題：RCTBridge 修復未進 git；icon alpha 通道需在 native-001 確認；ios-004/005 依賴 Apple Developer 帳號
- 下一步最佳動作：開始 ios-001（先照 SPARKWEAR/docs/ios-testing/README.md 確認本機環境）
