// 临时验证脚本：公网隧道端到端（带浏览器 UA，规避 Cloudflare bot 拦截）
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
;(async () => {
  const base = 'https://former-simplified-humanitarian-cycling.trycloudflare.com'
  const headers = { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'zh-CN,zh;q=0.9' }
  // 1) admin 页面
  try {
    const r = await fetch(base + '/', { headers, signal: AbortSignal.timeout(25000) })
    const t = await r.text()
    console.log('admin 页面:', r.status, '| 含 #app:', t.includes('<div id="app">'), '| 长度:', t.length)
  } catch (e) {
    console.log('admin 页面 FAIL:', e.message)
  }
  // 2) API 同源代理
  try {
    const r = await fetch(base + '/api/home/data', { headers: { ...headers, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) })
    const t = await r.text()
    console.log('API /api/home/data:', r.status, '| body:', t.slice(0, 80))
  } catch (e) {
    console.log('API FAIL:', e.message)
  }
})()
