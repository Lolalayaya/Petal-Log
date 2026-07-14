import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions 會自動設定 CI=true，用來區分「部署到 GitHub Pages」與「本機建置」兩種情境。
const isCI = Boolean(process.env.CI)

// 本機雙擊開啟 dist/index.html 走的是 file:// 協定，Chrome 會擋掉 <script type="module"> 與
// 帶 crossorigin 屬性資源的 CORS 請求（origin 是 null），導致畫面整個空白。
// 這個外掛只在本機建置時，把輸出 HTML 的 script 標籤改回傳統寫法，讓它能直接雙擊在瀏覽器開啟。
// CI（GitHub Pages）走 http(s)，不受此限制，維持原本的 ES module 輸出。
function localFileOpenHtml() {
  return {
    name: 'local-file-open-html',
    apply: 'build',
    transformIndexHtml(html) {
      if (isCI) return html
      // type="module" script 預設就是延遲到 HTML 解析完才執行；改成傳統 script 後
      // 要補上 defer，否則 <script> 在 <head> 裡會搶在 <div id="root"> 出現前執行。
      return html.replace(/\s+type="module"/g, ' defer').replace(/\s+crossorigin/g, '')
    },
  }
}

export default defineConfig({
  base: isCI ? '/Petal-Log/' : './',
  plugins: [react(), localFileOpenHtml()],
  build: {
    // 本機建置改用傳統 IIFE 格式打成單一 script（配合上面外掛移除 type="module"）。
    // 專案沒有用到動態 import()，打成單一 bundle 沒有壞處。
    ...(isCI
      ? {}
      : {
          rollupOptions: {
            output: {
              format: 'iife',
              entryFileNames: 'assets/[name].js',
            },
          },
        }),
  },
})
