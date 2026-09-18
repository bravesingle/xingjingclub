// pages/booster-apply/booster-apply.js
// 入驻申请申请：姓名 / 手机号 / 擅长分类(多选) / 段位 / 备注
const boosterApi = require('../../api/booster')

const CATEGORY_OPTIONS = [
  { label: '排位', value: 'rank' },
  { label: '摸金', value: 'loot' },
  { label: '任务通关', value: 'task' },
  { label: '全面战场', value: 'warfare' }
]

Page({
  data: {
    name: '',
    phone: '',
    categories: CATEGORY_OPTIONS.map(function (c) {
      return { label: c.label, value: c.value, checked: false }
    }),
    rank: '',
    remark: '',
    withdrawChannel: 'wechat',
    withdrawAccount: '',
    submitting: false
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onRankInput(e) {
    this.setData({ rank: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onWithdrawAccountInput(e) {
    this.setData({ withdrawAccount: e.detail.value })
  },

  onWithdrawChannel(e) {
    this.setData({ withdrawChannel: e.currentTarget.dataset.channel })
  },

  /** 擅长分类多选切换 */
  onToggleCategory(e) {
    const value = e.currentTarget.dataset.value
    const categories = this.data.categories.map(function (c) {
      if (c.value === value) {
        return { label: c.label, value: c.value, checked: !c.checked }
      }
      return c
    })
    this.setData({ categories: categories })
  },

  /** 提交入驻申请 */
  onSubmit() {
    if (this.data.submitting) return
    const name = (this.data.name || '').trim()
    const phone = (this.data.phone || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请填写正确的11位手机号', icon: 'none' })
      return
    }
    const categories = this.data.categories
      .filter(function (c) { return c.checked })
      .map(function (c) { return c.value })
    if (categories.length === 0) {
      wx.showToast({ title: '请至少选择一项擅长分类', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    boosterApi.applyBooster({
      name: name,
      phone: phone,
      categories: categories,
      mode: 'hazard',
      rank: (this.data.rank || '').trim(),
      remark: (this.data.remark || '').trim(),
      withdrawChannel: this.data.withdrawChannel,
      withdrawAccount: (this.data.withdrawAccount || '').trim()
    }).then(() => {
      wx.showToast({ title: '已提交，等待后台审核', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/user/user' })
          }
        })
      }, 800)
    }).catch(() => {
      // 失败：request.js 已统一 toast
    }).then(() => {
      this.setData({ submitting: false })
    })
  }
})
