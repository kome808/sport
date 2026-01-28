# 登入與權限問題排查紀錄 (2026-01-26)

## 1. 問題概述
今日主要解決了「球員登入 (Player Login)」與「展示模式 (Demo Mode)」的一系列關聯問題，包括匿名訪問權限 (RLS)、密碼雜湊驗證、以及登出後的頁面導向異常。

同時，針對 **Google OAuth 登入整合** 與 Supabase 的重導向設定，也整理了標準實作流程以供參考。

## 2. 詳細排查與解決方案 (Player/Demo)

### 2.1 匿名訪問權限 (RLS Blocked Anonymous Access)
**症狀：**
- 未登入使用者開啟球員登入頁 (`/shohoku-basketball/p/3ss/login`) 時，顯示「找不到球員資料」。
- 瀏覽器 Console 顯示 API 回傳空陣列或 403 錯誤。

**原因：**
- Supabase 的 RLS (Row Level Security) 預設阻擋了 `anon` (未登入) 角色讀取 `players` 與 `teams` 表格。
- 舊有的 Policy 僅允許 `authenticated` (已登入) 使用者讀取。

**解決方案：**
- 新增 Migration `20260126060000_enable_public_demo_access.sql`。
- 明確開放 `anon` 角色讀取 `is_demo = TRUE` 的球隊與其所屬球員資料。
```sql
CREATE POLICY "players_select_public_demo" ON sport.players
FOR SELECT TO anon
USING ( sport.fn_is_demo_team(team_id) );
```

---

### 2.2 密碼雜湊驗證失敗 (Password Hash Mismatch)
**症狀：**
- 登入頁面輸入正確預設密碼 `demo123`，系統卻回傳「密碼錯誤」。
- 發生於重新生成 Seed Data 之後。

**原因：**
- Seed Script (`seed_shohoku_data.sql`) 直接將明碼 `'demo123'` 寫入 `password_hash` 欄位。
- 登入函數 `login_player` 使用 `crypt(password, password_hash)` 進行比對。
- `crypt('demo123', 'demo123')` 因為 Salt 格式不正確導致比對失敗。

**解決方案：**
- 修改 Seed Script，使用 `pgcrypto` 的 `crypt()` 函數生成正確的 Bcrypt Hash。
```sql
-- 修改前
VALUES (..., 'demo123', ...)
-- 修改後
VALUES (..., crypt('demo123', gen_salt('bf')), ...)
```

---

### 2.3 登出導向異常 (Logout Redirect Loop)
**症狀：**
- 使用者點擊「登出」後，頁面跳轉回 `/login` (教練登入頁)，而非預期的首頁 (`/`)。
- 即使修正了 `navigate('/')`，問題依然存在。

**原因：**
- **Race Condition**：`PlayerRecordPage` 有一個 `useEffect` 負責檢查登入狀態 (`session` 是否存在)。
- 當 `logout()` 執行時，`session` 變為 `null`，觸發了 `useEffect`。
- `useEffect` 判定「無 Session 且在資料頁面」，於是執行了自動保護導向 (`navigate(.../login)`)。
- 這個導向發生在 `navigate('/')` 之前或同時，導致路由衝突。

**解決方案：**
- 引入 `useRef` 建立同步旗標 `isLoggingOut`。
- 在 `handleLogout` 時立即將旗標設為 `true`。
- 在 `useEffect` 檢查邏輯中，若 `isLoggingOut.current` 為真，則略過權限檢查。
- **最終手段**：改用 `window.location.href = '/'` 強制瀏覽器重整並跳轉，確保清除所有記憶體中的 React State 與 Cache。

```tsx
const isLoggingOut = useRef(false);

useEffect(() => {
    if (isLoggingOut.current) return; // 忽略檢查
    // ... 原本的權限檢查邏輯
}, [...]);

const handleLogout = () => {
    isLoggingOut.current = true;
    logout();
    localStorage.removeItem('player_session'); // 手動清除避免 State 更新 Race Condition
    window.location.href = '/'; // 強制跳轉
};
```

---

## 3. Google 登入 (OAuth) 整合經驗紀錄

在 React + Supabase 專案中整合 Google 登入十分單純，以下為標準設定步驟與導向處理重點：

### 3.1 Supabase 後台設定
1. 進入 **Authentication > Providers > Google**。
2. 啟用 Provider，並填入 Google Cloud Console 提供的：
   - **Client ID**
   - **Client Secret**
3. 設定 **Redirect URLs** (Callback 網址)：
   - 開發環境：`http://localhost:3000/auth/callback`
   - 正式環境：`https://your-domain.com/auth/callback`
4. 確保 **Site URL** 正確設定為應用程式的首頁域名。

### 3.2 React 程式碼實作 (登入)
使用 `signInWithOAuth` 方法，並透過 `options.redirectTo` 指定登入成功後的去處。

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(...);

const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // 登入成功後導向首頁 (或 /auth/callback 再轉首頁)
      redirectTo: `${window.location.origin}/`  
    }
  });
  if (error) console.error(error);
};
```
執行後會彈出 Google 登入視窗，成功後系統會自動處理 Token 交換並導向指定頁面。

### 3.3 登出整合與重導向修復
為避免登出後因為狀態未同步而產生無窮迴圈或錯誤導向，建議在 `signOut` 時明確指定去向：

```typescript
const handleLogout = async () => {
  // 明確指定登出後導向登入頁 (或首頁)，避免瀏覽器殘留狀態
  await supabase.auth.signOut({ 
    scope: 'local', // 視情況加上，避免觸發全域 Session 變動過快
    // 或是使用 redirectTo (視 Supabase 版本支援度)
  });
  
  // 前端路由跳轉
  window.location.href = '/login'; 
};
```

### 3.4 經驗總結
- **明確導向**：無論登入或登出，盡量在函式中明確指定 `redirectTo` 或透過 `window.location.href` 硬導向，能大幅減少因 React State 更新不及而產生的路由衝突。
- **第三方 Cookie**：Google 登入需注意瀏覽器 (如 Chrome Incognito, Safari) 對第三方 Cookie 的阻擋，開發時建議測試正常視窗。
