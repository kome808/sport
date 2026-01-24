# Gmail SMTP 設定完成確認

## ✅ 設定完成項目

### 1. 本地配置
- ✅ `.env` 檔案已創建
- ✅ Gmail 應用程式密碼已設定
- ✅ `supabase/config.toml` 已配置
- ✅ Gmail 地址：sportrepotw@gmail.com
- ✅ 發件人名稱：SportRepo

### 2. Supabase Dashboard 設定
- ✅ SMTP Settings 已在 Supabase Dashboard 完成

---

## 🧪 測試郵件發送

### 測試方法 1：註冊新帳號

1. 確認前端伺服器正在運行
2. 前往註冊頁面：http://localhost:3000/register
3. 註冊一個新帳號
4. 檢查信箱是否收到確認信

### 測試方法 2：密碼重設

1. 前往登入頁面
2. 點擊「忘記密碼」
3. 輸入已註冊的信箱
4. 檢查是否收到密碼重設信

---

## 📧 預期的郵件內容

### 發件人資訊
- **發件人名稱**：SportRepo
- **發件人信箱**：sportrepotw@gmail.com

### 郵件類型
1. **註冊確認信**
   - 主旨：Confirm your signup
   - 內容：包含確認連結

2. **密碼重設信**
   - 主旨：Reset your password
   - 內容：包含重設密碼連結

3. **邀請信**（如有使用）
   - 主旨：You have been invited
   - 內容：包含邀請連結

---

## 🔍 檢查清單

- [x] Gmail 兩步驟驗證已啟用
- [x] Gmail 應用程式密碼已生成
- [x] `.env` 檔案已設定密碼
- [x] `config.toml` 已設定 Gmail 地址
- [x] Supabase Dashboard SMTP 已設定
- [ ] 測試郵件發送成功
- [ ] 郵件未被歸類為垃圾郵件
- [ ] 郵件中的連結可正常使用

---

## 📊 Gmail 發送限制提醒

- 每天最多：**500 封郵件**
- 每封郵件最多：**500 位收件者**
- 建議監控發送量，避免超過限制

---

## 🎯 下一步建議

1. **測試郵件發送功能**
2. **自訂郵件範本**（可選）
3. **設定郵件監控**（可選）
4. **備份應用程式密碼**（建議）

---

## 📝 備註

- 應用程式密碼已安全儲存在 `.env`
- `.env` 已加入 `.gitignore`，不會被提交
- 定期更換應用程式密碼以提高安全性

---

**設定完成日期**：2026-01-24  
**Gmail 帳號**：sportrepotw@gmail.com  
**發件人名稱**：SportRepo
