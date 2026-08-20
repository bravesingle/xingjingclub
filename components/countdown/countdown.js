// components/countdown/countdown.js
// 倒计时组件：传入结束时间戳 endTime，显示 mm:ss，归零触发 finish 事件
Component({
  properties: {
    endTime: { type: Number, value: 0 }
  },
  data: {
    text: '00:00'
  },
  observers: {
    endTime(v) {
      if (v) this.start(v)
    }
  },
  lifetimes: {
    detached() {
      this.stop()
    }
  },
  methods: {
    start(end) {
      this.stop()
      const tick = () => {
        const remain = Math.max(0, Math.floor((end - Date.now()) / 1000))
        const mm = this._pad(Math.floor(remain / 60))
        const ss = this._pad(remain % 60)
        this.setData({ text: mm + ':' + ss })
        if (remain <= 0) {
          this.stop()
          this.triggerEvent('finish')
        }
      }
      tick()
      this._timer = setInterval(tick, 1000)
    },
    stop() {
      if (this._timer) {
        clearInterval(this._timer)
        this._timer = null
      }
    },
    _pad(n) {
      return n < 10 ? '0' + n : '' + n
    }
  }
})
