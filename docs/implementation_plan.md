# 基層運動訓練系統 - P1 實作計畫

> 文件版號：V1.0  
> 日期：2026-01-11  
> 狀態：待審核

---

## 1. 專案概述

### 1.1 目標

建立一套現代化的基層運動球隊線上服務系統，提供：
- 球員訓練疲勞管理（ACWR、RHR、Wellness、sRPE）
- 傷病回報與醫療紀錄
- 教練儀表板與警訊系統
- RWD 響應式設計（支援桌面與手機）

### 1.2 技術堆疊

| 層級 | 技術選型 |
|------|----------|
| **前端框架** | React 18 + TypeScript |
| **建置工具** | Vite |
| **路由** | React Router v6 (BrowserRouter) |
| **UI 元件庫** | Shadcn UI + TailwindCSS v4 |
| **圖示** | Lucide Icons |
| **狀態管理** | TanStack Query (React Query) |
| **表單驗證** | React Hook Form + Zod |
| **圖表** | Recharts |
| **後端** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Email** | Gmail SMTP (via Edge Function) |
| **部署** | Vercel + GitHub Actions |

---

## 2. 專案結構

```
sports-training-platform/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── routes/                    # 路由定義
│   │   │   ├── index.tsx              # Landing Page
│   │   │   ├── login.tsx              # 教練登入
│   │   │   ├── register.tsx           # 教練註冊
│   │   │   ├── team/
│   │   │   │   ├── [slug]/
│   │   │   │   │   ├── index.tsx      # 教練儀表板
│   │   │   │   │   ├── players.tsx    # 球員管理
│   │   │   │   │   ├── player/
│   │   │   │   │   │   └── [id].tsx   # 球員詳情
│   │   │   │   │   └── notifications.tsx
│   │   │   │   └── setup.tsx          # 球隊初始化
│   │   │   └── p/
│   │   │       └── [id]/
│   │   │           ├── index.tsx      # 球員端首頁
│   │   │           └── login.tsx      # 球員登入
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn UI 元件
│   │   ├── common/                    # 通用元件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── dashboard/                 # 儀表板元件
│   │   │   ├── TeamHeatmap.tsx
│   │   │   ├── RiskAlertCard.tsx
+   │   │   └── NotificationBell.tsx
│   │   ├── player/                    # 球員相關元件
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── DailyRecordForm.tsx
│   │   │   ├── WellnessForm.tsx
│   │   │   └── AcwrChart.tsx
│   │   └── medical/                   # 醫療相關元件
│   │       ├── BodyMap.tsx            # 人體圖
│   │       ├── PainReportForm.tsx
│   │       └── MedicalRecordCard.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase Client (Singleton)
│   │   │   ├── schema.ts              # Schema 設定
│   │   │   └── types.ts               # 自動生成的型別
│   │   ├── adapters/
│   │   │   ├── index.ts               # Adapter Factory
│   │   │   ├── supabase.adapter.ts    # Supabase Adapter
│   │   │   └── local.adapter.ts       # Local Storage Adapter
│   │   └── utils/
│   │       ├── calculations.ts        # ACWR/DSS 計算
│   │       ├── formatters.ts          # 日期/數字格式化
│   │       └── validators.ts          # 驗證輔助
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # 認證 Hook
│   │   ├── useTeam.ts                 # 球隊資料 Hook
│   │   ├── usePlayers.ts              # 球員資料 Hook
│   │   └── useDailyRecords.ts         # 每日紀錄 Hook
│   │
│   ├── stores/                        # 全域狀態 (如需要)
│   │   └── auth.store.ts
│   │
│   ├── styles/
│   │   └── globals.css                # Design Tokens + Tailwind
│   │
│   └── types/
│       └── index.ts                   # 共用型別定義
│
├── supabase/
│   ├── migrations/                    # SQL 遷移檔
│   │   └── 001_initial_schema.sql
│   └── functions/                     # Edge Functions
│       └── send-notification-email/
│           └── index.ts
│
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 3. P1 開發里程碑

### Phase 1.1 - 專案基礎建設 (預計 1 天)

- [ ] 使用 Vite 初始化 React + TypeScript 專案
- [ ] 安裝並設定 TailwindCSS v4
- [ ] 安裝並設定 Shadcn UI
- [ ] 建立 Design Tokens (globals.css)
- [ ] 設定 React Router
- [ ] 建立 Supabase Client (Singleton + Adapter Pattern)
- [ ] 建立基礎 Layout 元件

### Phase 1.2 - 資料庫部署 (預計 0.5 天)

- [ ] 在 Supabase 建立 `sport` Schema
- [ ] 執行 DDL SQL (建表)
- [ ] 設定 RLS 政策
- [ ] 建立觸發器與函數
- [ ] 驗證資料庫連線

### Phase 1.3 - 產品首頁 (預計 1 天)

- [ ] Landing Page 設計實作
  - Hero Section
  - 功能展示區塊
  - 運科原理說明
  - FAQ 區塊
  - CTA 按鈕
- [ ] RWD 響應式調整

### Phase 1.4 - 認證系統 (預計 1.5 天)

- [ ] 教練註冊頁面 (Email + 密碼)
- [ ] 教練登入頁面
- [ ] Supabase Auth 整合
- [ ] 球員登入頁面 (ID + 密碼)
- [ ] 球員認證邏輯
- [ ] 認證狀態管理

### Phase 1.5 - 球隊初始化 (預計 1 天)

- [ ] 球隊建立流程
  - 球隊名稱設定
  - Slug 驗證（唯一性）
  - 隊徽上傳 (Supabase Storage)
  - 運動項目選擇
- [ ] 球隊選擇頁面（多球隊支援）

### Phase 1.6 - 教練儀表板 (預計 2 天)

- [ ] 側邊欄導航 (Porto Admin 風格)
- [ ] 全隊訓練負荷熱力圖 (28天)
- [ ] 高風險球員預警卡片
- [ ] 警訊中心 (Notifications)
- [ ] 即時更新機制

### Phase 1.7 - 球員管理 (預計 1.5 天)

- [ ] 球員清單頁面
- [ ] 新增球員表單
- [ ] 編輯球員資料
- [ ] 產生球員專屬連結與密碼
- [ ] 球員狀態管理 (啟用/停用)

### Phase 1.8 - 每日訓練回報 (預計 2 天)

- [ ] 25秒快速回報 Flow
  - 晨間靜止心率輸入
  - Wellness 5 項量表
  - sRPE 滑桿 + 訓練時間
- [ ] 訓練負荷自動計算 (AU)
- [ ] ACWR/DSS 即時計算
- [ ] 風險等級顯示
- [ ] 歷史趨勢圖表 (Recharts)

### Phase 1.9 - 疼痛與醫療管理 (預計 2 天)

- [ ] 互動人體模型圖 (疼痛標記)
- [ ] 疼痛回報表單
- [ ] 疼痛歷史紀錄
- [ ] 醫療紀錄表單
- [ ] 照片上傳 (Supabase Storage)
- [ ] 歷史紀錄查詢

### Phase 1.10 - 通知系統 (預計 1 天)

- [ ] 通知列表頁面
- [ ] 通知標記已讀
- [ ] Gmail SMTP Edge Function
- [ ] 高風險預警自動通知

---

## 4. 設計規範

### 4.1 配色系統

```css
:root {
  /* 主色 - 棒球場綠 */
  --color-primary: 142 71% 45%;        /* HSL */
  --color-primary-foreground: 0 0% 100%;
  
  /* 系統藍 */
  --color-system: 213 94% 68%;
  
  /* 警告橘 */
  --color-warning: 38 92% 50%;
  
  /* 危險紅 */
  --color-danger: 0 84% 60%;
  
  /* 成功綠 */
  --color-success: 142 76% 36%;
  
  /* 風險等級 */
  --color-risk-green: 142 76% 36%;
  --color-risk-yellow: 48 96% 53%;
  --color-risk-red: 0 84% 60%;
  --color-risk-black: 0 0% 15%;
  
  /* 背景與前景 */
  --color-background: 0 0% 100%;
  --color-foreground: 222 47% 11%;
  
  /* 側邊欄 - 淺色 */
  --color-sidebar: 210 40% 98%;
  --color-sidebar-foreground: 222 47% 11%;
}
```

### 4.2 間距系統

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
}
```

### 4.3 字型系統

```css
:root {
  --font-sans: 'Inter', 'Noto Sans TC', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
}
```

---

## 5. 路由規劃

| 路徑 | 頁面 | 存取權限 |
|------|------|----------|
| `/` | 產品首頁 | 公開 |
| `/login` | 教練登入 | 公開 |
| `/register` | 教練註冊 | 公開 |
| `/team/setup` | 球隊初始化 | 已登入教練 |
| `/{team_slug}` | 教練儀表板 | 球隊成員 |
| `/{team_slug}/players` | 球員管理 | 球隊成員 |
| `/{team_slug}/player/{id}` | 球員詳情 | 球隊成員 |
| `/{team_slug}/notifications` | 警訊中心 | 球隊成員 |
| `/{team_slug}/p/{player_id}` | 球員端入口 | 公開 (需密碼) |
| `/{team_slug}/p/{player_id}/login` | 球員登入 | 公開 |

---

## 6. API 設計

### 6.1 Supabase Direct Client

一般 CRUD 操作直接使用 Supabase Client：

```typescript
// 範例：取得球隊球員列表
const { data, error } = await supabase
  .schema('sport')
  .from('players')
  .select('*')
  .eq('team_id', teamId)
  .eq('is_active', true)
  .order('jersey_number');
```

### 6.2 Edge Functions

僅用於需要隱藏 API Key 或外部服務整合：

| Function | 用途 |
|----------|------|
| `send-notification-email` | 發送 Gmail 通知信 |
| `ai-training-advice` | AI 訓練建議 (P3) |

---

## 7. 驗證計畫

### 7.1 自動化測試

- [ ] 單元測試：ACWR/DSS 計算邏輯
- [ ] 整合測試：Supabase 連線與 RLS
- [ ] E2E 測試：關鍵使用者流程

### 7.2 手動驗證

- [ ] RWD 響應式檢查（桌面、平板、手機）
- [ ] 瀏覽器相容性（Chrome、Safari、Edge）
- [ ] 實際數據填報測試
- [ ] 通知發送測試

---

## 8. 注意事項

> [!IMPORTANT]
> **開發規範**
> - 禁止使用 `.single()` 查詢
> - 禁止寫死 Schema 名稱
> - 禁止在元件中寫死假資料
> - 所有資料必須透過 Adapter 讀取

> [!WARNING]
> **安全考量**
> - 球員密碼必須使用 bcrypt 雜湊
> - 敏感操作需驗證 RLS 政策
> - Email 發送需透過 Edge Function

---

## 9. 審核確認項目

請確認以下項目後方可開始開發：

- [ ] Database Schema 設計無誤
- [ ] 專案結構規劃合適
- [ ] 開發里程碑順序正確
- [ ] 設計規範符合期望
- [ ] 路由規劃無遺漏
