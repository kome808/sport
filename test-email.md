# Gmail SMTP 郵件發送測試指南

## 測試方法 1：透過前端註冊頁面

### 步驟：
1. 開啟瀏覽器，前往：http://localhost:3000/register
2. 填寫註冊資訊：
   - **Email**: komepanfu@gmail.com
   - **Password**: Test123456（或任何符合要求的密碼）
   - **其他欄位**: 依照表單要求填寫
3. 點擊「註冊」按鈕
4. 檢查 komepanfu@gmail.com 信箱

### 預期結果：
- 收到來自 **SportRepo <sportrepotw@gmail.com>** 的確認信
- 主旨：Confirm your signup
- 內容包含確認連結

---

## 測試方法 2：透過密碼重設功能

### 步驟：
1. 前往：http://localhost:3000/login
2. 點擊「忘記密碼」或「重設密碼」
3. 輸入：komepanfu@gmail.com
4. 提交表單
5. 檢查信箱

### 預期結果：
- 收到密碼重設信
- 主旨：Reset your password
- 內容包含重設連結

---

## 測試方法 3：使用 Supabase Dashboard

### 步驟：
1. 前往 Supabase Dashboard：https://app.supabase.com
2. 選擇您的專案
3. 點擊左側「Authentication」
4. 點擊「Users」標籤
5. 點擊「Invite User」
6. 輸入：komepanfu@gmail.com
7. 點擊「Send Invite」

### 預期結果：
- 收到邀請信
- 主旨：You have been invited
- 發件人：SportRepo <sportrepotw@gmail.com>

---

## 測試方法 4：使用 SQL 測試函數

### 步驟：
1. 前往 Supabase Dashboard
2. 點擊「SQL Editor」
3. 執行以下 SQL：

```sql
-- 測試發送郵件（僅記錄請求）
SELECT public.test_smtp_email('komepanfu@gmail.com');
```

### 預期結果：
- 函數執行成功
- 返回測試資訊

---

## 檢查清單

測試完成後，請確認：

- [ ] 郵件已送達 komepanfu@gmail.com
- [ ] 發件人顯示為「SportRepo」
- [ ] 發件人信箱為 sportrepotw@gmail.com
- [ ] 郵件未被歸類為垃圾郵件
- [ ] 郵件中的連結可正常使用
- [ ] 中文內容顯示正常（如有）

---

## 疑難排解

### 如果收不到郵件：

1. **檢查垃圾郵件資料夾**
   - Gmail 可能將新發件人歸類為垃圾郵件

2. **檢查 Supabase Logs**
   - Dashboard → Logs → Auth Logs
   - 查看是否有錯誤訊息

3. **驗證 SMTP 設定**
   ```bash
   powershell -ExecutionPolicy Bypass -File check-smtp-setup.ps1
   ```

4. **檢查應用程式密碼**
   - 確認 `.env` 中的密碼正確
   - 確認沒有多餘的空格

5. **檢查 Gmail 帳號狀態**
   - 確認 sportrepotw@gmail.com 可正常登入
   - 確認兩步驟驗證已啟用
   - 確認應用程式密碼仍然有效

---

## 手動測試步驟（推薦）

由於瀏覽器自動化可能遇到問題，建議您手動執行以下步驟：

### 1. 開啟瀏覽器
- 在瀏覽器中輸入：http://localhost:3000

### 2. 前往註冊頁面
- 點擊「註冊」或直接前往：http://localhost:3000/register

### 3. 填寫註冊表單
- Email: komepanfu@gmail.com
- 密碼: Test123456
- 其他欄位依照要求填寫

### 4. 提交並檢查
- 點擊註冊按鈕
- 等待確認訊息
- 檢查 komepanfu@gmail.com 信箱

### 5. 回報結果
- 如果收到郵件：✅ 測試成功
- 如果沒收到：檢查垃圾郵件資料夾和 Supabase Logs

---

**測試時間**: 2026-01-24 14:35  
**測試信箱**: komepanfu@gmail.com  
**發件人**: SportRepo <sportrepotw@gmail.com>
