// 移动端 UA 访问隧道验证
;(async () => {
  const base = 'https://former-simplified-humanitarian-cycling.trycloudflare.com'
  const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
  for (const [name, ua] of [['iPhone Safari', iphoneUA], ['Android Chrome', androidUA]]) {
    try {
      const r = await fetch(base + '/', { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(25000) })
      const t = await r.text()
      console.log(name, '页面 →', r.status, '| 含 #app:', t.includes('<div id="app">'))
    } catch (e) {
      console.log(name, 'FAIL:', e.message)
    }
  }
  const r = await fetch(base + '/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': base, 'User-Agent': androidUA },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    signal: AbortSignal.timeout(25000)
  })
  const j = await r.json()
  console.log('移动端登录 →', r.status, '| code=' + j.code)
})()
