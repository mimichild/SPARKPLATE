# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKPLATE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-08-29 為 124 tests passed）
- **重要現況**：iOS 1.0.1 先前被 Apple 拒絕理由 4.3(a) Spam（回覆申訴後已消失）、接著又因 **Guideline 3.1.2(c)** 被拒（App 內「升級 Pro」購買路徑繞過方案資訊）。工作階段 028～031 陸續修正程式碼（架構改成全域 SettingsModal＋settingsScrollToken 捲回頂部），但**這個 3.1.2(c) 被拒的送審（提交 ID 6f1123ae...）至今從未真正修復重新送審**——App Store Connect 上掛的仍是最早被拒的 Build 7，Pro 月費／Pro 年費／SPARK PLATE Pro 訂閱群組三項狀態都回到「準備審查」（未核准、未在審查中），RevenueCat 後台對應顯示這兩個商品「Could not check」。工作階段 032 排查確認：使用者最新回報「按升級 Pro 都不會觸發付費頁面」不是程式碼 bug，是因為這是帳號第一次要上架的自動續訂訂閱，Apple 規定必須隨審查通過的 App 版本才會正式生效，目前卡住導致 RevenueCat `getOfferings()` 對任何人（含 Sandbox/TestFlight）都拿不到方案，`SettingsModal.tsx` 在方案為空時正確顯示「暫時無法載入方案資訊」fallback、不會有可購買按鈕。經使用者確認，暫時把六個 Pro 專屬功能（截圖、分享、開機用相機、拍照自動下載、匯出備份、匯入備份）按下時的提示，從「跳出升級 Pro、導去設定頁（現在是死路）」改成純告知的「訂閱 Pro 方案後解鎖」、不做任何導航（`useProGate.ts`）。**這整串拒絕不影響目前已上架的 1.0 版**，1.0 持續正常供應中，但線上 1.0 版本的「升級 Pro」仍是壞的（訂閱被開發者拒絕），要等 1.0.1 審查通過才會修好
- ios-101-001／photo-naming-001：狀態 in_progress；已回覆 Apple 3.1.2(c) 訊息並附上錄影，但提交項目上當時掛的仍是不含修正的 Build 7；工作階段 033 已本機建置＋上傳 **Build 14**（原生打包含這幾輪全部 JS 修正，不依賴 OTA），TestFlight 狀態「完成」「準備提交」，等使用者實機測試確認六個 Pro 專屬功能入口行為正確後，需把這個 build 換掛到卡住的 3.1.2(c) 提交項目（目前還掛著 Build 7）上，再點「重新提交至 App 審查」→ 等審查通過（App 版本＋兩個訂閱＋訂閱群組會一起審）；審查通過後需實機驗證四件事（啟動畫面無 icon、升級 Pro 正常購買且會先看到方案資訊、拍照檔名依時間排序、Pro 專屬功能升級提示不再繞過購買）才能改為 passing，見工作階段 026～033；**備忘：下次遇到 EAS 免費 build 額度用完，可直接用 `eas build --local` 本機建置繞過，不用等額度重置**；**備忘：純 JS 改動不需要重新 native build，用 `eas update --branch production` 推 OTA 即可，省資源**；**備忘：第一次自動續訂訂閱若跟著的 App 版本被拒絕，訂閱狀態會被打回「準備審查」，RevenueCat 那邊商品會變成「Could not check」，購買功能會整個失效，必須實際走完一次審查通過才會恢復，不是程式碼能繞過的**
- 目前最高優先級未完成功能（不含上述兩項）：無；AdMob 已設定並**已實機驗證購買成功**（RevenueCat 官方事故已於 7/31 解決，但見上方「重要現況」，該次驗證是在訂閱審查還有效時做的，08-10 撤回提交後訂閱已失效）；順帶修好 `useProGate.ts` 一個真實 bug（見工作階段 016）
- appstore-001：passing。2026-08-19 那輪送審已被 Apple 核准（版本狀態「已可發佈」），但核准後「定價與供應狀況」未設定供應地區，導致 App 顯示「已從 App Store 下架停售」；2026-08-27 已設定「所有國家或地區（175 個）」解除，24 小時內在 App Store 生效，「自動發佈此版本」設定確認生效中，不需額外手動發佈
- 目前 blocker：無；等待 24 小時供應狀況全面生效讓 App 真正出現在 App Store 上；另有一個不阻擋上架、但需留意的待辦——App Store Connect 發佈頁面出現「受監管醫療器材聲明」提醒，2027 年初前需在「App 資訊」頁面聲明是否為受監管醫療器材（僅影響歐盟/歐洲經濟區/英國/美國上市），可之後找時間處理
- 背景：Apple Developer Program 已生效（2026-07-20）；ios-001～ios-006、native-001 皆已 passing（含實機驗證音量鍵快門）；EAS 雲端建置成功產出 .ipa；已設定 EAS Update（OTA）支援並實際用過一次（音量鍵時間窗口調整就是用 eas update 推送，沒有重新走完整 build）；eas.json 加了 ascAppId，eas submit 可以完全非互動執行；2026-07-20 修好「匯入備份後資料庫唯讀」的既有 bug；2026-08-08 第一次跑本機 Android APK 建置（build-apk skill），過程中發現並修復 android/ manifest 缺 AdMob APPLICATION_ID 的問題（見工作階段 018）；2026-08-08 App Store 審查一度被拒（Age Rating 廣告內容描述沒勾選，跟訂閱資訊無關），已修正並重新送審過一次；2026-08-10 又因為訂閱付費畫面缺必要資訊主動撤回審查、修復、重新送審（見工作階段 019）

## 工作階段日誌

### 工作階段 033

- 日期：2026-08-29
- 本輪目標：接續工作階段 032，使用者要求換一個含完整修正的 build 給自己測試，測完再重新提交，取代提交項目上掛的 Build 7（3.1.2(c) 最初被拒絕時的版本，不含任何後續修正）
- 已完成：
  - `npx eas-cli build --platform ios --profile production`：雲端額度仍未重置（要等 2026-09-01），build number 從 12 遞增到 13 後失敗
  - 改用 `npx eas-cli build --platform ios --profile production --local` 本機建置成功（因雲端失敗嘗試已佔用 13，本機建置實際遞增到 **14**）；`npx eas-cli submit --platform ios --path <ipa>` 上傳成功，完成後刪除本機 `.ipa`
  - App Store Connect TestFlight 頁面確認 Build 14「完成」「準備提交」，已自動加入內部測試群組「Team (Expo)」
  - 更新 `feature_list.json`（ios-101-001 新增 1 筆 evidence）與 `claude-progress.md`「目前已驗證狀態」
- 執行過的驗證：`eas build --local` 指令輸出確認 Archive Succeeded、IPA 匯出成功；`eas submit` 指令輸出確認上傳成功；App Store Connect TestFlight 頁面文字讀取確認 Build 14 狀態與測試群組
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增 1 筆）
- 提交記錄：（見本輪 commit，僅文件更新）
- 已知風險或未解決問題：Build 14 原生打包已包含這幾輪全部 JS 修正（不依賴 OTA 下載時機），但**尚未經使用者實機測試**，也**尚未換掛到卡住的 3.1.2(c) 提交項目上**（目前該提交項目仍掛著 Build 7）
- 下一步最佳動作：請使用者用 TestFlight 更新到 Build 14，完整重測六個 Pro 專屬功能入口（截圖、分享、開機用相機、拍照自動下載、匯出備份、匯入備份）的提示文案與導航行為；確認無誤後，去 App Store Connect 把該提交項目的建置版本從 Build 7 換成 Build 14，點「重新提交至 App 審查」

### 工作階段 032

- 日期：2026-08-29
- 本輪目標：使用者回報「分享／截圖」按升級 Pro 會跑回設定頁、「開機用相機／拍照自動下載」按升級 Pro 後停在設定頁，四個入口都不會觸發付費頁面，請 Claude 找原因並修正
- 已完成：
  - 用 systematic-debugging 排查：先讀 `useProGate.ts`／`settingsStore.ts`／`SettingsModal.tsx`／`app/_layout.tsx` 確認工作階段 028～031 的架構修法（全域 Modal＋scroll token）程式碼都還在、邏輯正確，不是這幾輪改壞的
  - 用 claude-in-chrome 查 App Store Connect：提交詳情頁（提交 ID `6f1123ae-4e98-44fe-ac85-2618b5223204`）顯示「問題未解決——App 版本遭到拒絕，且目前無其他可獲接受或能通過核准的提交項目」，iOS App 1.0.1 掛的仍是 Build 7（3.1.2(c) 被拒絕的那個版本，從未換成含修正的 Build 12），Pro 月費／Pro 年費／SPARK PLATE Pro 訂閱群組三項狀態都回到「準備審查」
  - 交叉查 RevenueCat 後台（app.revenuecat.com）Product catalog > Products 頁面：`com.sparkplate.app.pro.yearly`／`com.sparkplate.app.pro.monthly` 兩個 App Store 商品狀態都是「Could not check」，證實 RevenueCat 自己都無法跟 Apple 核對這兩個商品現況
  - 確認根因：這是帳號第一次要上架的自動續訂訂閱，Apple 規定必須隨審查通過的 App 版本才會正式生效（含 Sandbox/TestFlight 測試），目前這唯一一次送審卡在「已拒絕」，訂閱從未真正核准過，導致 `Purchases.getOfferings()` 現在對任何人都拿不到方案；`SettingsModal.tsx` 在方案為空陣列時依規定顯示「暫時無法載入方案資訊，請稍後再試」fallback、不給可購買按鈕——使用者看到的「停在設定頁沒反應」正是這個 fallback，不是導覽壞掉，是程式碼正確地不讓你繞過去買。跟使用者說明後，使用者確認這不用等審查，先改 UX
  - 使用者要求：截圖、分享、開機用相機、拍照自動下載、匯出備份、匯入備份這六個 Pro 專屬功能按下時，不要跳出「升級 Pro」導去設定頁，改成直接顯示「訂閱 Pro 方案後解鎖」
  - 依 TDD 修正：先改 `src/__tests__/hooks/useProGate.test.ts`（斷言 Alert 不帶按鈕陣列、`settingsStore.settingsVisible` 呼叫後維持 false——Red：`npx jest` 顯示 2 個失敗）；`src/hooks/useProGate.ts` 的 `requirePro()` 移除 `openSettings()` 呼叫與 `useSettingsStore` import，`Alert.alert()` 改成只傳 title／message 兩個參數（不帶 buttons，系統預設單一 OK 鈕），不再導航（Green：3 tests 全過）
  - 使用者接著要求六個入口不要一刀切：截圖、分享（在分頁頂欄，不在設定頁內部）要恢復原本「升級 Pro → 導去設定頁」的行為，其餘四個（已經在設定頁內部）維持純告知不導航
  - 依 TDD 修正：先在 `useProGate.test.ts` 新增案例驗證 `requirePro(label, { openSettingsOnUpgrade: true })` 會顯示帶「升級 Pro」按鈕的提示且按下後開啟設定頁（Red：`npx jest` 顯示 1 個失敗）；`useProGate.ts` 的 `requirePro()` 加回 `useSettingsStore` 的 `openSettings`，新增第二個參數 `options?: { openSettingsOnUpgrade?: boolean }` 控制要不要顯示原本兩顆按鈕的提示並導航；`app/(tabs)/_layout.tsx` 的「截圖」「分享」呼叫改傳 `{ openSettingsOnUpgrade: true }`，`SettingsModal.tsx` 內部五個呼叫點維持不傳、走預設純告知（Green：4 tests 全過）
  - 使用者再要求兩邊文案要一致，統一改成「升級 Pro 即可解鎖」（原本導航版多了「，要現在查看方案嗎？」、不導航版是「訂閱 Pro 方案後解鎖」，兩邊不同）
  - 依 TDD 修正：先改 `useProGate.test.ts` 三個案例的期望文案（Red：`npx jest` 顯示 3 個失敗）；`useProGate.ts` 的 `requirePro()` 兩個分支的 Alert message 都改成 `'升級 Pro 即可解鎖'`（Green：4 tests 全過）
  - 使用者最後要求截圖／分享：提示文字不要加其他句子或按鈕文字（就只有「{功能}為 Pro 專屬功能，升級 Pro 即可解鎖」這句話），並且要自動導去設定頁，不需要使用者額外按「升級 Pro」按鈕確認
  - 依 TDD 修正：先改 `useProGate.test.ts` 的 `openSettingsOnUpgrade` 案例，斷言 Alert 不帶 buttons 陣列、呼叫 `requirePro` 後 `settingsVisible` 立刻變 true（不用手動觸發按鈕 onPress）（Red：`npx jest` 顯示 1 個失敗，仍收到帶按鈕陣列的呼叫）；`useProGate.ts` 簡化 `requirePro()`：兩種情況統一只傳 title/message、不帶 buttons；`openSettingsOnUpgrade: true` 時改成跳出提示的同時同步呼叫 `openSettings()`，不再靠按鈕 onPress 觸發（Green：4 tests 全過）
  - 更新 `feature_list.json`（ios-101-001 新增 5 筆 evidence 記錄本輪排查與四次 UX 修正、`user_visible_behavior`／`verification`／`notes` 同步更新）與 `claude-progress.md`「目前已驗證狀態」
  - 使用者確認推送：`npx eas-cli update --branch production --non-interactive` 發佈成功——iOS Update group `e95be076-07cd-4ee5-9753-b9fba62498fd`（Runtime version 1.0.1，跟 Build 12 相符）、Android Update group `3f8af773-58ea-479a-a037-77c710b4ec73`（Runtime version 1.0.0）
  - 使用者提供實機錄影（89.6MB），要求上傳並回覆 Apple 3.1.2(c) 那則訊息，說明按分享/截圖與其他功能鍵可到設定頁 PRO 解鎖區塊訂閱
  - 用 ffmpeg 把影片壓縮成 2.5MB（h264/1080寬/30fps，符合附件大小限制），抽取多個影格檢視內容：確認 PRO 解鎖區塊正常顯示方案標題/期間/價格，按「訂閱」後真的觸發 TestFlight sandbox 購買確認框；但發現確認框金額（$100/$790）跟 App 內顯示（$2.99/$24.99）不符，一度誤判為嚴重超收費用 bug，先暫停不上傳
  - 查證：App Store Connect「Pro 月費/年費」的「所有價格與貨幣」表格，確認台灣(TWD)定價本來就是 NT$100/NT$790（對應 $2.99/$24.99 USD 級距的官方換算金額），跟確認框金額完全吻合，排除超收疑慮；判斷 App 內顯示的 $2.99/$24.99 是沙盒測試環境已知現象（價格預覽用裝置真實 Apple ID 地區、實際購買用另一組沙盒測試帳號地區，正式上架後不會有此分裂），非真正的定價 bug，經使用者確認後繼續
  - 用 claude-in-chrome 在提交詳情頁（提交 ID `6f1123ae...`）點「回覆 App 審查」，貼上英文說明（描述 requirePro() 實際行為：六個 Pro 專屬功能都顯示提示，截圖/分享自動導去設定頁 PRO 解鎖區塊看到方案資訊後才能購買，其餘四個可自行進入同一區塊），附加壓縮後的影片，送出——訊息串確認變成「訊息 (4)」，新增回覆與附件
- 執行過的驗證：`npx jest src/__tests__/hooks/useProGate.test.ts`（四輪 Red→Green，最終 4 tests 全過）；`npx jest`（全套 20 suites、125 tests 全過，無回歸）；`npx tsc --noEmit -p .`（本次改動的 3 個檔案無新增錯誤，既有 FlashList/Mood/MealGrade 型別錯誤與本次改動無關）；App Store Connect／RevenueCat 頁面文字讀取（get_page_text）確認訂閱審查卡住現況與定價設定；`eas update` 指令輸出確認 iOS/Android 更新已發佈；App Store Connect 訊息串確認回覆與附件送出成功
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增 8 筆）
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：這次 OTA 已推送，但**尚未經使用者實機確認生效**（可能需要完全關閉重開 App 才會抓到新 bundle，見工作階段 031 的已知風險）；**回覆 Apple 時提交項目上掛的仍是 Build 7**（3.1.2(c) 最初被拒絕時的那個 build，不含任何後續 requirePro/SettingsModal 修正），所有修正都是靠 OTA 推送生效，若 Apple 審查時用全新裝置安裝 Build 7 且未觸發過 OTA 更新檢查，看到的可能還是修正前的舊版行為——這次回覆沒有處理換 build，是否需要額外換 build 重新提交，需視 Apple 後續回應決定
- 下一步最佳動作：請使用者完全關閉並重開 App 確認抓到 OTA 更新，重測六個 Pro 專屬功能入口的提示文案與導航行為是否符合預期；等待 Apple 對這次回覆的回應；如果 Apple 之後又抓到問題（尤其可能與 Build 7 沒有原生層級修正有關），優先確認並換上含完整修正的 build 再重新提交，不要只靠訊息文字說明

### 工作階段 031

- 日期：2026-08-29
- 本輪目標：接續工作階段 030，使用者確認要跑 Build 10；跑 Build 10 遇到雲端額度用完，改用本機建置；使用者測試新 build 後回報「開啟時直接用相機打開／拍照時自動下載照片」按升級 Pro 後停留在設定頁沒反應，並要求務必先確認修好再跑 build（本機建置吃資源）
- 已完成：
  - `eas build --platform ios --profile production` 失敗：帳號當月 EAS 免費方案 iOS build 額度已用完，訊息顯示 2026-09-01 重置
  - 使用者問能否用 `eas build --local`：確認本機環境（Xcode 26.6、CocoaPods 1.17.0），發現缺 `fastlane`，用 `brew install fastlane` 補裝後重跑，本機建置成功產出 `.ipa`（因先前失敗的雲端嘗試已佔用 buildNumber 到 10，這次本機建置實際遞增到 Build 12）；`eas submit --path` 上傳成功；`.gitignore` 補上 `*.ipa`／`.expo/` 避免建置產物誤入版控
  - App Store Connect TestFlight 確認 Build 12「完成」「準備提交」並自動加入內部測試群組；請使用者更新測試
  - 使用者回報：分享／截圖已正常導向設定頁（工作階段 030 的架構修法確認有效）；但「開啟時直接用相機打開」「拍照時自動下載照片」這兩個在 SettingsModal 內部觸發的升級提示，按「升級 Pro」後停留在設定頁、沒有任何反應
  - 排查（讀程式碼，非重跑 build 除錯）：確認這不是架構性 bug，是設計疏漏——這兩個 toggle 觸發 `requirePro()` 時，使用者本來就已經在設定頁裡（`settingsVisible` 已經是 `true`），呼叫 `openSettings()` 沒有造成任何可觀察的狀態變化，而使用者當下的捲動位置在畫面下方的 toggle 區塊，看不到頁面最上方顯示方案標題／期間／價格的 PRO 解鎖區塊，因此誤以為完全沒反應
  - 依 TDD 修正：`src/stores/settingsStore.ts` 新增 `settingsScrollToken`（每次 `openSettings()` 呼叫都遞增，即使 `settingsVisible` 沒有變化），先在 `src/__tests__/stores/settingsStore.test.ts` 新增兩個測試案例（驗證 `openSettings` 設定 `settingsVisible` 為 true、驗證重複呼叫時 `settingsScrollToken` 會遞增）；`src/components/SettingsModal.tsx` 幫 `ScrollView` 加上 `ref`，新增 `useEffect` 監看 `settingsScrollToken` 變化時呼叫 `scrollTo({ y: 0, animated: true })` 捲回頂部
  - 判斷這次修正純屬 JS 邏輯、完全沒有動到任何原生程式碼或原生依賴，符合用 EAS Update（OTA）推送的條件——確認 `app.json` 的 `runtimeVersion.policy` 是 `appVersion`（目前是 1.0.1），跟 Build 12 的 runtime version 相符，執行 `eas update --branch production` 推送更新，不需要重新 build/送審，直接省下使用者擔心的建置資源
  - 更新 `feature_list.json`（ios-101-001 新增 5 筆 evidence 記錄本機建置繞過額度限制的過程、bug 排查、TDD 修正、OTA 推送結果；notes 補充教訓：下次額度用完可直接想到 `--local`、純 JS 改動可以用 `eas update` 省資源不用整個重 build）與 `claude-progress.md`「目前已驗證狀態」
- 執行過的驗證：`npx jest src/__tests__/stores/settingsStore.test.ts`（新增 2 個測試全過）；`npx jest`（全套 20 suites、124 tests 全過）；`npx tsc --noEmit -p .`（本次改動的 3 個檔案無新增錯誤）；App Store Connect TestFlight 頁面文字讀取確認 Build 12 狀態；`eas update` 指令輸出確認 iOS 更新已發佈（Runtime version 1.0.1、Update group ID 07c0f952-486d-4c57-94af-ac97af96e037）
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增）
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：OTA 更新已推送，但**尚未經使用者實機確認生效**——expo-updates 預設通常在 App 冷啟動時檢查更新，使用者可能需要完全關閉 App 再重開（而非只是切到背景）才會抓到新的 JS bundle；如果使用者測試後發現還是沒生效，需要進一步確認 App 內的 update-check 設定或改用手動觸發更新檢查
- 下一步最佳動作：請使用者完全關閉並重開 App（確保抓到 OTA 更新），完整重測全部四個入口（分享、截圖、開機用相機、拍照自動下載）；全部確認正常後請使用者錄影，再去 App Store Connect 回覆 3.1.2(c) 那則訊息並附上錄影

### 工作階段 030

- 日期：2026-08-29
- 本輪目標：接續工作階段 029，使用者確認後執行 eas build + eas submit 產生 Build 9；使用者實機測試後回報問題依然存在，且範圍擴大：截圖／分享仍跳回主畫面，開啟時直接用相機打開／拍照時自動下載照片這兩個 toggle 觸發升級提示後「就不會動了」
- 已完成：
  - `npx eas-cli build --platform ios --profile production --non-interactive`（buildNumber 遞增到 9）→ Build 成功 → `npx eas-cli submit ... --latest --non-interactive` → 上傳成功；背景等待後確認 TestFlight 頁面 Build 9 狀態「完成」「準備提交」，已自動加入內部測試群組
  - 使用者更新到 Build 9 後回報症狀依舊：截圖／分享仍跳回主畫面（工作階段 029 的 navigate 修法沒解決），且新發現開啟時直接用相機打開／拍照時自動下載照片這兩個「在 SettingsModal 內部呼叫 requirePro」的 toggle，按升級 Pro 後完全沒反應
  - 判斷 `router.navigate('/')` 只是換一種方式踩到同一類問題（expo-router 在巢狀導覽 `(tabs)` 底下的分頁、以及同路由情境下，對「是否重用既有畫面實例」的行為不夠穩定可預期），不是根治，繼續在 router 方法上打轉不會有結果——用 AskUserQuestion 跟使用者確認要不要換成架構層級的修法（把設定頁改成掛在 App 最頂層、不需要 router 導航），取得同意後執行
  - 依 TDD 流程重構：先改 `src/__tests__/hooks/useProGate.test.ts`（斷言改成檢查 `settingsStore.settingsVisible` 變 true，不再涉及任何 router 呼叫）與新增 `src/__tests__/screens/SplashScreen.test.tsx` 的測試案例（驗證設定按鈕呼叫 openSettings 且不觸發任何 router 方法），確認先跑出失敗（Red）
  - 實作：`src/stores/settingsStore.ts` 把語意不精準的 `pendingSettingsOpen`／`triggerSettingsOpen`／`clearPendingSettingsOpen`（原本設計成『一次性訊號，某個畫面消費後清掉』）重構成 `settingsVisible`／`openSettings`／`closeSettings`（『實際顯示狀態』，沒有消費/清除的概念）；`src/hooks/useProGate.ts` 的「升級 Pro」onPress 改成單純呼叫 `openSettings()`，移除 `router`／`expo-router` import；`app/index.tsx` 移除本地 `showSettings` state 與 `SettingsModal` import／渲染，設定按鈕改成直接呼叫 store 的 `openSettings`；`app/_layout.tsx` 新增 `GlobalSettingsModal` 元件、固定掛在 `RootLayout` 的 `<Stack>` 旁邊，讀 `settingsStore` 的 `settingsVisible`／`closeSettings` 傳給 `SettingsModal`——這樣不管使用者當下在哪個畫面（含巢狀在 `(tabs)` 底下的 gallery/filter/today），Modal 都能直接以原生 `<Modal>` 疊上去，完全不需要導航
  - 全部測試轉綠（Green）；`grep` 確認沒有殘留 `pendingSettingsOpen` 等舊機制的引用
  - 更新 `feature_list.json`（ios-101-001 新增 3 筆 evidence 記錄 Build 9 測試結果、根因重新判斷、架構重構過程；notes 補充這次的教訓——一開始照抄專案裡既有的 pendingCameraOpen 等 trigger-flag 模式是誤用，那些既有模式適合『導向特定畫面觸發一次性動作』，不適合『同一元件無論從哪呼叫都要能疊加顯示』的需求）與 `claude-progress.md`「目前已驗證狀態」
- 執行過的驗證：`npx jest src/__tests__/hooks/useProGate.test.ts`、`npx jest src/__tests__/screens/SplashScreen.test.tsx`（皆 Red→Green）；`npx jest`（全套 20 suites、122 tests 全過，比修正前多 1 個新測試）；`npx tsc --noEmit -p .`（本次改動的 5 個檔案無新增錯誤）
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增）
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：程式碼修正已完成但**尚未進行下一輪 eas build/submit（Build 10）**，需要使用者確認才能執行；這是連續第三輪修這個問題，這次是架構層級的修法（消除了 router 導航本身），理論上應該徹底解決，但基於前兩輪的教訓，**務必請使用者用新 build 完整重測全部四個 Pro 專屬功能入口**（分享、截圖、開機用相機、拍照自動下載）才能下結論，不要只憑程式碼邏輯推斷或只測其中一個入口就回覆 Apple
- 下一步最佳動作：跟使用者確認是否要現在跑 `eas build --platform ios` + `eas submit`（Build 10）；上傳完成後請使用者完整重測全部四個入口；全部確認正常後請使用者錄影，再去 App Store Connect 回覆 3.1.2(c) 那則訊息並附上錄影

### 工作階段 029

- 日期：2026-08-29
- 本輪目標：接續工作階段 028，使用者確認後執行 eas build + eas submit 產生 Build 8；使用者實機用 TestFlight 測試後回報「在分享的地方按升級 PRO，會跑回主畫面，根本不會有升級的畫面」，請 Claude 排查
- 已完成：
  - `npx eas-cli build --platform ios --profile production --non-interactive`（buildNumber 自動從 7 遞增到 8，app.json version 仍是 1.0.1）→ Build 成功 → `npx eas-cli submit --platform ios --profile production --latest --non-interactive` → 上傳成功
  - 背景等待約 8 分鐘後前往 App Store Connect TestFlight 頁面確認：Build 8 狀態「完成」處理、「正在測試」，已自動加入既有內部測試群組『Team (Expo)』；確認使用者（mimichild@gmail.com／又僖）已是該群組測試人員（先前裝過 1.0.0 (5)），不需額外設定即可透過 TestFlight App 更新
  - 回覆使用者「新 build 怎麼裝到手機」的提問：說明走 TestFlight（非直接裝 IPA），且使用者已是內部測試人員會自動看到更新
  - 使用者實機更新到 Build 8 後測試回報 bug：點『分享』的 Pro 專屬功能升級提示，按『升級 Pro』直接跳回主畫面，設定頁完全沒打開——用 systematic-debugging 排查：讀 `app/index.tsx` 確認使用者從首頁是用 `router.push('/(tabs)/gallery')` 進入分頁（不是 replace），代表 index 畫面會留在導覽堆疊背景、不會被卸載；讀 `useProGate.ts` 確認工作階段 028 寫的是 `router.replace('/')`——這會在目前所在的分頁位置另外新建一個 index 實例，而非切回背景那個既有實例；兩個 index 實例都訂閱同一個 zustand store，背景那個舊實例會搶先在 pendingSettingsOpen 變 true 的當下就處理掉（setShowSettings(true) + 清旗標），但畫面上使用者實際看到的是新建的那個 index 實例，它掛載時旗標早就被清空，所以完全沒反應——確認為 Build 8 送出去給使用者實測後才發現的新 bug，跟工作階段 028 修的 3.1.2(c) 繞過購買問題是不同層次（那個修法本身邏輯對，但觸發方式在有背景畫面的情境下有 race condition）
  - 依 TDD 修正：先改 `src/__tests__/hooks/useProGate.test.ts` 斷言改成期待 `router.navigate('/')` 而非 `router.replace('/')`（Red：1 個測試失敗）；把 `useProGate.ts` 的 `router.replace('/')` 改成 `router.navigate('/')`（navigate 在堆疊裡已有同名畫面時會切回既有畫面而非新建，避免兩個實例互搶旗標）；補上程式碼註解說明這個 race condition 的成因，避免以後又改回 replace（Green：3 tests 全過）
  - 更新 `feature_list.json`（ios-101-001 新增 4 筆 evidence：Build 8/submit/TestFlight 確認、bug 回報與排查、TDD 修正過程；notes 補充這輪發現與教訓）與 `claude-progress.md`「目前已驗證狀態」
- 執行過的驗證：`npx jest src/__tests__/hooks/useProGate.test.ts`（Red→Green，3 tests 全過）；`npx jest`（全套 20 suites、121 tests 全過，無回歸）；`npx tsc --noEmit -p .`（本次改動的 2 個檔案無新增錯誤）；App Store Connect TestFlight 頁面文字讀取確認 Build 8 狀態與測試人員名單
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增 4 筆）
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：程式碼修正已完成但**尚未進行下一輪 eas build/submit（Build 9）**，需要使用者確認才能執行；這次的教訓是「跨畫面導覽邏輯（router.replace vs navigate）的改動光靠 unit test 測不出堆疊行為的 race condition，必須請使用者實機測試才發現」，之後類似改動應該主動提醒使用者先實機測一輪再回覆 Apple，不要只憑 unit test 通過就認定沒問題
- 下一步最佳動作：跟使用者確認是否要現在跑 `eas build --platform ios` + `eas submit`（Build 9）；上傳完成後請使用者再次實機用 TestFlight 測試「分享／截圖」等 Pro 專屬功能的升級流程，確認這次真的會正確導向設定頁並看到方案資訊；確認無誤後請使用者錄影，再去 App Store Connect 回覆 3.1.2(c) 那則訊息並附上錄影

### 工作階段 028

- 日期：2026-08-29
- 本輪目標：接續工作階段 027，使用者問「你幫我送審了嗎」「現在似乎可以按審查了」，Claude 回去確認 App Store Connect 最新狀態並依實況處理
- 已完成：
  - 確認「重新提交至 App 審查」按鈕仍反灰（截圖比對確認是 disabled 樣式），並讀取提交詳情頁最新訊息：4.3(a) Spam 已從拒絕清單消失（申訴有效），但 Apple 人工複核後追加了新的獨立問題 **Guideline 3.1.2(c) Business: Payments - Subscriptions**——App 內購買流程缺少訂閱期間與價格等必要資訊；訊息附兩張審查員截圖
  - 跟使用者確認後下載並查看兩張截圖：確認審查員是從『截圖』這個 Pro 專屬功能點進去，跳出陽春的 Alert『升級 Pro』提示，按下去直接跳到 Apple 系統 Sandbox 購買確認框，中間完全沒有經過任何顯示方案標題／期間／價格／法律連結的畫面
  - 讀 `src/hooks/useProGate.ts` 源碼確認根因：`requirePro()` 的 Alert「升級 Pro」按鈕直接呼叫 `purchasePro()`，繞過 `SettingsModal.tsx` 裡本來就有、且符合 3.1.2(c) 規定的方案資訊顯示區塊（該區塊有正確顯示標題／期間／價格／隱私權政策/服務條款連結，是 2026-08-10 工作階段 019 就修過的）
  - 使用者確認要修這個問題後，依 TDD 流程執行：先改 `src/__tests__/hooks/useProGate.test.ts` 反映新預期行為（Red：`npx jest` 顯示 1 個失敗），再實作修正（Green：3 tests 全過）——`src/stores/settingsStore.ts` 新增 `pendingSettingsOpen`／`triggerSettingsOpen`／`clearPendingSettingsOpen`（沿用既有 pendingCameraOpen 等 trigger-flag 模式）；`useProGate.ts` 的「升級 Pro」按鈕改成 `triggerSettingsOpen()` + `router.replace('/')` 導向設定頁，不再直接購買；`app/index.tsx` 新增 useEffect 消費該旗標開啟設定 Modal
  - 使用者進一步確認後，一併修復 `SettingsModal.tsx` 裡第二條類似的繞過路徑：`fetchPackages()` 回傳空陣列（方案資料抓不到）時的 fallback 按鈕，原本也是直接呼叫 `purchasePro()`；嘗試寫 React Native Testing Library 元件測試驗證時，連續 3 次踩到同一個 `react-native-reanimated`／Worklets 原生模組在 Jest 環境初始化失敗的既有測試環境限制（跟本次改動無關），依專案規則「同一種失敗重試超過 2 次要換方法」放棄該方向，改以程式碼直接檢視＋既有全套測試＋typecheck 驗證；把 fallback 按鈕改成「暫時無法載入方案資訊，請稍後再試」文字＋「重新整理」按鈕（呼叫抽出的 `loadPackages()` 重新 fetch，不觸發購買），移除 `handlePurchase()` 與 `purchasePro` import
  - 更新 `feature_list.json`（ios-101-001 狀態改回 `in_progress`，新增 6 筆 evidence 記錄本輪排查與修正過程，notes 補充最新進度）與 `claude-progress.md`「目前已驗證狀態」
- 執行過的驗證：`npx jest src/__tests__/hooks/useProGate.test.ts`（Red→Green，3 tests 全過）；`npx jest`（全套 20 suites、121 tests 全過，無回歸）；`npx tsc --noEmit -p .`（本次改動的 4 個檔案無新增錯誤，既有 FlashList/Mood/MealGrade 型別錯誤與本次改動無關）
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增 6 筆）
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：程式碼修正已完成但**尚未重新 build + 送審**，需要使用者確認才能執行 `eas build --platform ios` + `eas submit`（會用掉 EAS 建置額度且是正式送審 Apple）；重新送審後 Apple 訊息裡明確要求「附上畫面錄影確認」修正生效，需要準備錄影素材；`SettingsModal.tsx` 目前沒有專屬的自動化元件測試（被既有測試環境限制擋住），未來若要補測試，需要先解決 `react-native-reanimated`/Worklets 在 Jest 環境的初始化問題（可能需要調整 jest 設定或升級相關套件版本）
- 下一步最佳動作：跟使用者確認是否要現在執行 `eas build --platform ios` + `eas submit`；建立新的 App Store Connect 提交後，在 3.1.2(c) 那則訊息回覆 Apple，說明已修正兩條繞過路徑並附上畫面錄影；審查通過後實機驗證四件事並回填 evidence，把 ios-101-001／photo-naming-001 改為 passing

### 工作階段 027

- 日期：2026-08-29
- 本輪目標：使用者提供 App Store Connect 送審頁面連結，請 Claude 查看 iOS 1.0.1 被拒絕的原因；接著使用者問「1.0.1 被拒會不會連累 1.0 下架」「1.0 都過了為什麼 1.0.1 會被判 SPAM」；最後要求草擬並代為回覆 App 審查申訴
- 已完成：
  - 用 claude-in-chrome 登入 App Store Connect 讀取「發佈」頁面，確認 iOS App 1.0.1（Build 7）狀態「已拒絕」，拒絕理由 **4.3.0 Design: Spam**；點進提交詳情頁（提交 ID 6f1123ae-4e98-44fe-ac85-2618b5223204）讀取 Apple 完整訊息：Guideline 4.3(a)，判定與已提交的其他 App（含使用者自己或其他開發者）共享類似 binary/metadata/概念，僅有微小差異；同一份提交草稿裡 Pro 月費／Pro 年費／SPARK PLATE Pro 訂閱群組三項狀態仍是「準備審查」，未被拒絕，只有 App 版本本身被拒
  - 回覆使用者兩個問題：(1) 1.0.1 被拒不會影響已發佈的 1.0，App Store Connect 的「已發佈版本」與「審查中版本」是分開的，1.0 持續正常供應；(2) 為何 1.0 過了但 1.0.1 被判 spam——說明 4.3(a) 比對範圍包含「你或其他開發者」已上架的 App，從 progress log 得知使用者帳號下還有 SPARKSHAPE 等 SPARK 系列 App、結構/流程相似，加上審查本身有人工判定的不一致性與相似 App 池隨時間變化等因素，都是可能原因
  - 依使用者要求草擬英文回覆文字（說明 1.0.1 是 1.0 的維護更新、非新概念或相似/重複 App，列出這次唯三改動：修復升級 Pro 購買錯誤即訂閱重新送審、啟動畫面優化、拍照檔名排序，並請審查員在 4.3(a) 下重新評估、如有具體相似對象請告知），先用 AskUserQuestion 取得使用者明確確認後，才在 App Store Connect 提交項目的「訊息」欄位點「回覆 App 審查」送出
  - 確認回覆送出成功：訊息串從「訊息 (1)」變成「訊息 (2)」，新增一則署名「又僖」、時間「今天下午4:30」的回覆，內容完整比對無誤；「重新提交至 App 審查」按鈕仍反灰（4.3(a) 屬內容判定問題，需等 Apple 人工複核回覆，非需要重新上傳 build 才會解鎖）
  - 更新 feature_list.json（ios-101-001 新增兩筆 evidence：拒絕原因、回覆送出記錄；notes 補充本輪處理經過；last_updated 改為 2026-08-29）與 claude-progress.md「目前已驗證狀態」反映最新現況
- 執行過的驗證：App Store Connect 頁面文字讀取（get_page_text）確認拒絕理由文字與回覆送出後訊息串內容；無程式碼變更，不涉及 npx jest / init.sh
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增兩筆）
- 提交記錄：（見本輪 commit，僅 feature_list.json 與 claude-progress.md 的文件更新）
- 已知風險或未解決問題：Apple 對此次申訴回覆的時間未知（不是固定 48 小時 SLA），若 Apple 仍判定 spam 或要求更多資訊，需再進一步溝通或考慮調整 App 內容/差異化說明；ios-101-001／photo-naming-001 維持 blocked，等 Apple 回應後才能繼續走到實機驗證步驟
- 下一步最佳動作：定期回 App Store Connect 提交詳情頁（或等 Apple email 通知）確認是否有新回覆；若 Apple 要求重新提交，「重新提交至 App 審查」按鈕會解鎖，屆時直接點擊即可（不需要重新 build）；若 Apple 維持拒絕或提出具體相似 App，需要跟使用者討論下一步（例如提供更多差異化說明，或評估是否需要調整 App 內容）

### 工作階段 026

- 日期：2026-08-28
- 本輪目標：接續工作階段 025，使用者確認後執行完整 iOS 1.0.1 送審流程（RevenueCat 訂閱重新送審＋啟動畫面優化＋拍照檔名排序一起包進去）
- 已完成：
  - `eas build --platform ios --profile production`（app.json version 仍是 1.0.0，只有 buildNumber 自動遞增到 6）→ `eas submit --platform ios --profile production --latest` 上傳成功，但 App Store Connect 處理 Build 6 時失敗：錯誤 90062『CFBundleShortVersionString [1.0.0] must contain a higher version than that of the previously approved version [1.0.0]』、90186『Invalid Pre-Release Train』——踩到一個坑：eas.json 的 `autoIncrement` 只會遞增內部 build number，不會自動遞增 app.json 的 `version`（app 版本號），需要手動改
  - 修正：`app.json` version 改成 `1.0.1`，`npx expo prebuild --platform android` 同步（`android/app/build.gradle` versionName 確認變成 1.0.1）
  - 重新 `eas build --platform ios --profile production`（版本 1.0.1）→ Build 成功 → `eas submit --platform ios --profile production --latest` → App Version 1.0.1 / Build number 7 上傳成功，等 Apple 處理完成（TestFlight 頁面確認狀態『準備提交』，非失敗）
  - App Store Connect 建立「iOS App 版本 1.0.1」→ 把 Build 7 掛上「建置版本」並存檔
  - 點「新增以供審查」時卡住：頁面顯示「本頁面有一或多個錯誤：英文（美國）／繁體中文的『此版本的新增功能』欄位為必填」——補上中英文的 What's New 文案（涵蓋啟動畫面優化、拍照檔名排序、穩定性）
  - 再次踩坑：把 App 版本、兩個訂閱項目都加進同一份「提交項目草稿」後，「提交以供審查」仍反灰，警告改成「自動續訂型訂閱項目須與其訂閱群組一同提交」——原來訂閱「群組」本身（SPARK PLATE Pro）也要另外去群組頁面點一次「新增以供審查」加進同一份草稿，光加兩個訂閱項目本身不夠
  - 把 App 版本、Pro 月費、Pro 年費、SPARK PLATE Pro 訂閱群組（共 4 個項目）都加進同一份草稿後，警告消失，「提交以供審查」按鈕轉為可點擊，點下去後頁面顯示「已提交 4 個項目」，訂閱群組與兩個訂閱狀態變成「等待審核」，App Store Connect 提示審查時間最長可能需要 48 小時，審完會寄 email 通知
- 執行過的驗證：實際跑 `eas build`/`eas submit` 兩輪（含一次失敗一次成功）；App Store Connect 頁面文字/截圖確認 Build 7 處理完成、What's New 欄位補齊、4 個項目成功送審且狀態為「等待審核」
- 已擷取證據：見 feature_list.json ios-101-001 evidence（本輪新增）
- 提交記錄：（見本輪 commit，僅 app.json version 與 android/ 同步的變更）
- 已知風險或未解決問題：等待 Apple 審查結果（最長 48 小時），審查通過後才能實機驗證三件事：(a) 開啟 App 不再看到 icon 啟動畫面、(b) 點「升級 Pro」能正常顯示方案並購買、(c) 開啟「拍照自動下載」連拍兩張，相簿依檔名排序確認依時間排列；若這輪被拒，需重新讀取拒絕原因處理
- 下一步最佳動作：等 Apple 審查結果（Email 通知或 App Store Connect 查看）；審查通過後做上述三項實機驗證，驗證完成後把 ios-101-001 與 photo-naming-001 都改為 passing

### 工作階段 025

- 日期：2026-08-28
- 本輪目標：使用者反映 iOS 已上架但點「升級 Pro」跳出「升級失敗：There is an issue with your configuration... None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect」，請 Claude 找出原因並修正；過程中使用者追加要求把「拍照檔名排序」「啟動畫面拿掉 icon」一起包進同一輪 iOS 1.0.1 送審
- 已完成：
  - 用 systematic-debugging 方法排查：登入 App Store Connect 確認「SPARK PLATE Pro」訂閱群組下 Pro 月費（`com.sparkplate.app.pro.monthly`）、Pro 年費（`com.sparkplate.app.pro.yearly`）狀態都是「被開發者拒絕」，不是已核准供應中——這正是 RevenueCat 錯誤訊息的根因：Apple 那邊這兩個商品根本不是可販售狀態，RevenueCat 抓不到任何商品資料，Offering 是空的
  - 推斷成因：2026-08-10（工作階段 019）曾「先在 App Store Connect 把當時等待審查中的提交項目撤回」，訂閱當時是跟著那次 App 提交一起送審的，撤回連帶讓訂閱變成「被開發者拒絕」；之後 08-13/08-19 幾輪都只重新送審了 App 本體，沒人再把訂閱重新送審，App 核准上架後訂閱卻一直沒真的生效
  - 在 Pro 月費／Pro 年費頁面各點「新增以供審查」，兩者加入同一份「提交項目草稿」，狀態變成「準備審查」；但發現 Apple 規定「第一個自動續訂型訂閱項目必須跟新的 App 版本一起提交」，無法單獨送審，「提交以供審查」按鈕反灰
  - 跟使用者確認要包進同一輪的還有哪些已改好但未上 iOS build 的東西：核對 git log 確認「拿掉首頁互連連結」（f76ebdc，07-23）、「首頁改粉色主視覺」（65ac3e3，08-08）都已經在 Build 5（08-10）之前完成，早已上架生效，不需要重做；唯一 Build 5 之後、還沒進 iOS build 的程式碼改動是這次工作階段的「拍照檔名排序」（見工作階段 024）
  - 使用者進一步要求「開 App 不要看到 icon 的啟動畫面，直接進入開始使用的畫面」——確認這是原生 launch screen（app.json 的 `splash` 設定：`splash-icon.png` 圖示＋白底），不是 `app/index.tsx` 那個「開始使用」封面頁；iOS/Android 系統層級都要求短暫顯示原生啟動畫面、無法完全跳過，改用「背景色跟首頁一致＋不放 icon 圖案」讓視覺上感覺像直接進入首頁
  - 新增 `assets/images/splash-blank.png`（Python PIL 產生的 1024×1024 全透明 PNG）；`app.json` 的 `splash.image` 改指向它、`splash.backgroundColor` 從 `#ffffff` 改成 `#EAAFB3`（跟 `app/index.tsx` 首頁背景色一致）
  - `npx expo prebuild --platform android`（非 clean）同步本機 android/ 原生專案，確認 `android/app/src/main/res/values/colors.xml` 的 `splashscreen_background` 變成 `#EAAFB3`；用 build-apk skill 本機建置驗證設定改動後仍能正常建置成功
  - 把這次工作階段涉及的三件事（RevenueCat 訂閱重新送審、啟動畫面優化、隨附拍照檔名排序）合併記錄成 `ios-101-001`（因為專案規則同時間只能有一個 in_progress），`photo-naming-001` 改記為 `blocked`（非真的卡住，是併入 ios-101-001 一起追蹤與驗證，附上 `[[ios-101-001]]` 連結）
- 執行過的驗證：`npx jest`（20 suites、122 tests 全過）；App Store Connect 操作（訂閱加入審查草稿）與 App Store Connect 頁面文字讀取確認狀態變化；`npx expo prebuild --platform android` + 本機 APK 建置成功（BUILD SUCCESSFUL）
- 已擷取證據：見 feature_list.json ios-101-001 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：訂閱審查草稿目前卡在「需要新的 App 版本才能一起送審」，尚未實際跑 `eas build --platform ios` + `eas submit` + 在 App Store Connect 建立 1.0.1 版本並送審——這步驟需要使用者確認才會執行（會用掉 EAS 建置額度且是正式送審 Apple，本輪工作階段結束時尚未取得這一步的明確執行許可）；啟動畫面改動只在本機 Android APK 驗證過設定值正確，尚未實機肉眼確認視覺效果，也還沒在 iOS 上驗證
- 下一步最佳動作：跟使用者確認後執行 `eas build --platform ios --profile production` → `eas submit` → App Store Connect 建立 1.0.1 版本、掛上 build、把兩個訂閱項目加入同一份提交、送出審查；審查通過後實機驗證三件事（啟動畫面、訂閱購買、拍照檔名排序），驗證完成後回填 ios-101-001 與 photo-naming-001 的 evidence 並改為 passing

### 工作階段 024

- 日期：2026-08-28
- 本輪目標：使用者反映「每次拍照的檔案名稱可以以日期來排列嗎？目前的檔案名稱沒有什麼規律」，請 Claude 修正
- 已完成：
  - 排查發現根因：開啟「拍照自動下載」時，`src/hooks/usePhoto.ts`（`takePicture`/`saveToDevice`）與 `src/components/CameraLaunchModal.tsx`（`handleCapture`）都直接對相機/ImagePicker 給的暫存檔 uri 呼叫 `MediaLibrary.saveToLibraryAsync(uri)`，該暫存檔名是亂數字串，會被原樣帶進系統相簿，導致依檔名排序時毫無規律
  - 新增 `src/services/mediaLibraryService.ts`：`generateDatedFilename()` 產生 `SPARKPLATE_YYYYMMDD_HHMMSSmmm.jpg` 格式（含毫秒避免同秒連拍撞名，字典序等同時間序）；`saveDatedPhotoToLibrary()` 先用 `FileSystem.copyAsync` 複製成日期檔名再呼叫 `MediaLibrary.saveToLibraryAsync`
  - `usePhoto.ts`、`CameraLaunchModal.tsx` 的三處存進相簿呼叫都改用 `saveDatedPhotoToLibrary`；`CameraLaunchModal.tsx` 移除因此變成未用的 `MediaLibrary` import
  - 依 TDD 先寫 `src/__tests__/services/mediaLibraryService.test.ts`（4 tests：檔名格式、零填、字典序等於時間序、`saveDatedPhotoToLibrary` 會先 copyAsync 到日期檔名再 saveToLibraryAsync），確認先失敗（模組不存在）再實作到全過；`__mocks__/expo-file-system.ts` 補上 `cacheDirectory` 供測試使用
  - 範圍刻意排除 `ExportModal.tsx` 的健康報表匯出圖片——使用者反映的是「拍照」，匯出報表是另一條路徑，不在本次要求內
- 執行過的驗證：`npx jest src/__tests__/services/mediaLibraryService.test.ts`（4 tests 全過）；`./init.sh`（20 suites、122 tests 全過）；`npx tsc --noEmit -p .`（既有的 FlashList/Mood/MealGrade 型別錯誤與本次改動的三個檔案無關，無新增錯誤）
- 已擷取證據：見 feature_list.json photo-naming-001 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：verification 第 3 步（實機/模擬器實測——連續拍兩張照片後在系統相簿以檔名排序，確認確實依時間排列）需要實體裝置或可存取相簿的模擬器操作，本輪未執行，故 photo-naming-001 維持 `in_progress`，未標記 passing
- 下一步最佳動作：使用者下次有 iPhone 在手邊時，開「拍照自動下載」連續拍兩張，去系統相簿/Files App 用檔名排序抽驗一次，確認後把 photo-naming-001 改成 passing

### 工作階段 023

- 日期：2026-08-27
- 本輪目標：使用者反映 App「已判定可以上架，卻被刪除沒有上架」，請 Claude 檢查原因並修正上架
- 已完成：
  - 前往 App Store Connect「發佈」頁面（App ID 6793041053），確認 iOS App 版本 1.0 狀態顯示綠色勾勾「已可發佈」——代表 2026-08-19 那輪重新送審其實已經被 Apple 核准，不是再次被拒
  - 但同一頁面有紅字警示：「此 App 已從 App Store 下架停售。請前往『定價與供應狀況』，將 App 重新加入 App Store。」
  - 前往「定價與供應狀況」頁面，發現「App 供應狀況」區塊顯示的是「設定供應狀況」按鈕（尚未設定過任何國家/地區），而不是已選定的地區清單——判定這就是根本原因：App 核准後從沒人執行過「選擇供應地區」這一步（新 App 第一次上架特有的陷阱，核准 ≠ 自動選好供應地區），導致 App 沒有任何地區可下載，App Store Connect 因此顯示為「已下架停售」
  - 點「設定供應狀況」→ 選擇對話框中預設已勾選的「所有國家或地區（175 個）」（與其他 SPARK 系列 App 一致，全球上架）→ 確認彈窗「App 發佈後即在所有國家或地區供應？」→ 點「確認」
  - 供應狀況頁面確認 175 個國家/地區狀態皆為「從『處理中』到『供應中』」，頁面註明變更將於 24 小時內在 App Store 生效
  - 回到「發佈」頁面重新整理確認：原本的「已從 App Store 下架停售」警示已消失；順帶確認「App Store 版本發佈」設定為「自動發佈此版本」，代表核准後會自動上架，不需要再手動點發佈
  - 額外發現一個新提醒（不阻擋本次上架）：「進行受監管醫療器材聲明」，Apple 要求 2027 年初前在「App 資訊」頁面聲明此 App 是否為受監管醫療器材，僅影響歐盟/歐洲經濟區/英國/美國的上架，目前不影響全球其他地區上架，先記錄待之後處理
- 執行過的驗證：實際在 App Store Connect 操作「定價與供應狀況」→「設定供應狀況」流程並確認存檔生效；重新整理「發佈」頁面確認下架警示消失、供應狀況區塊已顯示 175 個國家或地區、自動發佈設定維持不變
- 已擷取證據：見 feature_list.json appstore-001 evidence（本輪新增）
- 提交記錄：無程式碼變更，本輪純 App Store Connect 後台操作
- 已知風險或未解決問題：24 小時內供應狀況才會全面生效，屆時需使用者自行確認 App Store 上是否已能搜尋/下載到；受監管醫療器材聲明尚未處理（不阻擋，2027 年初前處理即可）
- 下一步最佳動作：24 小時後請使用者確認 App Store 上架狀態；找時間處理受監管醫療器材聲明（前往「App 資訊」頁面）

### 工作階段 022

- 日期：2026-08-19
- 本輪目標：使用者把手機螢幕錄影放進 `assets/images/`，請 Claude 檢查能不能用來回覆 Apple 的 Guideline 2.1 Information Needed 要求，可以的話上傳並重新送審（同一天先在 SPARKSHAPE 做過一輪同樣流程，這次直接套用學到的做法）
- 已完成：
  - 用 ffmpeg 擷取 `ScreenRecording_08-19-2026 12-52-34_1.mp4`（52秒）關鍵影格檢視內容：從主畫面點圖示啟動 App → 顯示啟動畫面 → 設定頁 PRO 訂閱卡片 → 實際點「訂閱」（兩個方案皆顯示「處理中...」）→ 跳出 TestFlight 沙盒購買確認彈窗（方案/價格/帳號/「僅供測試使用，不會導致扣款」皆可見）→ 點取消（顯示「升級失敗 Purchase was cancelled」）→ 之後瀏覽照片牆、餐點詳情（編輯/刪除/相機按鈕）、健康紀錄表單（飲水量/睡眠/飲料/點心/宵夜）、標籤篩選；內容完整度優於同日 SPARKSHAPE 錄的版本，一次到位不需重錄
  - 原始檔案 89.6MB，超過瀏覽器上傳工具 10MB 限制，用 ffmpeg 壓縮（scale=750, crf 24, aac 96k）到 4.5MB，抽查畫面文字仍清楚可辨識
  - 先去 App Store Connect 確認目前這輪拒絕訊息內容（跟 SPARKSHAPE 略有不同，SPARKPLATE 這次沒有額外的『IAP 導覽方式』第 8 點，維持原本 7 點），撰寫英文備註文字（涵蓋裝置清單 iPhone 17/iOS 26、App 功能與目標受眾、設定/存取說明、IAP 可購買項目與導覽方式、外部服務清單 RevenueCat/AdMob、地區差異、受監管產業聲明）
  - App Store Connect：套用同日在 SPARKSHAPE 學到的正確順序——先點『更新審查內容』讓狀態從『已拒絕』轉成『準備審查』，再填備註／確認附件仍在／存檔／重新整理頁面用 JavaScript 讀取 textarea.value 確認真的有持久化，最後點『重新提交至 App 審查』，狀態變成『等待審查』
- 執行過的驗證：ffmpeg 擷取關鍵影格逐張檢視影片內容；用瀏覽器 JavaScript 直接讀取 textarea.value 確認備註文字（2,921 字）在存檔＋重新整理後正確持久化；App Store Connect 頁面確認提交項目狀態變成『等待審查』
- 已擷取證據：見 feature_list.json appstore-001 evidence（本輪新增）
- 提交記錄：無程式碼變更，本輪未產生 git commit（純 App Store Connect 後台操作＋本機影片壓縮）
- 已知風險或未解決問題：Apple 這輪審查結果尚未知
- 下一步最佳動作：等 Apple 審查結果；若再被拒，讀新的拒絕訊息內容再處理

### 工作階段 021

- 日期：2026-08-14
- 本輪目標：使用者請求檢查 App Store Connect 上這輪審查結果並修正重新送審
- 已完成：
  - App Store Connect（App ID 6793041053，Submission ID 6d6fc20c-efb5-4eab-9e7b-12e31e531b18）確認 Build 5 再次被拒，這輪只有一個原因：Guideline 2.1 Performance: App Completeness，訊息內容其實是「Information Needed - New App Submission」——Apple 要求在「App 審查資訊→備註」補充七項資訊（含一段實體裝置螢幕錄影），不是文案或程式碼問題（與 2026-08-13 那輪三個文案問題性質不同）
  - 確認目前「App 審查資訊」的「備註」欄位是空的（4,000 字上限、目前 0 字）、「登入資訊」的「需要登入」未勾選（App 本身無帳號系統，這點可以直接寫進備註回答第 4 點）
  - 跟使用者確認螢幕錄影怎麼處理，使用者表示今天手邊沒有 iPhone 裝置，決定先暫停，改天再繼續
- 執行過的驗證：讀取 App Store Connect 頁面內容確認拒絕訊息全文與備註欄位現況（皆為觀察，非程式碼變更）
- 已擷取證據：無新增（本輪未修改任何欄位）
- 提交記錄：無程式碼變更，本輪僅更新進度文件
- 已知風險或未解決問題：Apple 這次要求的螢幕錄影必須是實體裝置錄製（訊息明確寫「captured on a physical device」），模擬器錄影風險較高可能被視為不符要求；備註文字（裝置型號/App 說明/外部服務清單等）尚未撰寫
- 下一步最佳動作：使用者有 iPhone 可用時，(1) 錄一段螢幕錄影涵蓋開啟 App→新增餐點（相機或相簿）→設定頁→PRO 訂閱卡片畫面、(2) 告知目前 TestFlight 測試用的 iPhone 型號與 iOS 版本；拿到這兩項後 Claude 可直接寫好其餘備註文字、上傳錄影附件、回覆 App 審查或重新提交

### 工作階段 020

- 日期：2026-08-13
- 本輪目標：使用者請求檢查 App Store Connect 上 SPARK PLATE 這次被拒的原因並修正
- 已完成：
  - App Store Connect（App ID 6793041053）確認 Build 5 這輪被拒三個原因：Guideline 2.1(a) App Completeness、2.3.10 Accurate Metadata、3.1.2(c) Payments - Subscriptions
  - 逐一排查根因，三者皆為英文（美國）在地化欄位問題，繁體中文版皆正常，不涉及程式碼：
    - 2.1(a)：英文 App 名稱為『SPARK PLATE (ff40fb)』，含測試殘留字串
    - 2.3.10：英文描述開頭殘留提及 Google Play 的 AI 翻譯提示文字（跟同一天處理過的 SPARKSHAPE 一模一樣的模式）
    - 3.1.2(c)：英文描述結尾沒有服務條款（EULA）連結（繁中版有，英文版遺漏）
  - 嘗試把英文名稱改回純『SPARK PLATE』時，App Store Connect 回報「輸入的名稱已由其他 App 使用」——判斷這正是先前某次工作階段留下 (ff40fb) 亂碼後綴的原因（用來繞開名稱衝突），只是這個做法本身又被 Apple 審查判定為未完成佔位文字而拒絕；跟使用者確認後改用『SPARK PLATE: Meal Log』，儲存成功
  - 修正英文描述：移除殘留的 AI 提示文字前綴，只保留正式英文文案，並在結尾補上『Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/』
  - 三項修正皆已在 App Store Connect 存檔成功
  - 使用者額外要求把繁體中文 App 名稱改為「SPARK PLATE 心動餐盤」（16 字，在 30 字上限內），確認中英文名稱是各自獨立的在地化欄位、不會互相衝突後直接修改，存檔成功
- 執行過的驗證：逐一讀取修改後欄位內容確認正確（英文名稱不再含 (ff40fb)、描述不再含 Google Play 字樣、描述結尾含 EULA 連結、繁中名稱改為「SPARK PLATE 心動餐盤」）；App Store Connect 各欄位「儲存」按鈕皆顯示成功狀態
- 已擷取證據：見 feature_list.json appstore-001 evidence（本輪新增）
- 提交記錄：無程式碼變更，本輪未產生 git commit
- 已知風險或未解決問題：Apple 這輪審查結果尚未知；英文 App 名稱『SPARK PLATE』純字串已確認被其他 App 佔用，之後不可再嘗試改回純字串
- 下一步最佳動作：等 Apple 審查結果（通常會寄信到 kyoangel.tw@gmail.com 或在 App Store Connect 通知）；若再被拒，讀新的拒絕訊息內容再處理

補充（同一工作階段）：使用者確認修正內容後，已於 App Store Connect 點「重新提交至 App 審查」，iOS App 1.0 (Build 5) 狀態變成「等待審查」；另外使用者要求把繁體中文 App 名稱改為「SPARK PLATE 心動餐盤」（16 字），確認與英文名稱欄位互不衝突後直接修改並存檔成功。

### 工作階段 019

- 日期：2026-08-10
- 本輪目標：使用者請 Claude 檢查 SPARKPLATE/SPARKFIT/SPARKLOG 是否有跟 SPARKSHAPE 一樣的 App Store 審查缺口（訂閱付費畫面缺必要資訊），確認有之後主動修復並重新送審
- 已完成：
  - 確認本專案（當時仍在 App Store 審查佇列中，因為 8/8 曾因 Age Rating 廣告描述被拒後已修正重新送審）的 `src/services/purchases.ts`／`src/constants/monetization.ts` 跟 SPARKSHAPE 修復前的版本結構完全相同，`src/components/SettingsModal.tsx` 的 PRO 解鎖卡片也只有一顆泛用「升級 Pro」按鈕，沒有 Apple Guideline 3.1.2(c) 要求的訂閱標題/期間/價格/服務條款/隱私權政策連結
  - 使用者確認後，先在 App Store Connect 把當時等待審查中的提交項目撤回（避免舊 build 卡住）
  - 套用 SPARKSHAPE/SPARKWEAR 同一組修法：新增 `PRIVACY_POLICY_URL`/`TERMS_OF_USE_URL`、新增 `fetchPackages`/`purchasePackage`、`SettingsModal.tsx` 的 PRO 卡片改成逐一列出 RevenueCat 真實方案（標題含「SPARK PLATE」、期間、價格）＋可點擊的隱私權政策/服務條款連結
  - `eas build --platform ios --profile production` 成功（Build 5）→ `eas submit --platform ios --profile production --latest` 成功上傳
  - App Store Connect：等 Apple 處理完 Build 5 後換上新 build、確認無「受監管醫療器材聲明」阻擋項目、點「新增以供審查」重新送審
- 執行過的驗證：`pnpm test` 全過（含新增的 fetchPackages/purchasePackage 測試）；`npx tsc --noEmit -p .` 無新增錯誤（既有錯誤數量與改動前一致，經 git stash 比對確認）；`eas build`/`eas submit` 皆實際執行且成功；App Store Connect 確認重新送審後狀態為「正在等待審查」
- 已擷取證據：見 feature_list.json appstore-001 evidence
- 提交記錄：43c24e1（訂閱付費畫面修復）
- 已知風險或未解決問題：Apple 這輪審查結果尚未知；本項是 proactive 修復（這個 App 本身未曾因這個理由被拒），最終是否通過需等 Apple 實際審查
- 下一步最佳動作：等 Apple 審查結果（通常會寄信通知或在 App Store Connect 顯示）；若因同樣或不同理由再被拒，讀新的拒絕訊息內容再處理

### 工作階段 018

- 日期：2026-08-08
- 本輪目標：首頁（app/index.tsx）改版為粉色主視覺；建置並驗證本機 Android APK
- 已完成：
  - 首頁樣式改版：背景 `#EAAFB3`、標題白色、副標題淺灰、設定按鈕改為跟開始使用一致的按鈕造型（移除齒輪圖示），開始使用按鈕改白底粉字
  - 用 build-apk skill 第一次跑本機 Android APK 建置（此專案先前只做過 iOS/EAS，從未本機建過 Android）
  - 首次建置的 APK 實機安裝後開啟即閃退，用 adb logcat 抓到 `FATAL EXCEPTION`：`Unable to get provider com.google.android.gms.ads.MobileAdsInitProvider` → `IllegalStateException: Invalid application ID`
  - 用 git log 追根本原因：AdMob 外掛設定在 commit `55712ad` 才加入 `app.json`，但 `android/` 原生資料夾是更早的 commit `f06a7e6` 產生的，從未重新跑過 prebuild 讓外掛把 `com.google.android.gms.ads.APPLICATION_ID` meta-data 寫進 `AndroidManifest.xml`
  - 修復：`npx expo prebuild --platform android`（非 `--clean`，未清空整個資料夾）重新同步外掛設定；manifest 補上缺的 meta-data，連帶重新產生 icon/splash 圖檔（內容未變，僅重新編碼）
  - 過程中使用者手滑在手機上手動安裝到 Google Drive 資料夾裡另一個舊/壞掉的 APK，重現了同一個 crash，一度誤以為修復無效；用 `adb install -r` 明確指定修好的檔案重裝＋`dumpsys package` 看 `lastUpdateTime` 才排除干擾，確認修復本身有效
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤，既有錯誤與本次改動無關）；`npx jest SplashScreen`（5 tests 全過）；實機（Pixel 10，USB 連接）`adb install -r` 安裝修好的 APK → `adb shell am start` 啟動 → `adb logcat` 確認無 FATAL EXCEPTION → `dumpsys window` 確認 `mFocusedApp` 為 SPARKPLATE MainActivity 且持續在前景
- 已擷取證據：APK 檔案 `SPARK-Builds/SPARKPLATE/sparkplate-v1.0.0-20260808-1527.apk`；logcat 修復前後對照（見上）
- 提交記錄：599258c（首頁樣式）、3813de6（AdMob manifest 修復）
- 已知風險或未解決問題：Google Drive 建置資料夾裡還留著今天壞掉的那個 APK（`sparkplate-v1.0.0-20260808-1519.apk`），已建議使用者刪除以免下次裝錯，尚未確認使用者是否刪了
- 下一步最佳動作：無明確待辦；若之後要再本機建置 Android，記得 app.json 的 plugins 若有變動，需重跑（非 --clean）`expo prebuild --platform android` 同步

### 工作階段 017

- 日期：2026-08-01
- 本輪目標：RevenueCat 官方事故排除後重測，修好順便發現的真實 bug
- 已完成：
  - 實機重測「升級 Pro」確認購買流程成功（RevenueCat 事故已解決）
  - 發現並修正真實 bug：從鎖定功能（例如「開啟時直接用相機打開」）跳出的升級提示裡點「升級 Pro」沒反應——原因是 `useProGate.ts` 設計成 `triggerSettingsOpen()` + `router.push('/')` 導回首頁重開設定 Modal，但使用者觸發時通常已經身處設定 Modal 內，`showSettings` 狀態沒變化導致無可見效果
  - 改成「升級 Pro」按鈕直接呼叫 `purchasePro()` 觸發真實購買，成功後 `setProUnlocked(true)` 並顯示「升級成功」，失敗顯示「升級失敗」＋錯誤訊息
  - 清掉因此變成死碼的 `pendingSettingsOpen`／`triggerSettingsOpen`／`clearPendingSettingsOpen`（store 與 `app/index.tsx` 的 watcher useEffect）
  - 更新 `src/__tests__/hooks/useProGate.test.ts` 對應新行為
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤）；`npx jest`（19 suites、112 tests 全過）；實機互動測試確認修好
- 已知風險或未解決問題：無
- 下一步最佳動作：無（monetization-001 全部完成）

### 工作階段 016

- 日期：2026-07-27
- 本輪目標：實機建置驗證 AdMob／RevenueCat
- 已完成：`npx expo run:ios --device` 成功建置並安裝到實機，App 正常開啟
- 執行過的驗證：實機互動測試——點「升級 Pro」出現 `[RevenueCat] Error fetching offerings`，排查 Bundle ID／App Store Connect 商品狀態／RevenueCat 設定皆正確，判定是 RevenueCat 官方「Ongoing incident: Problems connecting to Apple services」已知事故造成（同一輪 SPARKWEAR 測試成功，其餘 3 個 App 也是同樣錯誤，非本專案設定問題）
- 已知風險或未解決問題：購買流程尚未驗證成功
- 下一步最佳動作：等 RevenueCat 網站上方事故提示消失後，直接開已裝好的 App 重測「升級 Pro」，不用重新 build

### 工作階段 015

- 日期：2026-07-27
- 本輪目標：設定 RevenueCat（照 SPARKWEAR 範本流程複製）
- 已完成：建立 RevenueCat App（Bundle ID `com.sparkplate.app`，用 5 個 App 共用的 In-App Purchase Key P8）→ 拿到 Public API Key `appl_KmgHXhiWOhZlQCreUfGAzjKSuZO`；建立 `pro` entitlement 並接上 `com.sparkplate.app.pro.monthly`／`.pro.yearly`；`default` offering 的 Monthly/Yearly package 接上對應商品；`src/constants/monetization.ts` 的 `REVENUECAT_API_KEY` 換成正式 Key
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤）；`npx jest`（19 suites、111 tests 全過）
- 已知風險或未解決問題：尚未實機測試真實購買流程（RevenueCat 商品狀態因官方已知 Apple 連線事故顯示「Could not check」，設定流程本身已確認正確）
- 下一步最佳動作：等 5 個 App 都做完後，找時間跑一次原生 build，實機測試購買/恢復購買流程

### 工作階段 014

- 日期：2026-07-23
- 本輪目標：使用者在 AdMob 後台建好橫幅廣告單元，把測試版位換成正式的
- 已完成：`src/constants/monetization.ts` 的 `BANNER_AD_UNIT_ID` 改成 `Platform.select`，iOS 用正式 ID `ca-app-pub-8914492142878610/4178522929`，Android 維持 `TestIds.BANNER`
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤）；`npx jest`（19 suites、111 tests 全過）
- 已知風險或未解決問題：需要重新原生 build 才會真正生效；AdMob 應用程式狀態目前是「需審核」
- 下一步最佳動作：找時間跑一次原生 build 讓新 ID 生效；之後設定 RevenueCat

### 工作階段 013

- 日期：2026-07-23
- 本輪目標：使用者申請好真實 AdMob 帳號，把 iOS App ID 換成正式的
- 已完成：`app.json` config plugin 的 `iosAppId` 換成 `ca-app-pub-8914492142878610~3994424163`；`androidAppId` 維持 Google 官方測試 ID（Android 一律視為 Pro，`AdBanner` 永遠不會渲染，不需要申請真的 Android 廣告版位）
- 執行過的驗證：`python3 -c "json.load(...)"` 確認 app.json 仍是合法 JSON
- 已知風險或未解決問題：這個改動屬於原生設定（會寫入 iOS Info.plist 的 GADApplicationIdentifier），純 JS 的 `eas update` OTA 推不動，需要重新 `expo prebuild`/整套 build 才會生效；廣告單元 ID（`BANNER_AD_UNIT_ID`）還沒換，目前仍是 Google 測試版位，待使用者在 AdMob 後台建立橫幅版位後提供
- 下一步最佳動作：收到廣告單元 ID 後更新 `src/constants/monetization.ts`；之後找時間跑一次原生 build 讓新 App ID 生效

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
