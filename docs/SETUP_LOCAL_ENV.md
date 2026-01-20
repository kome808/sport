# Supabase 本地開發環境設置指南

Supabase 的本地開發環境依賴於 Docker 來運行完整的資料庫與服務堆疊。請依照以下步驟完成安裝與啟動。

## 1. 安裝必要軟體

### Docker Desktop (必須)
Supabase 本地環境需要 Docker。
1. 請前往 [Docker Desktop 官網](https://www.docker.com/products/docker-desktop/) 下載並安裝 Windows 版本。
2. 安裝完成後，**請啟動 Docker Desktop 應用程式**。
3. 確保左下角的狀態燈號為綠色 (Engine running)。

### Node.js (您已安裝)
系統檢測到您已安裝 Node.js，因此可以使用 `npx` 指令。

## 2. 啟動 Supabase

當 Docker Desktop 啟動後，請在終端機 (Terminal) 執行以下指令：

```bash
# 1. 啟動 Supabase 服務 (第一次下載 Image 會花一點時間)
npx supabase start

# 2. 檢查服務狀態與 API URL/Key
npx supabase status
```

## 3. 套用資料庫變更

啟動成功後，需要將最新的資料表結構與數據套用到本地資料庫：

```bash
# 套用所有 Migration
npx supabase migration up

# (可選) 重置資料庫並重新套用 (會清除所有資料!)
# npx supabase db reset
```

## 4. 常見問題

### PowerShell 執行權限錯誤
如果您在 PowerShell 遇到 `UnauthorizedAccess` 錯誤，請改用 Command Prompt (cmd) 或者在指令前加上 `cmd /c`，例如：
`cmd /c "npx supabase start"`

### Docker 連線錯誤
如果出現 `error during connect...`，請確認 Docker Desktop 確實正在執行中。

## 5. 專案開發指令

- **前端開發 server**: `npm run dev` (在 `frontend` 目錄下)
- **停止 Supabase**: `npx supabase stop`
