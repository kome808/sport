11111# 開發問題紀錄與待辦事項

> 此文件記錄專案開發過程中遇到的重要問題及解決方案，供未來參考。

---

## 📅 2026-01-12 問題紀錄

### 問題 1：Supabase Schema 權限不足 (403 Forbidden)

**症狀：**
- 前端查詢 `sport` schema 的資料表時出現 `403 Forbidden` 錯誤
- Console 顯示：`GET .../rest/v1/teams?... 403 (Forbidden)`

**原因：**
- 雖然在 Supabase Dashboard 的 **Settings > API > Exposed schemas** 中已加入 `sport`
- 但 `anon` 和 `authenticated` 角色缺少對 `sport` schema 的 **USAGE** 權限

**解決方案：**
```sql
GRANT USAGE ON SCHEMA sport TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sport TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sport TO anon, authenticated;

-- 設定預設權限 (新建物件自動繼承)
ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
```

**參考檔案：** `supabase/migrations/010_schema_permissions.sql`

---

### 問題 2：React StrictMode 導致 AbortError

**症狀：**
- Console 持續出現 `AbortError: signal is aborted without reason`
- 資料無法載入，頁面卡在 loading 狀態

**原因：**
- React 18 的 StrictMode 會在開發環境下讓 useEffect 執行兩次
- 這與 Supabase JS SDK 內部的 fetch 機制衝突，導致第一次請求被取消

**解決方案：**
暫時關閉 StrictMode (開發階段)：
```tsx
// frontend/src/main.tsx
createRoot(document.getElementById('root')!).render(
  <App />,  // 移除 <StrictMode> 包裹
)
```

---

### 問題 3：Tailwind v4 `bg-primary` 顏色無法正確顯示

**症狀：**
- 按鈕只有邊框，背景是透明或白色
- `bg-primary` 類別沒有作用

**原因：**
- Tailwind CSS v4 的 `@theme` 指令與 Shadcn UI 的預設樣式可能存在衝突
- CSS 變數對應不正確

**解決方案：**
使用明確的顏色值：
```tsx
<Button className="bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0">
```

或在 `app.css` 中強制覆蓋：
```css
@layer components {
    .bg-primary {
        background-color: #7367F0 !important;
    }
}
```

---

### 問題 4：登入後 isLoading 未正確重置

**症狀：**
- 登入成功後頁面持續顯示 loading spinner
- 無法跳轉到目標頁面

**原因：**
- `useAuth` hook 在某些成功路徑下沒有將 `isLoading` 設為 `false`

**解決方案：**
確保所有 return 路徑都重置 loading 狀態：
```typescript
const signIn = useCallback(async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error };
        return { success: true, user: data.user };
    } catch (e: any) {
        return { success: false, error: { message: e.message } };
    }
}, []);
```

---

## ⚠️ 待辦事項提醒

### 🔴 高優先級

- [ ] **資料庫權限設定**：新專案或重建資料庫時，務必執行 `010_schema_permissions.sql`
- [ ] **RLS 政策**：目前 RLS 已關閉 (`DISABLE ROW LEVEL SECURITY`)，正式上線前需重新啟用並設定適當的 Policy

### 🟡 中優先級

- [ ] **React StrictMode**：正式上線前考慮重新啟用 StrictMode，並修復相關的雙重執行問題
- [ ] **Tailwind CSS 主題**：統一 `@theme` 與 `:root` CSS 變數，避免使用 `!important`

### 🟢 低優先級

- [ ] **錯誤處理優化**：為所有 API 請求添加統一的錯誤處理與 Toast 通知
- [ ] **測試覆蓋**：為認證流程添加 E2E 測試

---

## 📚 相關資源

- [Supabase Custom Schemas](https://supabase.com/docs/guides/api/custom-schemas)
- [React 18 StrictMode](https://react.dev/reference/react/StrictMode)
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)

---

*最後更新：2026-01-12*
