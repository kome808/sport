# Gmail SMTP 快速設定指南

## 🚀 快速開始（5 分鐘設定）

### 第 1 步：取得 Gmail 應用程式密碼

1. 前往：https://myaccount.google.com/security
2. 啟用「兩步驟驗證」（如果尚未啟用）
3. 點擊「應用程式密碼」
4. 選擇「其他（自訂名稱）」→ 輸入「運動管理平台」
5. 複製生成的 16 位數密碼

### 第 2 步：設定環境變數

```bash
# 複製範本檔案
copy .env.example .env

# 編輯 .env 檔案，填入您的應用程式密碼
# GMAIL_APP_PASSWORD=您的16位數密碼（移除空格）
```

### 第 3 步：啟用 Supabase SMTP

編輯 `supabase/config.toml`，找到第 215 行附近，修改為：

```toml
# Use a production-ready SMTP server
[auth.email.smtp]
enabled = true
host = "smtp.gmail.com"
port = 587
user = "your-email@gmail.com"  # 替換為您的 Gmail
pass = "env(GMAIL_APP_PASSWORD)"
admin_email = "your-email@gmail.com"  # 替換為您的 Gmail
sender_name = "運動管理平台"
```

### 第 4 步：重啟服務

```bash
# 如果使用本地 Supabase
supabase stop
supabase start

# 如果只運行前端
# 重新啟動前端伺服器即可
```

### 第 5 步：測試

1. 註冊一個新帳號
2. 檢查信箱是否收到確認信
3. 檢查垃圾郵件資料夾

---

## 📝 完整設定說明

詳細的設定步驟、疑難排解和安全性建議，請參考：

👉 **[完整 Gmail SMTP 設定教學](./GMAIL_SMTP_SETUP.md)**

---

## ⚠️ 重要提醒

- ✅ 使用「應用程式密碼」，不是 Gmail 密碼
- ✅ 確保 `.env` 已加入 `.gitignore`
- ✅ 移除應用程式密碼中的空格
- ✅ Gmail 免費帳號每天限制 500 封郵件

---

## 🔍 常見錯誤

### 錯誤 1：Invalid login (535)
→ 檢查是否使用應用程式密碼，而非 Gmail 密碼

### 錯誤 2：收不到郵件
→ 檢查垃圾郵件資料夾

### 錯誤 3：環境變數未載入
→ 重啟 Supabase 服務

---

**需要協助？** 請參考 [完整教學文檔](./GMAIL_SMTP_SETUP.md)
