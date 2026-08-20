// admin/src/api/fund.js
// 资金管理（押金 / 提现审核）
import { get, post } from './base'

export function listWithdrawals(status) {
  return get('/admin/withdrawals', { status: status || '' })
}

export function approveWithdrawal(id) {
  return post('/admin/withdrawals/' + id + '/approve')
}

export function rejectWithdrawal(id, reason) {
  return post('/admin/withdrawals/' + id + '/reject', { reason: reason || '驳回' })
}

export function listDeposits() {
  return get('/admin/deposits')
}

export function generateCodes(amount, count) {
  return post('/admin/codes/generate', { amount, count })
}

export function listCodes(status) {
  return get('/admin/codes', { status: status || '' })
}

export function adminRechargeUser(id, amount) {
  return post('/admin/users/' + id + '/recharge', { amount })
}

export function platformStats() {
  return get('/admin/platform/stats')
}
