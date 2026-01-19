# 球員資料編輯功能實作總結

## 📋 功能概述

已完整實作球員個人資料編輯功能，包含：
- ✅ 球員端編輯介面
- ✅ 教練端編輯介面
- ✅ 完整的表單驗證
- ✅ 密碼驗證機制
- ✅ 即時資料更新

## 🎯 實作內容

### 1. 球員資訊顯示欄位
**位置**: `PlayerRecordPage.tsx`

#### 球員端顯示 (mode='player')
- 姓名 + 背號徽章
- 球隊名稱 + 位置
- 身高、體重、年齡、位置（4格網格）
- 右上角設定按鈕（齒輪圖示）

#### 教練端顯示 (mode='coach')
- 返回按鈕 + 背號大圖示 + 姓名
- 位置、身高、體重、年齡、編輯資料按鈕（5格網格）

### 2. ProfileEditDialog 元件
**檔案**: `frontend/src/components/player/ProfileEditDialog.tsx`

#### 可編輯欄位
1. **基本資料**
   - 姓名 (必填，至少2字)
   - 背號 (選填)
   - 位置 (選填)

2. **身體數據**
   - 身高 (cm，數字輸入)
   - 體重 (kg，數字輸入)
   - 出生日期 (日期選擇器)

3. **密碼管理**
   - 舊密碼 (必填，用於驗證)
   - 新密碼 (選填，若不修改可留空)
   - 確認新密碼 (選填)

#### 表單驗證
- 使用 `react-hook-form` + `zod` 進行驗證
- 姓名長度檢查
- 新密碼一致性檢查
- 舊密碼必填（安全驗證）

### 3. 資料更新 Hook
**Hook**: `useUpdatePlayerProfile`

#### 功能
- 呼叫 Supabase RPC: `update_player_profile`
- 傳遞參數：
  - `playerId`: 球員 ID
  - `oldPassword`: 舊密碼（驗證用）
  - `name`, `jerseyNumber`, `position`: 基本資料
  - `height_cm`, `weight_kg`, `birth_date`: 身體數據
  - `newPassword`: 新密碼（選填）

#### 錯誤處理
- 舊密碼錯誤提示
- 更新失敗提示
- 成功後關閉對話框並刷新資料

## 🔧 技術細節

### 表單狀態管理
```typescript
const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ... }
});
```

### 密碼驗證邏輯
```typescript
.refine((data) => {
    if (data.new_password && data.new_password !== data.confirm_new_password) {
        return false;
    }
    return true;
}, {
    message: "新密碼不一致",
    path: ["confirm_new_password"],
});
```

### 年齡計算
```typescript
const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
```

## 🎨 UI/UX 設計

### 對話框樣式
- 最大寬度: 425px
- 最大高度: 70vh（可滾動）
- 圓角設計，現代化風格
- 圖示輔助（User, Hash, Lock 等）

### 輸入欄位分組
1. 基本資料區（姓名、背號/位置）
2. 身體數據區（身高/體重、出生日期）
3. 密碼區（分隔線區隔）

### 按鈕狀態
- 儲存中顯示 Loading 動畫
- 取消按鈕（outline 樣式）
- 儲存按鈕（primary 樣式）

## 📱 使用流程

### 球員端
1. 點擊右上角齒輪圖示
2. 填寫/修改資料
3. 輸入舊密碼驗證
4. （選填）設定新密碼
5. 點擊「儲存設定」

### 教練端
1. 點擊「編輯資料」按鈕
2. 填寫/修改資料
3. 輸入舊密碼驗證
4. （選填）設定新密碼
5. 點擊「儲存設定」

## ⚠️ 安全機制

1. **密碼驗證**: 所有修改都需要輸入舊密碼
2. **前端驗證**: Zod schema 驗證
3. **後端驗證**: RPC 函數驗證舊密碼
4. **密碼加密**: 使用 bcrypt 加密儲存

## 🔄 資料同步

- 使用 React Query 自動重新獲取資料
- 更新成功後自動刷新頁面顯示
- 關閉對話框時重置表單狀態

## 📝 待優化項目

1. 可考慮加入頭像上傳功能
2. 可加入更詳細的錯誤訊息
3. 可加入修改歷史記錄
4. 可加入更多身體數據欄位（如慣用手等）

## ✅ 測試檢查清單

- [ ] 球員端編輯按鈕顯示正常
- [ ] 教練端編輯按鈕顯示正常
- [ ] 對話框開啟/關閉正常
- [ ] 表單預填資料正確
- [ ] 姓名驗證正常
- [ ] 密碼一致性驗證正常
- [ ] 舊密碼錯誤提示正常
- [ ] 更新成功後資料刷新
- [ ] 僅修改資料不改密碼可正常運作
- [ ] 同時修改資料和密碼可正常運作
