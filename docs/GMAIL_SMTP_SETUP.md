# Gmail SMTP 設定教學

本文檔將引導您完成 Gmail SMTP 郵件發送功能的設定，讓您的運動管理平台能夠發送郵件通知。

---

## 📋 目錄

1. [前置準備](#前置準備)
2. [步驟 1：啟用 Gmail 兩步驟驗證](#步驟-1啟用-gmail-兩步驟驗證)
3. [步驟 2：生成應用程式密碼](#步驟-2生成應用程式密碼)
4. [步驟 3：設定 Supabase SMTP](#步驟-3設定-supabase-smtp)
5. [步驟 4：測試郵件發送](#步驟-4測試郵件發送)
6. [常見問題排解](#常見問題排解)

---

## 前置準備

### 您需要：
- ✅ 一個 Gmail 帳號
- ✅ Supabase 專案（本地或雲端）
- ✅ 管理員權限來修改 Supabase 配置

### 重要提醒：
⚠️ **請勿使用 Gmail 帳號密碼！** 必須使用「應用程式密碼」來確保安全性。

---

## 步驟 1：啟用 Gmail 兩步驟驗證

Gmail 應用程式密碼需要先啟用兩步驟驗證。

### 1.1 前往 Google 帳戶安全性設定

1. 開啟瀏覽器，前往：https://myaccount.google.com/security
2. 登入您要用來發送郵件的 Gmail 帳號

### 1.2 啟用兩步驟驗證

1. 在「登入 Google」區塊中，找到「**兩步驟驗證**」
2. 點擊「**兩步驟驗證**」
3. 點擊「**開始使用**」按鈕
4. 按照指示完成設定：
   - 輸入您的手機號碼
   - 接收並輸入驗證碼
   - 確認啟用

✅ 完成後，您應該會看到「兩步驟驗證：已開啟」

---

## 步驟 2：生成應用程式密碼

### 2.1 前往應用程式密碼頁面

1. 回到安全性設定頁面：https://myaccount.google.com/security
2. 在「登入 Google」區塊中，找到「**應用程式密碼**」
3. 點擊「**應用程式密碼**」（可能需要再次輸入密碼）

### 2.2 建立新的應用程式密碼

1. 在「**選取應用程式**」下拉選單中，選擇「**其他（自訂名稱）**」
2. 輸入名稱，例如：`運動管理平台 - Supabase SMTP`
3. 點擊「**產生**」按鈕

### 2.3 複製應用程式密碼

1. Google 會顯示一組 16 位數的密碼，格式類似：`xxxx xxxx xxxx xxxx`
2. **⚠️ 重要：立即複製這組密碼！** 離開此頁面後將無法再次查看
3. 建議儲存到安全的密碼管理器中

📝 **範例密碼格式：** `abcd efgh ijkl mnop`（實際使用時請移除空格）

---

## 步驟 3：設定 Supabase SMTP

### 3.1 本地開發環境設定

如果您使用本地 Supabase（`supabase start`），請編輯配置檔案：

#### 編輯 `supabase/config.toml`

找到 `[auth.email.smtp]` 區塊（約在第 215 行），取消註解並修改：

```toml
# Use a production-ready SMTP server
[auth.email.smtp]
enabled = true
host = "smtp.gmail.com"
port = 587
user = "your-email@gmail.com"  # 替換為您的 Gmail 地址
pass = "env(GMAIL_APP_PASSWORD)"  # 使用環境變數
admin_email = "your-email@gmail.com"  # 替換為您的 Gmail 地址
sender_name = "運動管理平台"
```

#### 設定環境變數

在專案根目錄創建或編輯 `.env` 檔案：

```env
# Gmail SMTP 設定
GMAIL_APP_PASSWORD=abcdefghijklmnop  # 替換為您的應用程式密碼（移除空格）
```

⚠️ **重要：** 請確保 `.env` 已加入 `.gitignore`，避免密碼洩漏！

#### 重啟 Supabase

```bash
supabase stop
supabase start
```

### 3.2 雲端 Supabase 設定

如果您使用 Supabase 雲端版本：

1. 前往 Supabase Dashboard：https://app.supabase.com
2. 選擇您的專案
3. 點擊左側選單的「**Authentication**」
4. 點擊「**Email Templates**」標籤
5. 點擊「**SMTP Settings**」

#### 填寫 SMTP 設定：

| 欄位 | 值 |
|------|-----|
| **Enable Custom SMTP** | ✅ 勾選 |
| **Host** | `smtp.gmail.com` |
| **Port** | `587` |
| **Username** | `your-email@gmail.com` |
| **Password** | `您的應用程式密碼` |
| **Sender Email** | `your-email@gmail.com` |
| **Sender Name** | `運動管理平台` |

6. 點擊「**Save**」儲存設定

---

## 步驟 4：測試郵件發送

### 4.1 測試註冊確認信

1. 啟動您的應用程式
2. 嘗試註冊一個新帳號
3. 檢查信箱是否收到確認信

### 4.2 使用 Supabase CLI 測試（本地環境）

如果您想直接測試 SMTP 連線：

```bash
# 進入 Supabase 專案目錄
cd d:\程式開發\運動管理平台

# 檢查 SMTP 設定
supabase status
```

### 4.3 檢查郵件日誌

#### 本地環境：

1. 開啟 Supabase Studio：http://localhost:54323
2. 前往「**Logs**」→「**Auth Logs**」
3. 查看郵件發送記錄

#### 雲端環境：

1. 前往 Supabase Dashboard
2. 點擊「**Logs**」→「**Auth Logs**」
3. 篩選郵件相關事件

---

## 常見問題排解

### ❌ 問題 1：收不到郵件

**可能原因：**
- 應用程式密碼輸入錯誤
- Gmail 帳號未啟用兩步驟驗證
- 郵件被歸類為垃圾郵件

**解決方法：**
1. 檢查垃圾郵件資料夾
2. 重新生成應用程式密碼
3. 確認 SMTP 設定正確
4. 檢查 Supabase 日誌中的錯誤訊息

### ❌ 問題 2：SMTP 連線失敗

**錯誤訊息範例：**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**解決方法：**
1. 確認使用的是「應用程式密碼」而非 Gmail 密碼
2. 移除應用程式密碼中的空格
3. 確認 Gmail 帳號已啟用兩步驟驗證
4. 檢查 `user` 欄位是否為完整的 email 地址

### ❌ 問題 3：郵件發送速率限制

**錯誤訊息範例：**
```
Error: 550 5.4.5 Daily sending quota exceeded
```

**Gmail 免費帳號限制：**
- 每天最多發送 **500 封郵件**
- 每封郵件最多 **500 位收件者**

**解決方法：**
1. 使用 Google Workspace 帳號（每天 2,000 封）
2. 考慮使用專業郵件服務（如 SendGrid、Mailgun）
3. 實作郵件佇列系統

### ❌ 問題 4：中文郵件亂碼

**解決方法：**

根據您之前的對話歷史，您已經處理過中文編碼問題。如果使用 Edge Function 發送郵件，請確保：

1. 郵件主旨使用 RFC 2047 編碼
2. 郵件內容明確設定 `Content-Type: text/html; charset=UTF-8`
3. 使用 `denomailer` 套件時正確設定編碼

### ❌ 問題 5：環境變數未載入

**解決方法：**

```bash
# 確認 .env 檔案位置正確
ls -la .env

# 重啟 Supabase 以載入新的環境變數
supabase stop
supabase start
```

---

## 🔒 安全性最佳實踐

### ✅ 應該做的事：

1. **使用應用程式密碼**，絕不使用 Gmail 帳號密碼
2. **使用環境變數**儲存敏感資訊
3. **將 `.env` 加入 `.gitignore`**
4. **定期更換應用程式密碼**
5. **監控郵件發送日誌**，偵測異常活動

### ❌ 不應該做的事：

1. ❌ 將密碼寫死在程式碼中
2. ❌ 將 `.env` 檔案提交到 Git
3. ❌ 在公開的文檔中分享應用程式密碼
4. ❌ 使用個人 Gmail 帳號處理大量郵件

---

## 📚 進階設定

### 使用 Gmail API（推薦用於生產環境）

如果您需要更高的發送限制和更好的控制，建議使用 Gmail API：

1. 前往 Google Cloud Console
2. 啟用 Gmail API
3. 建立 OAuth 2.0 憑證
4. 使用 Service Account 進行認證

### 郵件範本自訂

編輯 Supabase 的郵件範本：

```bash
# 本地環境
supabase/templates/
├── invite.html
├── confirmation.html
└── recovery.html
```

---

## 🎯 快速檢查清單

設定完成後，請確認：

- [ ] Gmail 兩步驟驗證已啟用
- [ ] 應用程式密碼已生成並複製
- [ ] `config.toml` 或 Supabase Dashboard 中的 SMTP 設定已完成
- [ ] 環境變數已正確設定（本地環境）
- [ ] `.env` 已加入 `.gitignore`
- [ ] Supabase 已重啟（本地環境）
- [ ] 測試郵件發送成功
- [ ] 郵件未被歸類為垃圾郵件

---

## 📞 需要協助？

如果您在設定過程中遇到問題：

1. 檢查 Supabase 日誌中的詳細錯誤訊息
2. 參考本文檔的「常見問題排解」章節
3. 查看 Supabase 官方文檔：https://supabase.com/docs/guides/auth/auth-smtp
4. 查看 Gmail SMTP 官方說明：https://support.google.com/mail/answer/7126229

---

**最後更新：** 2026-01-24  
**版本：** 1.0
