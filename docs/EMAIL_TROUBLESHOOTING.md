# 郵件發送問題診斷指南

## 🔍 問題：註冊後沒收到確認信

### 可能原因分析

#### 1. 前端未連接到 Supabase ⚠️
**最可能的原因**

您的 `.env` 檔案中缺少 Supabase 連線資訊：
```env
# 目前缺少這兩個設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**解決方法：**
1. 前往 Supabase Dashboard：https://app.supabase.com
2. 選擇您的專案
3. 點擊左側「Project Settings」→「API」
4. 複製以下資訊：
   - **Project URL**（例如：`https://xxxxx.supabase.co`）
   - **Anon/Public Key**（一長串字串）
5. 將這些資訊加入 `.env` 檔案

---

#### 2. Supabase Dashboard 未設定 SMTP
**檢查方法：**
1. 前往 Supabase Dashboard
2. Authentication → Email Templates → SMTP Settings
3. 確認是否已填入 Gmail SMTP 資訊

**應該設定的內容：**
```
Enable Custom SMTP: ✅
Host: smtp.gmail.com
Port: 587
Username: sportrepotw@gmail.com
Password: tjfk fgkz asdd doqk
Sender Email: sportrepotw@gmail.com
Sender Name: SportRepo
```

---

#### 3. 註冊功能未正確執行
**檢查方法：**
1. 打開瀏覽器開發者工具（F12）
2. 切換到「Console」標籤
3. 再次嘗試註冊
4. 查看是否有錯誤訊息

---

## 🛠️ 立即診斷步驟

### 步驟 1：檢查前端是否連接到 Supabase

請執行以下操作：

1. 打開瀏覽器
2. 前往 http://localhost:3000
3. 按 F12 打開開發者工具
4. 在 Console 中輸入：
```javascript
localStorage.getItem('supabase_url')
```

**如果返回 `null`**：
- 表示前端沒有 Supabase 連線資訊
- 需要設定 `.env` 檔案

**如果返回一個 URL**：
- 表示有連線資訊
- 繼續下一步診斷

---

### 步驟 2：取得 Supabase 連線資訊

請提供以下資訊（我會幫您設定）：

1. **Supabase Project URL**
   - 在哪裡找：Dashboard → Project Settings → API → Project URL
   - 格式：`https://xxxxx.supabase.co`

2. **Supabase Anon Key**
   - 在哪裡找：Dashboard → Project Settings → API → Project API keys → anon public
   - 格式：一長串字串（約 200+ 字元）

---

### 步驟 3：檢查 Supabase Dashboard SMTP 設定

1. 前往：https://app.supabase.com
2. 選擇您的專案
3. Authentication → Email Templates
4. 點擊「SMTP Settings」
5. 確認是否已設定 Gmail SMTP

**截圖或告訴我：**
- [ ] 是否看到「Custom SMTP」已啟用？
- [ ] Host 是否為 `smtp.gmail.com`？
- [ ] Username 是否為 `sportrepotw@gmail.com`？

---

### 步驟 4：檢查 Auth Logs

1. 在 Supabase Dashboard
2. 點擊左側「Logs」
3. 選擇「Auth Logs」
4. 查看是否有註冊相關的記錄

**請告訴我：**
- 是否有看到註冊請求？
- 是否有任何錯誤訊息？

---

## 📝 請回答以下問題

為了幫您快速解決問題，請回答：

### 問題 1：您使用的是哪種 Supabase？
- [ ] 雲端 Supabase（在 app.supabase.com 上）
- [ ] 本地 Supabase（使用 Docker）

### 問題 2：您是否已在 Supabase Dashboard 設定 SMTP？
- [ ] 是，已設定
- [ ] 否，還沒設定
- [ ] 不確定

### 問題 3：註冊時是否有看到任何錯誤訊息？
- [ ] 有，錯誤訊息是：___________
- [ ] 沒有，看起來註冊成功
- [ ] 不確定

### 問題 4：您是否有 Supabase Project URL 和 Anon Key？
- [ ] 有，可以提供
- [ ] 沒有，不知道在哪裡找
- [ ] 不確定是否需要

---

## 🎯 最快的解決方案

**如果您使用雲端 Supabase：**

請提供：
1. Supabase Project URL
2. Supabase Anon Key

我會立即幫您：
1. 更新 `.env` 檔案
2. 重啟前端伺服器
3. 再次測試郵件發送

---

## 📞 需要協助

請告訴我：
1. 您的 Supabase Project URL（如果有）
2. 是否已在 Dashboard 設定 SMTP
3. 註冊時是否有看到錯誤訊息

我會根據您的回答提供具體的解決方案！
