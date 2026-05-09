---
summary: "Hermes 瀏覽器自動化總覽圖（模式/設定/工具/限制）對應到 OpenClaw 的部署與應用手冊。"
title: "Hermes Browser Automation 部署與應用（中文）"
---

# Hermes Browser Automation 部署與應用（中文）

本文件把圖片 `E:/LINE下載資料/S__31424548.jpg` 的內容，轉成 OpenClaw 可直接執行的部署流程。

## 1) 圖片資料完整解析

### 1.1 六種執行模式

1. Browserbase cloud mode
- 圖意：雲端瀏覽器，反偵測與 managed cloud browsers。
- OpenClaw 對應：設定 profile 的 `cdpUrl` 指向 Browserbase/Browserless 類遠端端點（`ws/wss/http/https`）。

2. Browser Use cloud mode
- 圖意：另一種 cloud browser provider。
- OpenClaw 對應：同樣走遠端 `cdpUrl` profile。

3. Firecrawl cloud mode
- 圖意：雲端瀏覽 + 內建 scraping。
- OpenClaw 對應：當作遠端瀏覽 profile，搭配 `snapshot/requests/evaluate` 做資料擷取。

4. Camofox local mode
- 圖意：本機 anti-detection browsing。
- OpenClaw 對應：本機 managed browser profile（`openclaw`）+ doctor/status/snapshot/act 流程。

5. Local Chrome via CDP
- 圖意：借用自己的 Chrome cookies/sessions。
- OpenClaw 對應：`user` / existing-session profile（CDP/Chrome MCP）。

6. Local browser mode
- 圖意：CLI + 本機 Chromium。
- OpenClaw 對應：`openclaw browser start` 啟動本機 profile，走 `open/snapshot/click/type`。

### 1.2 快速設定入口（圖中 .env）

圖中關鍵鍵值（原樣保留概念）：
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`
- `BROWSER_USE_API_KEY`
- `FIRECRAWL_API_KEY`
- `CAMOFOX_URL`

OpenClaw 實務：
- 最核心是「可用的 CDP/WS endpoint + 對應 profile」。
- 雲端供應商金鑰通常經由該供應商 URL/連線參數注入，再由 `cdpUrl` profile 使用。

### 1.3 借用登入態（CDP）

圖中重點：Windows Chrome（9222）+ WSL/本機協作。

OpenClaw 對應：
- 先確保外部 Chrome 可被連線（CDP 或 Chrome MCP）。
- 用 `openclaw browser profiles` 檢查 `user` profile。
- 用 `openclaw browser focus/open/snapshot` 在同一 profile 延續登入態。

### 1.4 公網雲端 / 內網本機路由

圖中重點：
- 公網 URL 走 cloud。
- 內網/localhost 走本機。

OpenClaw 對應建議：
- 公網任務：使用遠端 `cdpUrl` profile。
- 內網任務：使用本機 `openclaw` profile。
- 一律先 `doctor/status/profiles/tabs`，再進入操作。

### 1.5 browser_* 工具箱（圖中）

圖中列出的核心操作（navigate/snapshot/vision/click/type/console/scroll/press/cdp/back/get_images/dialog）在 OpenClaw CLI 的對應命令：
- `openclaw browser navigate`
- `openclaw browser snapshot`
- `openclaw browser screenshot`
- `openclaw browser click`
- `openclaw browser type`
- `openclaw browser console`
- `openclaw browser press`
- `openclaw browser dialog`
- `openclaw browser tabs`
- `openclaw browser focus`
- `openclaw browser evaluate`

### 1.6 兩個實戰例子（圖中）

Case A（填表單）
1. `snapshot` 拿 ref
2. `type` 填欄位
3. `click` 送出
4. 再 `snapshot` 驗證結果

Case B（動態研究）
1. `navigate` 進頁
2. `snapshot` 抓結構
3. `click/scroll` 展開內容
4. `console/requests/evaluate` 補證據

### 1.7 Stealth / Session / Recording（圖中）

圖意重點：
- Session keep-alive
- 錄製與清理策略
- Proxy / stealth 策略

OpenClaw 實務：
- 長流程先固定 tab（label + tabId）。
- 每次頁面跳轉後都重新 snapshot，避免 stale ref。
- 一旦遇到登入/2FA/CAPTCHA/權限視窗，停止自動化並回報人工步驟。

### 1.8 限制與提醒（圖中）

圖中限制重點：
- 文字樹互動依賴 accessibility tree（不是像素座標）。
- 快照很大時會截斷/摘要。
- 雲端 session 有成本。
- 下載能力依執行環境限制。

OpenClaw 實務：
- 先 `snapshot` 再 `act`。
- 避免盲點擊與盲等待。
- 以 `targetId`/`tabId` 穩定綁定同一頁面。

## 2) 最快部署流程（OpenClaw）

在 `D:/OpenClaw`：

```bash
openclaw browser doctor
openclaw browser profiles
openclaw browser start --headless
openclaw browser open https://example.com --label hermes-demo
openclaw browser snapshot --target-id t2 --format aria --limit 120
openclaw browser stop
```

> 註：若 `--target-id hermes-demo` 找不到，先 `openclaw browser tabs`，再用 `tabId`（如 `t2`）做 target。

## 3) 應用規則（強烈建議）

1. 任何多步驟任務先跑 `doctor/status/profiles/tabs`。
2. 每一步操作前後都 snapshot 一次。
3. 永遠把 blocker（登入、2FA、captcha、權限）明確回報，不要假裝失敗是「未登入」。
4. 公網/內網分流，不混用 profile。
5. 先最小流程跑通，再擴增到完整商務流程。
