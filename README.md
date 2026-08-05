# 🌸 Petal Log

以隱私為優先設計的經期記錄網頁應用。開啟網頁即可使用，免註冊、免安裝，資料預設只留在你的裝置上。

**線上體驗：[lolalayaya.github.io/Petal-Log](https://lolalayaya.github.io/Petal-Log/)**

---

## 這個專案在解決什麼問題

- 多數經期記錄 App 需要註冊帳號、上傳資料到雲端，對重視隱私的使用者是進入門檻，也是暴露風險（例如他人瞥見螢幕、共用裝置）。
- 記一筆經期紀錄常常要點好幾層選單，對忙碌或不想多想的日子來說太麻煩。
- 想在多裝置間同步紀錄，又不想被迫綁定傳統帳號密碼系統。

## 功能特色

- 🔒 **隱私優先** — 所有紀錄預設只存在瀏覽器 `localStorage`，不上傳任何伺服器；介面文案採中性字眼（如「記錄」而非「經期記錄」），降低他人瞥見螢幕時的暴露風險。
- ⚡ **兩次點擊完成記錄** — 從開啟 App 到儲存一筆經量紀錄，最少只需點兩下（FAB → 選經量 → 儲存）。
- 📅 **週期預測** — 依據歷史紀錄自動推算目前週期第幾天、預計下次經期開始日，並在日曆上標示。
- 🩸 **完整 CRUD** — 新增、檢視、修改、刪除每日紀錄，支援症狀標記與自訂顏色。
- ☁️ **選配雲端同步** — 不需傳統帳號密碼，透過「同步碼」機制即可啟用跨裝置同步與備份（基於 Supabase），不啟用者行為與純本機版本完全一致。
- 🧩 **零後端依賴** — 純前端 SPA，可直接靜態託管於 GitHub Pages。

## 目前狀態

已上線並持續維護中，透過 GitHub Actions（`.github/workflows/deploy.yml`）在推送至 `main` 時自動建置並部署到 GitHub Pages。

## 技術棧

React 18 · Vite · Supabase（選配雲端同步）· date-fns

## 開始使用

```bash
npm install
npm run dev
```

如需啟用雲端同步功能，複製 `.env.example` 為 `.env` 並填入 Supabase 專案的 URL 與 anon key：

```bash
cp .env.example .env
```

```bash
npm run build     # 建置到 dist/
npm run preview   # 預覽建置結果
```

## 文件

更完整的架構、資料模型與設計決策說明請見 [SDD.md](./SDD.md)（軟體設計文件）。
