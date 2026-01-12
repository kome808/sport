# 測試帳號資料

> 適用於本機開發環境 (http://localhost:5173 或 5174)

---

## 教練端帳號

| 項目 | 值 |
|------|-----|
| **Email** | `komepanfu@gmail.com` |
| **密碼** | 透過 Supabase Auth 設定的密碼 |
| **登入網址** | http://localhost:5174/login |

登入後會自動跳轉至 `大雄棒球隊` 的戰情室：
```
http://localhost:5174/doraemon-baseball
```

---

## 球員端帳號

### 球隊資訊
- **球隊代碼 (slug)**: `doraemon-baseball`
- **球隊名稱**: 大雄棒球隊

### 球員列表（密碼皆為 `1234`）

| 背號 | 姓名 | 短代碼 | 登入連結 |
|------|------|--------|----------|
| 1 | 大雄 | `hqc` | [點此登入](http://localhost:5174/doraemon-baseball/p/hqc/login) |
| 2 | 技安 | `aqv` | [點此登入](http://localhost:5174/doraemon-baseball/p/aqv/login) |
| 3 | 靜香 | `bg3` | [點此登入](http://localhost:5174/doraemon-baseball/p/bg3/login) |
| 4 | 出木杉 | `yde` | [點此登入](http://localhost:5174/doraemon-baseball/p/yde/login) |
| 5 | 阿福 | `f7z` | [點此登入](http://localhost:5174/doraemon-baseball/p/f7z/login) |
| 6 | 胖虎弟 | `teq` | [點此登入](http://localhost:5174/doraemon-baseball/p/teq/login) |
| 7 | 伸太 | `y4c` | [點此登入](http://localhost:5174/doraemon-baseball/p/y4c/login) |
| 8 | 安雄 | `wsf` | [點此登入](http://localhost:5174/doraemon-baseball/p/wsf/login) |
| 9 | 武夫 | `q9e` | [點此登入](http://localhost:5174/doraemon-baseball/p/q9e/login) |
| 11 | 小夫 | `z89` | [點此登入](http://localhost:5174/doraemon-baseball/p/z89/login) |

---

## 查詢球員登入連結

在 Supabase SQL Editor 中執行：
```sql
SELECT 
  jersey_number AS "背號",
  name AS "姓名",
  short_code AS "短代碼",
  'http://localhost:5174/doraemon-baseball/p/' || short_code || '/login' AS "登入URL"
FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
  AND is_active = true
ORDER BY jersey_number::integer;
```

---

## 初始化測試資料

如果資料庫尚未有測試資料，請執行：
```bash
# 在 Supabase SQL Editor 中執行 migrations/003_seed_data.sql
```

---

## 重設球員密碼

所有球員的初始密碼都設為 `1234`：
```sql
UPDATE sport.players 
SET password_hash = '1234' 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball');
```

---

*最後更新：2026-01-12*
