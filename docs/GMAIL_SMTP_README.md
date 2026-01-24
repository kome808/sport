# 📧 Gmail SMTP 設定總覽

本目錄包含完整的 Gmail SMTP 郵件發送功能設定指南。

---

## 📚 文檔索引

### 🚀 快速開始
- **[5 分鐘快速設定](./GMAIL_SMTP_QUICKSTART.md)** - 適合想快速完成設定的使用者

### 📖 完整教學
- **[完整 Gmail SMTP 設定教學](./GMAIL_SMTP_SETUP.md)** - 詳細的步驟說明、疑難排解和安全性建議

### 🔧 配置檔案
- **`.env.example`** - 環境變數範本（位於專案根目錄）
- **`supabase/config.toml`** - Supabase SMTP 配置（已預先設定 Gmail）
- **`supabase/migrations/999_test_smtp.sql`** - 測試郵件發送的 SQL 函數

---

## 🎯 設定流程圖

![Gmail SMTP 設定流程](../gmail_smtp_setup_flowchart.png)

### 設定步驟：

1. **啟用兩步驟驗證** ✅
   - 前往 Google 帳戶安全性設定
   - 啟用兩步驟驗證

2. **生成應用程式密碼** 🔑 ⚠️
   - 在安全性設定中選擇「應用程式密碼」
   - 複製 16 位數密碼

3. **設定環境變數** 📄 ⚠️
   - 複製 `.env.example` 為 `.env`
   - 填入應用程式密碼

4. **修改 Supabase Config** ⚙️ ⚠️
   - 編輯 `supabase/config.toml`
   - 替換 Gmail 地址

5. **測試郵件發送** ✉️ ✅
   - 重啟 Supabase
   - 測試註冊功能

---

## ⚡ 快速指令

### 設定環境變數
```bash
# Windows (PowerShell)
copy .env.example .env
notepad .env

# 填入以下內容：
# GMAIL_APP_PASSWORD=您的16位數密碼（移除空格）
```

### 修改 Supabase 配置
```bash
# 編輯 config.toml
notepad supabase\config.toml

# 找到 [auth.email.smtp] 區塊
# 替換 your-email@gmail.com 為您的 Gmail 地址
```

### 重啟 Supabase（本地環境）
```bash
supabase stop
supabase start
```

### 測試郵件發送
```sql
-- 在 Supabase SQL Editor 中執行
SELECT public.test_smtp_email('your-test-email@gmail.com');
```

---

## 🔍 檢查清單

設定前請確認：

- [ ] 您有一個 Gmail 帳號
- [ ] Gmail 帳號已啟用兩步驟驗證
- [ ] 已生成應用程式密碼並複製
- [ ] `.env` 檔案已創建並填入密碼
- [ ] `config.toml` 中的 Gmail 地址已替換
- [ ] `.env` 已加入 `.gitignore`（已預設加入）
- [ ] Supabase 服務已重啟（本地環境）

設定後請測試：

- [ ] 註冊新帳號能收到確認信
- [ ] 郵件未被歸類為垃圾郵件
- [ ] 郵件中的中文顯示正常
- [ ] Supabase Logs 中沒有錯誤訊息

---

## ⚠️ 重要提醒

### 安全性
- ✅ **使用應用程式密碼**，絕不使用 Gmail 帳號密碼
- ✅ **環境變數已加入 `.gitignore`**，不會被提交到 Git
- ✅ **定期更換應用程式密碼**，提高安全性

### 限制
- 📊 Gmail 免費帳號：**每天 500 封郵件**
- 📊 Google Workspace：**每天 2,000 封郵件**
- 📊 每封郵件最多：**500 位收件者**

### 常見錯誤
- ❌ **Invalid login (535)** → 檢查是否使用應用程式密碼
- ❌ **收不到郵件** → 檢查垃圾郵件資料夾
- ❌ **中文亂碼** → 確認郵件編碼設定為 UTF-8

---

## 📞 需要協助？

### 文檔資源
- [完整設定教學](./GMAIL_SMTP_SETUP.md) - 詳細步驟和疑難排解
- [快速設定指南](./GMAIL_SMTP_QUICKSTART.md) - 5 分鐘快速設定

### 外部資源
- [Supabase SMTP 文檔](https://supabase.com/docs/guides/auth/auth-smtp)
- [Gmail SMTP 設定](https://support.google.com/mail/answer/7126229)
- [Google 應用程式密碼](https://support.google.com/accounts/answer/185833)

### 檢查日誌
```bash
# 本地環境：查看 Supabase Studio
http://localhost:54323

# 雲端環境：查看 Supabase Dashboard
https://app.supabase.com → Logs → Auth Logs
```

---

## 🎓 進階主題

### 自訂郵件範本
- 編輯 `supabase/templates/` 目錄中的 HTML 範本
- 支援變數替換和條件渲染

### 使用 Gmail API
- 更高的發送限制
- 更好的錯誤處理
- 需要 OAuth 2.0 認證

### 郵件佇列系統
- 處理大量郵件發送
- 重試機制
- 發送狀態追蹤

---

**最後更新：** 2026-01-24  
**維護者：** 運動管理平台開發團隊
