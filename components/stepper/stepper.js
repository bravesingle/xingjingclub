// components/stepper/stepper.js
// 数量步进器：props value/min/max/step，事件 change -> { value }
Component({
  properties: {
    value: { type: Number, value: 1 },
    min: { type: Number, value: 1 },
    max: { type: Number, value: 99 },
    step: { type: Number, value: 1 }
  },
  methods: {
    onMinus() {
      if (this.data.value > this.data.min) {
        this._emit(this.data.value - this.data.step)
      }
    },
    onPlus() {
      if (this.data.value < this.data.max) {
        this._emit(this.data.value + this.data.step)
      }
    },
    _emit(value) {
      this.triggerEvent('change', { value: value })
    }
  }
})
