# 開發日誌 (Development Log)

此文件用於記錄每次開發的重點內容、功能異動與耗費時間，以便於追蹤專案進度與計算成本。

| 時期 | 開發項目 | 重點內容 | 狀態 | 耗時 (預估) |
| :--- | :--- | :--- | :--- | :--- |
| **初期建置** | **專案初始化 & 資料庫架構** | 1. 建立 Vite + React + TypeScript 專案架構<br>2. 設計 Supabase 資料庫 Schema (Teams, Players, Coaches, Daily Records)<br>3. 設定基礎 RLS (Row Level Security) 政策 (Migration 001-003)<br>4. 導入 Shadcn/UI 元件庫與 TailwindCSS | 完成 | 8.0 hr |
| **初期建置** | **核心功能 - 儀表板與登入** | 1. 實作登入/註冊流程 (Auth Pages)<br>2. 教練端儀表板 (Dashboard) 開發<br>3. 每日訓練記錄 (Daily Record) 資料串接<br>4. 修正 RLS 權限問題 (Migration 004-010) | 完成 | 10.0 hr |
| **近期優化** | **歷史紀錄檢視增強** | 1. 導入 `date-fns` 與 `DayPicker` 支援彈性日期區間<br>2. 增強圖表功能 (ACWR 線、訓練負荷長條圖)<br>3. UI 細節修正 (Dropdown 透明背景修復)<br>4. 球員短代碼功能 (Migration 012) | 完成 | 4.0 hr |
| **2026-01-13** | **疼痛回報功能 (Phase 6)** | 1. 建立 `PainReportForm` (含 Body Map 互動)<br>2. 建立 `PainRecordList` (傷病列表)<br>3. 整合至 `PlayerRecordPage` (Tabs 介面)<br>4. 新增 `pain_reports` table 與對應 Hooks | 完成 | 2.5 hr |
| **2026-01-13** | **系統修復與優化** | 1. 修復 `react-day-picker` 導致的白屏問題 (Type Import)<br>2. 解決前端 Port 衝突 (改為 3000)<br>3. 優化回報介面 (移除下拉選單，改用 Body Map)<br>4. 移除疼痛類型欄位 (簡化流程) | 完成 | 1.5 hr |

## 累計開發時間
**總計**: 26.0 小時
