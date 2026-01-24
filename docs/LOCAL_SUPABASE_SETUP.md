# 本地 Supabase 設定指南

## 🎯 您已安裝 Docker！

太好了！現在我們可以設定本地 Supabase 開發環境。

---

## 📦 安裝 Supabase CLI

### 方法 1：使用 Winget（推薦，Windows 11）

```powershell
winget install Supabase.CLI
```

### 方法 2：手動下載

1. 前往：https://github.com/supabase/cli/releases/latest
2. 下載 `supabase_windows_amd64.zip`
3. 解壓縮到任意資料夾（例如：`C:\supabase`）
4. 將資料夾路徑加入系統 PATH

### 方法 3：使用 Chocolatey

```powershell
choco install supabase
```

---

## 🚀 啟動本地 Supabase

安裝完成後，執行以下命令：

```bash
cd d:\程式開發\運動管理平台
supabase start
```

**首次啟動會需要：**
- 下載 Docker 映像檔（約 1-2 GB）
- 需要 5-10 分鐘
- 請保持網路連線

**啟動成功後會顯示：**
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhb...
service_role key: eyJhb...
```

---

## 📝 設定前端連線

啟動成功後，我會幫您更新 `.env` 檔案：

```env
# Supabase 本地開發環境
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<從啟動訊息中複製 anon key>
```

---

## 🧪 測試郵件發送

本地 Supabase 使用 **Inbucket** 來捕獲郵件（不會真的發送）：

1. 前往：http://localhost:54324
2. 這是本地郵件測試介面
3. 註冊帳號後，郵件會出現在這裡

**如果要真的發送郵件：**
- 本地 Supabase 已經讀取 `config.toml` 中的 Gmail SMTP 設定
- 郵件會真的發送到 komepanfu@gmail.com

---

## 📋 完整設定步驟

### 步驟 1：安裝 Supabase CLI

選擇上面的任一方法安裝。

### 步驟 2：啟動 Supabase

```bash
cd d:\程式開發\運動管理平台
supabase start
```

### 步驟 3：複製連線資訊

從啟動訊息中複製 `anon key`

### 步驟 4：更新 .env

我會幫您更新，或您可以手動編輯：
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<您的 anon key>
```

### 步驟 5：重啟前端

```bash
# 停止目前的前端伺服器（Ctrl+C）
# 重新啟動
cd frontend
node node_modules/vite/bin/vite.js
```

### 步驟 6：測試註冊

1. 前往：http://localhost:3000/register
2. 註冊帳號：komepanfu@gmail.com
3. 檢查郵件：
   - **測試模式**：http://localhost:54324
   - **真實發送**：komepanfu@gmail.com 信箱

---

## ⚠️ 重要提醒

### Gmail SMTP 設定

您的 `config.toml` 已經設定好 Gmail SMTP：
```toml
[auth.email.smtp]
enabled = true
host = "smtp.gmail.com"
port = 587
user = "sportrepotw@gmail.com"
pass = "env(GMAIL_APP_PASSWORD)"
```

**本地 Supabase 會：**
1. 讀取 `.env` 中的 `GMAIL_APP_PASSWORD`
2. 使用 Gmail SMTP 真的發送郵件
3. 同時在 Inbucket (http://localhost:54324) 記錄郵件

---

## 🎯 現在請執行

請選擇一個方法安裝 Supabase CLI，然後告訴我：

1. **使用 Winget**（最簡單）：
   ```powershell
   winget install Supabase.CLI
   ```

2. **使用 Chocolatey**：
   ```powershell
   choco install supabase
   ```

3. **手動下載**：
   - 下載：https://github.com/supabase/cli/releases/latest
   - 解壓縮並加入 PATH

安裝完成後，執行：
```bash
supabase start
```

然後告訴我結果！😊
