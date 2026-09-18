// 演示前体检：公网完整链路
;(async () => {
  const base = 'https://terrain-gods-urge-personnel.trycloudflare.com'
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  // 1) 管理后台页面
  const r1 = await fetch(base + '/', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) })
  const t1 = await r1.text()
  console.log('① admin 页面 →', r1.status, '| 含 #app:', t1.includes('<div id="app">'))
  // 2) 公开 API
  const r2 = await fetch(base + '/api/home/data', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) })
  const j2 = await r2.json()
  console.log('② 公开 API /home/data →', r2.status, '| code=' + j2.code)
  // 3) 登录
  const r3 = await fetch(base + '/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': base, 'User-Agent': UA },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    signal: AbortSignal.timeout(25000)
  })
  const j3 = await r3.json()
  console.log('③ 管理登录 →', r3.status, '| code=' + j3.code)
  // 4) 带 token 拉数据（订单）
  const r4 = await fetch(base + '/api/admin/orders?page=1&pageSize=5', {
    headers: { 'Origin': base, 'User-Agent': UA, 'Authorization': 'Bearer ' + (j3.data && j3.data.token || '') },
    signal: AbortSignal.timeout(25000)
  })
  const j4 = await r4.json()
  console.log('④ 订单列表 →', r4.status, '| code=' + j4.code + ' | total=' + (j4.data && j4.data.total))
  // 5) 运营管理员也能登录（演示双账号）
  const r5 = await fetch(base + '/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': base, 'User-Agent': UA },
    body: JSON.stringify({ username: 'operator', password: 'operator123' }),
    signal: AbortSignal.timeout(25000)
  })
  const j5 = await r5.json()
  console.log('⑤ 运营管理员登录 →', r5.status, '| code=' + j5.code)
})()
