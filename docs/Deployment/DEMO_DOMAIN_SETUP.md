# 網域設定指引：demo.sportrepo.com

本文件說明如何將 SportRepo 的 DEMO 環境部署至 `demo.sportrepo.com`，並確保其與主站隔離。

## 1. 原理說明
- **目標**：讓使用者可以訪問 `demo.sportrepo.com` 使用 DEMO 帳號。
- **隔離機制**：利用瀏覽器 `localStorage` 的同源策略 (Same Origin Policy)。
  - `app.sportrepo.com` 的 Session 存在 `localStorage["supabase.auth.token"]`
  - `demo.sportrepo.com` 的 Session 也存在 `localStorage["supabase.auth.token"]`
  - **兩者互不看見，互不干擾。**

## 2. DNS 設定 (在您的網域託管商)
請新增一筆 DNS 記錄指向您的前端託管服務 (如 Vercel, Netlify, Cloudflare Pages)。

| Type | Name | Content / Target | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `demo` | `cname.vercel-dns.com` (若使用 Vercel) | Auto |

> ⚠️ 若使用其他託管商，請將 Target 改為該服務提供的網址。

## 3. 前端部署設定 (Vercel 範例)

### 3.1 新增專案網域
1. 進入 Vercel Dashboard -> 您的專案 -> **Settings** -> **Domains**。
2. 新增 `demo.sportrepo.com`。
3. 等待 Vercel 驗證 DNS (通常幾分鐘內完成)。

### 3.2 環境變數 (Environment Variables)
若您的程式碼中有使用 `VITE_SITE_URL` 或類似變數來處理轉址，請確保為 **Production** 環境設定正確的值，或利用 Vercel 的 System Environment Variables 自動抓取。

通常 Supabase 需要知道 Redirect URL，請見下一步。

## 4. Supabase Auth 設定

這是最關鍵的一步，確保登入後能跳轉回 `demo` 網域。

1. 進入 **Supabase Dashboard** -> **Authentication** -> **URL Configuration**。
2. 在 **Site URL** 保持您的主站網址 (例如 `https://sportrepo.com`)。
3. 在 **Redirect URLs** 區域，點擊 **Add URL**。
4. 新增：`https://demo.sportrepo.com/**`
   - **重要**：只要加入這一行，Supabase 就允許 Auth Callback 跳轉回 demo 網域。

## 5. 驗證步驟
1. 部署完成後，訪問 `https://demo.sportrepo.com`。
2. 使用教練帳號登入 (`coach@shohoku.com` / `demo123` - 需先確認資料庫已有此帳號，或使用註冊功能)。
3. 登入成功後，檢查網址列是否維持在 `demo.sportrepo.com`。
4. 開啟另一個分頁訪問 `https://app.sportrepo.com` (或主站)，確認主站需要重新登入 (或是另一個獨立的登入狀態)，證明兩者已隔離。
