# AI Coding 開發規範

> 版本：1.0
> 建立日期：2026-01-10
> 適用範圍：使用 Supabase、React/Vite、RAG 等技術的 Web 應用開發

---

## 0.5 文檔規範 (Documentation Standards)

1. **語言要求**：
   - 所有輸出（包含回覆、思考、任務清單、分析、建議、程式碼註解）均使用 **繁體中文**。

2. **規劃文件命名與存放**：
   - 每次規劃預計實作之文件，檔名必須採用 **「YYYYMMDD_主題(中文).md」** 格式（例如：`20260113_通知系統實作.md`）。
   - 所有規劃文件統一存放於 `docs/Plan/` 目錄下。
   - 這樣做是為了方便追蹤系統演進過程。

---

## 0. 核心指令 (Prime Directive)

**AI 必須在執行任何開發前，依序閱讀以下文件：**

1. **`guidelines/Product_Context.md`**：理解系統目標、核心角色與全域資料流
2. **`docs/spec/rules.md`**：確認業務規則，檢查是否與既有規則衝突
3. **`docs/plan/[模組名稱].md`**：確認當前任務的 UI/UX 與邏輯需求

> **文件優先順序（由高到低）**：
> `Product_Context.md` → `rules.md` → `plan/*.md` → 程式碼實作

---

## 1. 開發流程 (Development Workflow)

### 1.1 需求確認

- **先討論**：與使用者確認需求細節（目標、情境、流程、權限、例外處理）
- **後文件**：將確認的需求寫入 `docs/plan/[模組名稱].md`
- **規則同步**：若涉及跨模組規則，同步更新 `docs/spec/rules.md`

### 1.2 一致性檢查

- **寫程式前**：確認 `rules.md` 與 plan 文件完整描述需求
- **寫程式後**：對照文件逐條檢核，若不一致需先回寫文件

### 1.3 模組化結構

- 各模組程式碼必須分開存放
- 更新某模組時，不得影響其他模組運作

---

## 2. 技術架構 (Architecture)

### 2.1 資料存取層

| 規則 | 說明 |
|------|------|
| Adapter 一致性 | 統一回傳格式：`{ data: T \| null, error: Error \| null }` |
| 強制非同步 | 所有資料存取必須使用 Async/Await |
| Singleton | 全域僅能有一個 Supabase Client 實例 |

### 2.2 Supabase 使用規範

| 規則 | 說明 |
|------|------|
| Schema 隔離 | 使用專屬 Schema（如 `aiproject`），不用預設 `public` |
| RLS 啟用 | 所有表必須啟用 Row Level Security |
| 環境變數 | 正式環境使用 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` |

### 2.3 Edge Function 使用時機

| 適用場景 | 不適用場景 |
|---------|-----------|
| AI 推論/生成 | 一般 CRUD |
| 外部 API 呼叫 | 讀取列表資料 |
| 需隱藏 API Key | 簡單查詢 |

---

## 3. 禁止事項 (Strict Prohibitions) 🔴

### 3.1 資料存取

| 禁止 | 理由 | 替代方案 |
|-----|------|---------|
| 使用 `.single()` 查詢 | 空結果會拋出 406 錯誤 | 改用 `.maybeSingle()` |
| 寫死假資料 | 阻礙測試與 Adapter 切換 | 透過 Adapter 從 DB 讀取 |
| 寫死 Schema 名稱 | Schema 會隨專案變動 | 使用變數傳遞 |

### 3.2 環境相關

| 禁止 | 理由 | 替代方案 |
|-----|------|---------|
| 預覽環境使用 `import.meta.env` | 可能無環境變數 | 從 localStorage 讀取或 UI 輸入 |
| 使用 kv_store | 系統採關聯式結構 | 存入結構化表格 |

### 3.3 郵件發送（Gmail SMTP）

| 禁止 | 理由 | 替代方案 |
|-----|------|---------|
| 在觸發器中硬編碼中文 | 經 pg_net 傳遞會亂碼 | Edge Function 處理中文模板 |
| 使用 `jsonb_build_object` 傳遞中文 | 編碼問題 | 使用純 JSON 字串 |

---

## 4. Supabase 設定規範

### 4.1 表格設計

```sql
-- 必須包含時間戳欄位
CREATE TABLE schema_name.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... 其他欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 必須建立更新時間戳觸發器
CREATE TRIGGER update_timestamp
BEFORE UPDATE ON schema_name.table_name
FOR EACH ROW EXECUTE FUNCTION schema_name.update_updated_at();
```

### 4.2 RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE schema_name.table_name ENABLE ROW LEVEL SECURITY;

-- 範例：專案成員才能存取
CREATE POLICY "Members can access"
ON schema_name.table_name FOR ALL TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM schema_name.members
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

### 4.3 Edge Function 結構

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 預檢
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    // 處理邏輯

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 5. 前端規範

### 5.1 樣式系統

| 規則 | 說明 |
|------|------|
| CSS 框架 | Tailwind CSS |
| Design Tokens | 定義於 `/styles/globals.css` |
| 顏色/間距 | 必須使用 CSS 變數 |

### 5.2 元件規範

| 規則 | 說明 |
|------|------|
| 元件庫 | 使用 Shadcn UI（若已安裝） |
| 路由 | HashRouter（URL 帶 `#`） |
| 狀態管理 | React Query（伺服器狀態） |

---

## 6. RAG 系統規範

### 6.1 文件處理

| 步驟 | 說明 |
|------|------|
| 分塊 | 800-1500 字元，保留語意完整 |
| Embedding | 使用 OpenAI `text-embedding-3-small` |
| 儲存 | Supabase `pgvector` 擴展 |

### 6.2 查詢流程

1. 將查詢轉為 Embedding
2. 使用餘弦相似度搜尋相關 chunks
3. 將結果作為 context 送給 LLM

---

## 7. 部署流程 (SOP)

### 7.1 資料庫部署

1. 指定正式 Schema 名稱
2. AI 產出 DDL（建表）與 DML（RLS 權限）SQL
3. 使用者在 Supabase Dashboard 執行 SQL
4. 驗證 RLS 政策生效

### 7.2 前端部署

1. 設定 Vercel 環境變數：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. 推送到 GitHub，Vercel 自動部署
3. 驗證功能正常

### 7.3 Edge Function 部署

1. 設定 Supabase Secrets（API Keys）
2. 在 Dashboard 建立/更新 Function
3. 測試功能

---

## 8. 規格文件範本

當模組開發完畢，需產生規格文件：

```markdown
# [模組名稱] 功能規格書

> 文件版號：V1.0
> 產出日期：YYYY-MM-DD

## 1. 模組概述
- **目的**：解決什麼問題
- **使用者**：目標角色
- **核心價值**：帶來什麼效益

## 2. 功能清單
- [查詢] User Story...
- [新增] User Story...
- [操作] User Story...

## 3. 重要規則
### 3.1 資料驗證
### 3.2 操作限制
### 3.3 權限控制

## 4. 介面互動流程

## 5. 資料欄位定義

## 6. 測試案例
```

---

## 附錄：常見問題

### Q: Supabase 查詢返回 500 錯誤？
**A**: 檢查 RLS 政策是否正確，特別是輔助函數是否存在。

### Q: 郵件中文亂碼？
**A**: 使用英文框架 + 動態中文資料，避免在 PostgreSQL 觸發器中硬編碼中文。

### Q: Edge Function 401 錯誤？
**A**: 關閉 JWT 驗證（用於內部觸發器呼叫），或加入 Authorization header。
