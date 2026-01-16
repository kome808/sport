# 開發日誌 (Development Log)

此文件用於記錄每次開發的重點內容、功能異動與耗費時間，以便於追蹤專案進度與計算成本。

| 時期 | 開發項目 | 重點內容 | 狀態 | 耗時 (預估) |
| :--- | :--- | :--- | :--- | :--- |
| **初期建置** | **專案初始化 & 資料庫架構** | 1. 建立 Vite + React + TypeScript 專案架構<br>2. 設計 Supabase 資料庫 Schema (Teams, Players, Coaches, Daily Records)<br>3. 設定基礎 RLS (Row Level Security) 政策 (Migration 001-003)<br>4. 導入 Shadcn/UI 元件庫與 TailwindCSS | 完成 | 8.0 hr |
| **初期建置** | **核心功能 - 儀表板與登入** | 1. 實作登入/註冊流程 (Auth Pages)<br>2. 教練端儀表板 (Dashboard) 開發<br>3. 每日訓練記錄 (Daily Record) 資料串接<br>4. 修正 RLS 權限問題 (Migration 004-010) | 完成 | 10.0 hr |
| **近期優化** | **歷史紀錄檢視增強** | 1. 導入 `date-fns` 與 `DayPicker` 支援彈性日期區間<br>2. 增強圖表功能 (ACWR 線、訓練負荷長條圖)<br>3. UI 細節修正 (Dropdown 透明背景修復)<br>4. 球員短代碼功能 (Migration 012) | 完成 | 4.0 hr |
| **2026-01-13** | **疼痛回報功能 (Phase 6)** | 1. 建立 `PainReportForm` (含 Body Map 互動)<br>2. 建立 `PainRecordList` (傷病列表)<br>3. 整合至 `PlayerRecordPage` (Tabs 介面)<br>4. 新增 `pain_reports` table 與對應 Hooks | 完成 | 2.5 hr |
| **2026-01-13** | **系統修復與優化** | 1. 修復 `react-day-picker` 導致的白屏問題 (Type Import)<br>2. 解決前端 Port 衝突 (改為 3000)<br>3. 優化回報介面 (移除下拉選單，改用 Body Map)<br>4. 移除疼痛類型欄位 (簡化流程) | 完成 | 1.5 hr |
| **2026-01-13** | **通知系統實作 (Phase 1.10)** | 1. 建立 `notifications` table 與高風險自動警示 Trigger (Mig 013)<br>2. 實作 `NotificationBell` 元件與 Header 整合<br>3. 開發 `useNotifications` Hook 支援已讀管理 | 完成 | 2.0 hr |
| **2026-01-13** | **球隊邀請機制 (Phase 1.11)** | 1. 建立邀請碼機制與與安全 RPCs (Mig 014, `login_player`, `join_team`)<br>2. 實作 `InvitationPage` 支援學生自助報到與認領<br>3. 修正球員登入安全性架構 (RLS Bypass) | 完成 | 3.5 hr |
| **2026-01-14** | **人體地圖自定義與 UI 修復** | 1. 實作客製化 SVG 人體地圖 (支援關節、肌肉獨立點擊)<br>2. 整合 `Shadcn/UI` Tooltip 顯示中文部位名稱<br>3. 修復全域 Popover/Dropdown 背景透明問題<br>4. 優化 `PainReportForm` 選擇邏輯 | 完成 | 2.5 hr |
| **2026-01-14** | **球員端與教練端功能同步 (已完成)** | 1. 實作球員登入大廳 (`/:teamSlug/login`) <br>2. 修復認領邏輯 (解決教練建立球員後消失的問題)<br>3. 實作個人資料編輯 (位置、身高、體重、密碼修改)<br>4. 教練端 URL 統一優先使用短代碼 (Short Code) | 完成 | 3.0 hr |
| **2026-01-15** | **人體地圖高保真重構** | 1. 成功提取並移植 `react-body-highlighter` 的 SVG 數據<br>2. 實作基於 Polygons 的高解析度身體地圖<br>3. 支援左右對稱部位自動識別與點擊<br>4. 自動化測試驗證瀏覽器互動 | 完成 | 2.0 hr |
| **2026-01-15** | **球員訓練負荷監測 (規劃)** | 1. 制定 5 大指標 (ACWR, PSI, RHR, Wellness, sRPE) 架構<br>2. 設計後端 PostgreSQL RPC 計算邏輯 (EWMA)<br>3. 規劃前端 FatigueDashboard 元件與 Layout 重構 | 規劃中 | - |


## 累計開發時間
**總計**: 36.0 小時
