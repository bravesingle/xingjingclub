// pages/login/login.js
// 登录 / 注册：昵称 + 游戏ID + 手机号（均选填），勾选协议后提交
const config = require('../../config/index')
const auth = require('../../utils/auth')
const userApi = require('../../api/user')

Page({
  data: {
    nickname: '',
    gameId: '',
    phone: '',
    agree: false,
    submitting: false,
    brand: config.brand,
    brandSlogan: config.brandSlogan
  },

  onLoad() {
    if (auth.isLoggedIn()) {
      wx.showToast({ title: '已登录', icon: 'none' })
      setTimeout(() => {
        this.back()
      }, 600)
    }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onGameIdInput(e) {
    this.setData({ gameId: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onToggleAgree() {
    this.setData({ agree: !this.data.agree })
  },

  /** 协议占位弹窗：data-type = user | privacy */
  onAgreementTap(e) {
    const type = e.currentTarget.dataset.type
    const isUser = type === 'user'
    const title = isUser ? '用户协议' : '隐私政策'
    const content = isUser
      ? '本协议是您与「' + config.brand + '」就陪玩服务订立的约定。您应保证为年满18周岁的完全民事行为能力人；使用服务须遵守国家法律法规与平台规则，不得从事任何违法违规或影响他人体验的行为。'
      : '我们重视您的隐私保护，仅收集为您提供陪玩服务所必需的信息（如昵称、游戏ID、手机号），不会向任何第三方泄露您的个人信息；您可随时联系客服申请查看或删除。'
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  submit() {
    if (this.data.submitting) return
    if (!this.data.agree) {
      wx.showToast({ title: '请先勾选用户协议', icon: 'none' })
      return
    }
    // 手机号必填（身份唯一标识）
    const phone = (this.data.phone || '').trim()
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[0-9]{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确（11 位）', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    const payload = {
      nickname: this.data.nickname,
      gameId: this.data.gameId,
      phone: phone
    }
    userApi.login(payload).then(() => {
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        this.back()
      }, 600)
    }).catch(() => {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }).then(() => {
      this.setData({ submitting: false })
    })
  },

  /** 返回上一页；无上一页时退回首页 tab */
  back() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  }
})
