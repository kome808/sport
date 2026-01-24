# 待辦事項 (To-Do List)

## 優先執行 (Priority)
- [x] **更新測試數據生成邏輯 (Update Test Data Generation)**
    - [x] 修改 `regenerate_demo_data` RPC 或相關 SQL/Edge Function。
    - [x] 模擬部分球員有 **傷病回報 (Pain Reports)**，包含 `pain_score`, `body_part`, `description`。
    - [x] 模擬部分記錄有 **訓練回饋 (Feedback)**。
    - [x] 確保 sRPE 數據包含 `training_minutes` (小時*60+分) 和 `training_intensity` (1-10)。
- [x] **驗證傷病紀錄顯示 (Verify Pain Dashboard)**
    - [x] 在 `PainRecordList` 驗證是否有資料顯示。
    - [x] 檢查儀表板的傷病統計功能。

## 已完成 (Completed)
- [x] **Gmail SMTP 郵件發送設定 (Gmail SMTP Setup)**
    - [x] 創建完整教學文檔 (`docs/GMAIL_SMTP_SETUP.md`)
    - [x] 創建快速設定指南 (`docs/GMAIL_SMTP_QUICKSTART.md`)
    - [x] 設定環境變數 (`.env`)
    - [x] 配置 Supabase SMTP (`supabase/config.toml`)
    - [x] 在 Supabase Dashboard 完成 SMTP 設定
    - [x] Gmail 帳號：sportrepotw@gmail.com
    - [x] 發件人名稱：SportRepo
- [x] **球員回報頁面 (Player Report Page) 優化**
    - [x] RHR, Wellness, sRPE 增加詳細說明文字。
    - [x] 訓練時間改為「小時 + 分鐘」輸入。
    - [x] 訓練強度改為下拉選單 (1-10)。
    - [x] 新增「其他回饋」欄位。
    - [x] 修正版面跑版問題。
- [x] **儀表板與紀錄表更新**
    - [x] `DailyRecord` 型別加入 `feedback`。
    - [x] `RecordTable` 簡化表頭 (中文)，新增回饋欄位與 Dialog。
    - [x] `FatigueDashboard` 新增「最新回饋內容」區塊。
