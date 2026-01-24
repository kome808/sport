# 快速安裝 Supabase CLI 指南

## 🎯 最簡單的方法：手動下載

由於 Winget 和其他套件管理器可能有問題，我們直接下載執行檔：

### 步驟 1：下載 Supabase CLI

請在瀏覽器中開啟以下連結：

**下載頁面：** https://github.com/supabase/cli/releases/latest

找到並下載：
- **檔案名稱：** `supabase_windows_amd64.zip`
- **大小：** 約 30-40 MB

### 步驟 2：解壓縮

1. 下載完成後，解壓縮 ZIP 檔案
2. 建議解壓縮到：`C:\supabase\`
3. 解壓縮後會得到 `supabase.exe`

### 步驟 3：測試執行

開啟 PowerShell 或 CMD，執行：

```bash
C:\supabase\supabase.exe --version
```

如果顯示版本號，表示成功！

### 步驟 4：（可選）加入 PATH

為了方便使用，可以將 `C:\supabase` 加入系統 PATH：

1. 按 `Win + R`，輸入 `sysdm.cpl`
2. 點擊「進階」標籤
3. 點擊「環境變數」
4. 在「系統變數」中找到「Path」
5. 點擊「編輯」
6. 點擊「新增」
7. 輸入：`C:\supabase`
8. 確定所有視窗

完成後，重新開啟 PowerShell，就可以直接使用 `supabase` 命令。

---

## 🚀 啟動 Supabase

下載並設定完成後，執行：

```bash
cd d:\程式開發\運動管理平台

# 如果已加入 PATH
supabase start

# 如果沒有加入 PATH
C:\supabase\supabase.exe start
```

**首次啟動會：**
- 下載 Docker 映像檔（約 1-2 GB）
- 需要 5-10 分鐘
- 請耐心等待

**啟動成功後會顯示：**
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 下一步

啟動成功後，請告訴我，我會幫您：

1. ✅ 更新 `.env` 檔案（加入 Supabase 連線資訊）
2. ✅ 重啟前端伺服器
3. ✅ 測試郵件發送

---

## ⚡ 快速連結

**Supabase CLI 下載：**
https://github.com/supabase/cli/releases/latest

**找不到下載連結？**
直接點擊這個（2024年1月最新版本）：
https://github.com/supabase/cli/releases

在 Assets 區塊找到 `supabase_windows_amd64.zip`

---

**請下載並解壓縮後，執行 `supabase start`，然後告訴我結果！** 😊
