<template>
  <div>
    <div class="page-card">
      <el-form :model="form" label-width="120px" class="settings-form">
        <el-form-item label="客服微信">
          <el-input
            v-model="form.customerServiceWechat"
            placeholder="请输入客服微信号"
            clearable
          />
        </el-form-item>
        <el-form-item label="平台公告">
          <el-input v-model="form.notice" type="textarea" :rows="3" placeholder="平台公告内容" />
        </el-form-item>
        <el-form-item label="支付超时（分钟）">
          <el-input-number v-model="form.payTimeoutMinutes" :min="5" :max="120" />
        </el-form-item>
        <el-form-item label="是否开放下单">
          <el-switch v-model="form.orderOpen" />
        </el-form-item>
        <el-form-item label="微信支付">
          <el-switch v-model="form.payWechat" />
        </el-form-item>
        <el-form-item label="余额支付">
          <el-switch v-model="form.payBalance" />
          <el-tag size="small" type="info" effect="plain" class="reserved-tag">预留</el-tag>
        </el-form-item>
        <el-divider content-position="left">打手资金</el-divider>
        <el-form-item label="打手押金（元）">
          <el-input-number v-model="form.depositAmountYuan" :min="0" :step="10" />
          <span class="form-tip">打手交押金后才能接单/提现</span>
        </el-form-item>
        <el-form-item label="平台抽成（%）">
          <el-input-number v-model="form.platformRate" :min="0" :max="100" :step="1" />
          <span class="form-tip">打手收入 = 订单金额 × (100 - 抽成) / 100</span>
        </el-form-item>
        <el-form-item label="结算延迟（天）">
          <el-input-number v-model="form.settlementDays" :min="0" :max="30" :step="1" />
          <span class="form-tip">订单完成后 N 天收入解冻可提现（T+N）</span>
        </el-form-item>
        <el-form-item>
          <el-button v-if="isSuper" type="primary" :loading="saving" @click="save">保存设置</el-button>
          <el-tag v-else type="info" size="small">仅超级管理员可修改设置</el-tag>
        </el-form-item>
      </el-form>
    </div>

    <!-- 危险操作区 -->
    <div class="page-card danger-card">
      <div class="danger-title">危险操作</div>
      <div class="danger-desc">重置为种子数据将清空所有本地演示数据</div>
      <el-button v-if="isSuper" type="danger" plain @click="resetData">重置数据</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSettings, updateSettings, resetAllData } from '../api/settings'
import { authState } from '../stores/auth'

const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')

const form = reactive({
  customerServiceWechat: '',
  notice: '',
  payTimeoutMinutes: 15,
  orderOpen: true,
  payWechat: true,
  payBalance: false,
  depositAmountYuan: 200,
  platformRate: 0,
  settlementDays: 3
})

const saving = ref(false)

async function load() {
  try {
    const s = await getSettings()
    Object.assign(form, s, {
      // 押金后端存"分"，前端显示"元"
      depositAmountYuan: Math.round((s.depositAmount || 0) / 100)
    })
  } catch (e) {
    ElMessage.error(e.message || '加载设置失败')
  }
}

async function save() {
  saving.value = true
  try {
    await updateSettings({
      customerServiceWechat: form.customerServiceWechat,
      notice: form.notice,
      payTimeoutMinutes: form.payTimeoutMinutes,
      orderOpen: form.orderOpen,
      payWechat: form.payWechat,
      payBalance: form.payBalance,
      // 押金元 → 分
      depositAmount: Math.round((form.depositAmountYuan || 0) * 100),
      platformRate: form.platformRate,
      settlementDays: form.settlementDays
    })
    ElMessage.success('设置已保存')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function resetData() {
  try {
    await ElMessageBox.confirm(
      '重置为种子数据将清空所有本地演示数据，确定继续吗？',
      '危险操作',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    // 用户取消
    return
  }
  try {
    await resetAllData()
    ElMessage.success('已重置为种子数据')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '重置失败')
  }
}

onMounted(load)
</script>

<style scoped>
.settings-form {
  max-width: 640px;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.reserved-tag {
  margin-left: 8px;
}
.danger-card {
  border: 1px solid #fde2e2;
  border-bottom: 4px solid #f56c6c;
}
.danger-title {
  font-size: 15px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 6px;
}
.danger-desc {
  color: #909399;
  font-size: 13px;
  margin-bottom: 14px;
}
</style>
