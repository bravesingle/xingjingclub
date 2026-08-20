// admin/src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import { isLoggedIn } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'services',
        name: 'services',
        component: () => import('../views/Services.vue'),
        meta: { title: '服务商品' }
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('../views/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'boosters',
        name: 'boosters',
        component: () => import('../views/Boosters.vue'),
        meta: { title: '打手管理' }
      },
      {
        path: 'withdrawals',
        name: 'withdrawals',
        component: () => import('../views/Withdrawals.vue'),
        meta: { title: '提现审核' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.path !== '/login' && !isLoggedIn()) return '/login'
  if (to.path === '/login' && isLoggedIn()) return '/dashboard'
  return true
})

router.afterEach((to) => {
  document.title = (to.meta && to.meta.title ? to.meta.title + ' · ' : '') + '星竞电竞管理后台'
})

export default router
