# 新增 DEMO 球隊：湘北籃球隊 & 網域規劃

## 1. 系統展示架構規劃

### 網域策略
使用者希望將 DEMO 放在 `demo.sportrepo.com` 以避免與正式環境 `app.sportrepo.com` (或主網域) 發生 Session 衝突。

**分析與建議：**
- **Session 隔離**：Supabase Auth 預設使用 `localStorage` 儲存 Session (JWT)。由於 `localStorage` 是遵循 **Same Origin Policy** (同源策略)，不同子網域 (`demo.sportrepo.com` vs `sportrepo.com`) 的儲存空間是完全隔離的。
- **結論**：只要將前端部署到 `demo.sportrepo.com`，使用者在該網域的登入狀態**自然**不會與主網域衝突，無需額外複雜設定。

**實作步驟：**
1.  **DNS 設定**：設定 `demo` A record 或 CNAME 指向前端 Hosting (Vercel/Netlify)。
2.  **Supabase 設定**：在 Supabase Dashboard -> Authentication -> URL Configuration -> **Redirect URLs** 中新增 `https://demo.sportrepo.com/**`，確保登入/重設密碼後的跳轉被允許。
3.  **環境變數**：在 `demo.sportrepo.com` 的部署環境中，`VITE_SITE_URL` 應設為 `https://demo.sportrepo.com`。

---

## 2. 新增球隊數據規劃

將建立一隻名為「湘北籃球隊」的 DEMO 球隊，包含主要角色與模擬數據。

### 球隊資訊
- **名稱**：湘北籃球隊 (Shohoku)
- **運動類型**：籃球 (Basketball)
- **教練帳號**：`coach@shohoku.com` (安西教練, 密碼 `demo123`)

### 球員名單 (先發五人)
| 姓名 | 背號 | 位置 | 角色設定 |
| :--- | :--- | :--- | :--- |
| 櫻木花道 (Sakuragi) | 10 | PF |天才新手，體能超強但技術不穩定，疲勞恢復快 |
| 流川 楓 (Rukawa) | 11 | SF | 王牌得分手，自我要求高，訓練量大，容易隱藏疲勞 |
| 赤木剛憲 (Akagi) | 4 | C | 隊長，精神支柱，長期高強度訓練，腳踝有舊傷風險 |
| 宮城良田 (Miyagi) | 7 | PG | 電光石火控衛，速度快，情緒波動較大 |
| 三井 壽 (Mitsui) | 14 | SG | 體力是弱點，膝蓋有舊傷史，疲勞值容易飆升 |

### 數據模擬策略 (最近 30 天)
透過 SQL Script 自動生成：
1.  **訓練負荷 (RPE & 時間)**：根據角色設定不同基數 (例如流川楓訓練量大，三井壽體力差)。
2.  **身心狀態 (Wellness)**：模擬比賽日前後的疲勞波動。
3.  **疼痛回報**：偶爾插入特定部位疼痛 (赤木->腳踝, 三井->膝蓋)。

---

## 3. SQL 腳本規劃
建立新的 Migration 檔案 `supabase/migrations/20260126040000_seed_shohoku_data.sql`

**邏輯流程：**
1.  檢查是否存在 `coach@shohoku.com`，若無則建立 (auth.users & public.users)。
2.  檢查是否存在「湘北籃球隊」，若無則建立。
3.  將教練關聯到該球隊。
4.  清除該球隊現有球員與數據 (重置功能)。
5.  建立 5 位先發球員。
6.  為每位球員生成過去 30 天的 `daily_records`。
7.  生成特定的 `pain_reports` (模擬傷病史)。

## 4. 執行計畫
1.  [ ] 建立 SQL Migration 檔案。
2.  [ ] 撰寫資料生成邏輯 (參考大雄棒球隊腳本)。
3.  [ ] 在本地執行並驗證數據。
4.  [ ] 提供部署 `demo` 網域的具體設定指引。
