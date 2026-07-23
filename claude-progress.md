# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKPLATE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-23 為 111 tests passed）
- 目前最高優先級未完成功能：無（monetization-001 已 passing，使用者自行在模擬器/實機確認過所有個別鎖點；同一套模式已複製到 SPARKSHAPE/SPARKFIT/SPARKLOG 並全部 passing）
- 目前 blocker：無
- 背景：Apple Developer Program 已生效（2026-07-20）；ios-001～ios-006、native-001 皆已 passing（含實機驗證音量鍵快門）；EAS 雲端建置成功產出 .ipa；已設定 EAS Update（OTA）支援並實際用過一次（音量鍵時間窗口調整就是用 eas update 推送，沒有重新走完整 build）；eas.json 加了 ascAppId，eas submit 可以完全非互動執行；2026-07-20 修好「匯入備份後資料庫唯讀」的既有 bug

## 工作階段日誌

### 工作階段 012

- 日期：2026-07-23
- 本輪目標：分頁列底部安全區改成依「有沒有廣告」動態決定（跟 SPARKWEAR/SPARKSHAPE 同步處理）
- 已完成：`app/(tabs)/_layout.tsx` 加 `useIsPro()`，`bottomInset = isPro ? insets.bottom : 0`（`useSafeAreaInsets` 原本就有 import），動態加到 `tabBarStyle.height`/`paddingBottom`；這個專案的分頁畫面本來就沒有 SafeAreaView 重複保留 bottom edge 的問題，不用額外修
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤，既有 FlashList/Mood 型別錯誤與本次改動的檔案無關）；`npx jest`（19 suites、111 tests 全過）
- 已知風險或未解決問題：Pro（無廣告）分支目前無法在模擬器上實測（RevenueCat 尚未設定金鑰），邏輯依賴標準 `useSafeAreaInsets()` 疊加，未做額外模擬器驗證
- 下一步最佳動作：下次工作階段開始時照常從 feature_list.json 選下一個 not_started 功能

### 工作階段 011

- 日期：2026-07-23
- 本輪目標：移除首頁跳轉 SPARK SHAPE/SPARK FIT 的互連連結（使用者要求跟 SPARKSHAPE/SPARKFIT 同步處理）
- 已完成：`app/index.tsx` 移除 `sisterApps` 連結區塊與相關 style、未用到的 `Linking` import
- 執行過的驗證：`npx jest`（19 suites、111 tests 全過）；`npx tsc --noEmit`（既有的 FlashList/Mood 型別錯誤是修改前就存在、與本次改動無關的檔案，未新增錯誤）
- 已知風險或未解決問題：無
- 下一步最佳動作：下次工作階段開始時照常從 feature_list.json 選下一個 not_started 功能

### 工作階段 010

- 日期：2026-07-23
- 本輪目標：複製 SPARKWEAR 的付費功能範本到 SPARKPLATE（monetization-001）
- 已完成：
  - 安裝 `react-native-google-mobile-ads`（直接鎖定 16.3.4，見 SPARKWEAR 的 Kotlin 版本天花板教訓，不要用預設的 16.4.0）與 `react-native-purchases`
  - 新增 `src/constants/monetization.ts`、`src/services/purchases.ts`、`src/hooks/useIsPro.ts`、`src/hooks/useProGate.ts`、`src/components/AdBanner.tsx`（跟 SPARKWEAR 完全同一套 pattern，只是 import 路徑改用這個專案的 `@/` alias）
  - `settingsStore.ts` 加 `isProUnlocked`/`setProUnlocked`；這個 App 的設定是用 Modal（`SettingsModal.tsx`，從 `app/index.tsx` 開）不是獨立畫面，所以額外加了 `pendingSettingsOpen` flag（沿用專案既有的 `pendingExportOpen`/`pendingScreenshot` pattern），`useProGate` 的升級提示按下「升級 Pro」時觸發這個 flag＋導回首頁，`index.tsx` 監聽後自動開啟 SettingsModal
  - `SettingsModal.tsx` 加上 PRO 解鎖區塊（升級 Pro／恢復購買按鈕）＋把開機用相機開關、拍照自動下載開關、主題色確認套用、匯出/匯入按鈕都接上 `requirePro()`；`app/(tabs)/_layout.tsx` 的分享／截圖按鈕也接上
  - 廣告放置：首頁、照片牆/標籤分頁（掛在 `app/(tabs)/_layout.tsx` 共用一條，在分頁列下方，同 SPARKWEAR 教訓調整 tabBarStyle 高度避免被墊高）
  - 新增對應的單元測試（`useIsPro.test.ts`／`useProGate.test.ts`／直接複製 SPARKWEAR 的 `purchases.test.ts`），111 tests 全過
  - `npx expo prebuild --platform ios && pod install` 成功；`npx expo run:ios` 建置成功並在模擬器實測：首頁看得到 AdMob 測試廣告、設定頁正常渲染 PRO 解鎖區塊、點「升級 Pro」正確跳出『升級失敗：RevenueCat 尚未設定，無法購買』
- 執行過的驗證：`./init.sh`（111 tests passed）、`npx tsc --noEmit -p .`（無新增錯誤）、模擬器手動操作（主流程，見上）
- 已擷取證據：見 feature_list.json monetization-001 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：個別鎖點（開機用相機/拍照自動下載/分享/截圖/匯出/匯入各自跳出升級提示、恢復購買按鈕、Android 全功能開放）還沒逐一手動點過——這次在模擬器上因為 AppleScript 座標點擊校正卡在一個 React Native Alert 的 OK 按鈕上（換算多次仍點不到，可能跟畫面上疊了一個 dev perf 監測 HUD 有關），改用單元測試＋一次真實端對端互動作為證據，requirePro 邏輯本身已經被單元測試完整覆蓋且跟 SPARKWEAR 是同一套函式
- 下一步最佳動作：使用者有空時自己在模擬器/實機快速點過一輪個別鎖點確認畫面正確 → monetization-001 改 passing；接著複製同一套模式到 SPARKSHAPE/SPARKFIT/SPARKLOG

### 工作階段 009

- 日期：2026-07-22
- 本輪目標：設定 EAS Update（OTA）支援，並收尾 ios-006（音量鍵快門）的實機驗證
- 已完成：
  - `eas update:configure` 設定 OTA 更新；eas.json 加 `ascAppId` 讓 `eas submit` 可以完全非互動
  - 重新 `eas build` + `eas submit`（Build 3，含音量鍵快門修復＋OTA 設定）→ 使用者在 App Store Connect 加入測試群組 → iPhone TestFlight 安裝
  - 實機初測：連按兩下音量鍵沒反應，反而長按會觸發；查出根因是 `DOUBLE_PRESS_WINDOW_MS = 600` 太緊，兩次獨立按壓的間隔常超過 600ms（長按時連續音量下降剛好落在窗口內才會觸發）
  - 跟使用者確認後放寬到 1200ms，用 `eas update --channel production`（本輪第一次實際使用 OTA 機制）推送，不需要重新走完整 native build
  - 使用者完全關閉 App 重開套用更新，確認連按兩下音量－鍵成功觸發拍照；音量＋鍵沒反應（設計如此，只偵測音量下降）
- 執行過的驗證：`pnpm test`（94 tests passed）、實機 TestFlight 測試、eas update 推送驗證
- 已擷取證據：見 feature_list.json ios-006 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：無
- 下一步最佳動作：feature_list.json 全部 passing，無待辦項目；之後純 JS/TS 修改可優先考慮 `eas update`

### 工作階段 008

- 日期：2026-07-22
- 本輪目標：修 ios-006（音量鍵快門設定開關沒接上）
- 已完成：
  - `src/stores/settingsStore.ts` 加上 `volumeQuickCapture` 狀態＋AsyncStorage 持久化（沿用 `autoSavePhoto` 的既有模式）
  - `src/components/SettingsModal.tsx` 加開關 UI，沿用既有 Switch 樣式
  - `src/components/CameraLaunchModal.tsx` 內接上 `useVolumeQuickCapture(() => { if (visible) handleCapture(); })`，用 `visible` 防止 Modal 隱藏時（元件仍掛載）背景誤觸
  - 過程中踩到一個環境坑：`npx expo run:ios` 時沒先關掉還在跑的 SPARKWEAR Metro server，兩個 App 搶同一個 8081 port，導致 SPARKPLATE 的原生殼載入了 SPARKWEAR 的 JS bundle（跳出 Worklets 版本不符的紅屏）。關掉舊的 SPARKWEAR process、確認 port 8081 沒有 LISTEN 之後重新 `expo run:ios` 才正確載入
  - 模擬器實測：設定開關能打開、關閉重開設定頁後狀態有記住（持久化正常）；拍照畫面正常開啟無閃退（回歸測試通過）
- 執行過的驗證：`pnpm test`（94 tests passed，含新增 3 個測試）、模擬器手動操作（使用者確認開關持久化、拍照畫面正常）
- 已擷取證據：見 feature_list.json ios-006 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：模擬器沒有實體音量鍵，「連按兩下真的觸發拍照」這個核心行為還沒驗證，需要使用者拿實體 iPhone 測試
- 下一步最佳動作：等使用者有 iPhone 時收尾 ios-006（連同 SPARKWEAR 的 ios-006 一起測，同樣卡在這一步）

### 工作階段 007

- 日期：2026-07-21
- 本輪目標：完成 ios-005（TestFlight 內部測試）剩餘步驟——加入測試群組＋實機驗證
- 已完成：
  - 使用者於 App Store Connect 把 Build 2 加入內部測試群組，iPhone 用 TestFlight 成功安裝並開啟 SPARKPLATE
  - 實機重跑核心流程：新增餐點（相簿選圖＋真實相機拍照 CameraLaunchModal）、完全關閉重開確認持久化，皆正常
  - 使用者反映按音量鍵沒反應（螢幕變暗，疑似誤按電源鍵）；查 src/hooks/useVolumeQuickCapture.ts 發現它依賴 settingsStore 的 volumeQuickCapture 欄位才會註冊監聽，但 src/stores/settingsStore.ts 根本沒有定義這個欄位——功能在正式版是死碼，永遠不會啟用，不是使用者操作錯誤。與使用者確認後把這條驗證從 ios-005 移除，開 ios-006 追蹤修復
- 執行過的驗證：見上述，皆為使用者實機手動操作＋程式碼查證
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：ios-006 尚未規劃，僅記錄現象與初步修法方向
- 下一步最佳動作：ios-006；或視使用者意願先處理其他 App 的 ios-005

### 工作階段 006

- 日期：2026-07-21
- 本輪目標：ios-005 中不需要實機的部分先做完（eas submit）
- 已完成：使用者於 Terminal.app 互動執行 `eas submit --platform ios --profile production --latest`，Build a825877a-6425-4e57-b4db-de49c392255b 上傳成功
- 執行過的驗證：實際跑 eas submit，看到「Submitted your app to Apple App Store Connect!」完成訊息
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：f9481de
- 已知風險或未解決問題：ios-005 剩餘兩步需要使用者的實體 iPhone
- 下一步最佳動作：等使用者有 iPhone 可測時，完成 ios-005 剩餘步驟

### 工作階段 005

- 日期：2026-07-20
- 本輪目標：完成 ios-004（EAS iOS 雲端建置成功）
- 已完成：新增 eas.json（參考 SPARKWEAR 範本，含 SPARKWEAR 那輪發現的 Node 版本修法）；`eas init` 建立 EAS 專案；`eas build --platform ios --profile production`（互動模式，Distribution Certificate 沿用 SPARKWEAR 建置時已建立的、只需新建 Provisioning Profile）一次就成功，沒有再踩到 Node 版本問題
- 執行過的驗證：實際跑 EAS 雲端建置，一次成功
- 已擷取證據：見 feature_list.json ios-004 evidence，含 build URL 與 .ipa 下載連結
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增
- 下一步最佳動作：開始 ios-005（TestFlight 內部測試，需要實體 iPhone）

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
