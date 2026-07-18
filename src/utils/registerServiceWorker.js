// 註冊 Service Worker 供通知提醒使用（見 SDD 14.1）。file:// 協定（本機雙擊開啟 dist/index.html）
// 不支援 Service Worker，直接短路跳過，不影響其餘功能，呼應 cloudAdapter.getSupabaseClient() 的短路風格。
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (window.location.protocol === 'file:') return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
