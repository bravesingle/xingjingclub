<template>
  <div>
    <!-- 平台抽成账户 -->
    <div class="page-card">
      <div class="platform-row">
        <div class="platform-item">
          <div class="platform-label">平台抽成总收入</div>
          <div class="platform-value">¥{{ fenToYuan(platform.total) }}</div>
        </div>
        <div class="platform-item">
          <div class="platform-label">抽成订单数</div>
          <div class="platform-value">{{ platform.orderCount }}</div>
        </div>
      </div>
    </div>

    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <span class="page-title">提现审核</span>
          <el-select v-model="queryStatus" style="width: 150px" @change="load">
            <el-option label="全部" value="all" />
            <el-option label="待审核" value="pending" />
            <el-option label="已打款" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="load">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="打手" width="140">
          <template #default="{ row }">{{ row.boosterName || '-' }}</template>
        </el-table-column>
        <el-table-column label="提现金额" width="140">
          <template #default="{ row }">¥{{ fenToYuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="渠道" width="100">
          <template #default="{ row }">{{ channelText(row.channel) }}</template>
        </el-table-column>
        <el-table-column prop="account" label="收款账号" min-width="140">
          <template #default="{ row }">{{ row.account || '-' }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="{ row }">{{ formatTime(row.appliedAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button link type="success" @click="onApprove(row)">打款</el-button>
              <el-button link type="danger" @click="onReject(row)">驳回</el-button>
            </template>
            <span v-else class="text-dim">{{ row.rejectReason || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 押金记录 -->
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <span class="page-title">押金记录（{{ deposits.length }}）</span>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="load">刷新</el-button>
        </div>
      </div>
      <el-table :data="deposits" stripe>
        <el-table-column label="打手" width="140">
          <template #default="{ row }">{{ row.boosterName || '-' }}</template>
        </el-table-column>
        <el-table-column label="押金金额" width="140">
          <template #default="{ row }">¥{{ fenToYuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="depositStatusMeta(row.status).type" size="small">
              {{ depositStatusMeta(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="缴纳时间" width="160">
          <template #default="{ row }">{{ formatTime(row.paidAt) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 激活码管理 -->
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <span class="page-title">激活码</span>
          <el-input-number v-model="codeAmountYuan" :min="1" :step="10" />
          <span class="text-dim">元 ×</span>
          <el-input-number v-model="codeCount" :min="1" :max="100" />
          <span class="text-dim">个</span>
          <el-button type="primary" @click="onGenerateCodes">生成激活码</el-button>
          <el-select v-model="codeStatus" style="width: 130px; margin-left: 12px" @change="loadCodes">
            <el-option label="全部" value="all" />
            <el-option label="未使用" value="unused" />
            <el-option label="已使用" value="used" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="loadCodes">刷新</el-button>
        </div>
      </div>
      <el-table :data="codes" stripe>
        <el-table-column prop="code" label="激活码" min-width="160" />
        <el-table-column label="面额" width="120">
          <template #default="{ row }">¥{{ fenToYuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'unused' ? 'success' : 'info'" size="small">
              {{ row.status === 'unused' ? '未使用' : '已使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核销用户" width="140">
          <template #default="{ row }">{{ row.usedByName || '-' }}</template>
        </el-table-column>
        <el-table-column label="使用时间" width="160">
          <template #default="{ row }">{{ formatTime(row.usedAt) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { listWithdrawals, approveWithdrawal, rejectWithdrawal, listDeposits, generateCodes, listCodes, platformStats } from '../api/fund'
import { fenToYuan, formatTime } from '../api/base'

const loading = ref(false)
const list = ref([])
const deposits = ref([])
const codes = ref([])
const platform = ref({ total: 0, orderCount: 0 })
const queryStatus = ref('all')
const codeAmountYuan = ref(10)
const codeCount = ref(1)
const codeStatus = ref('all')

const STATUS_META = {
  pending: { text: '待审核', type: 'warning' },
  approved: { text: '已打款', type: 'success' },
  rejected: { text: '已驳回', type: 'danger' }
}

const DEPOSIT_STATUS_META = {
  pending: { text: '待支付', type: 'warning' },
  paid: { text: '已缴纳', type: 'success' },
  refunded: { text: '已退还', type: 'info' }
}

function depositStatusMeta(s) {
  return DEPOSIT_STATUS_META[s] || { text: s || '-', type: 'info' }
}

function statusMeta(s) {
  return STATUS_META[s] || { text: s, type: 'info' }
}

function channelText(c) {
  return { wechat: '微信', alipay: '支付宝', bank: '银行卡' }[c] || c
}

async function load() {
  loading.value = true
  try {
    const [wd, dp, ps] = await Promise.all([
      listWithdrawals(queryStatus.value),
      listDeposits(),
      platformStats()
    ])
    list.value = wd
    deposits.value = dp
    platform.value = ps
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
  loadCodes()
}

async function loadCodes() {
  try {
    codes.value = await listCodes(codeStatus.value)
  } catch (e) {
    ElMessage.error(e.message || '加载激活码失败')
  }
}

async function onGenerateCodes() {
  if (!codeAmountYuan.value || !codeCount.value) {
    ElMessage.warning('请填写面额和数量')
    return
  }
  try {
    await generateCodes(Math.round(codeAmountYuan.value * 100), codeCount.value)
    ElMessage.success(`已生成 ${codeCount.value} 个激活码`)
    loadCodes()
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  }
}

async function onApprove(row) {
  try {
    await ElMessageBox.confirm(`确认向「${row.boosterName}」打款 ¥${fenToYuan(row.amount)}？`, '打款确认', {
      confirmButtonText: '确认打款',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await approveWithdrawal(row.id)
    ElMessage.success('已打款')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function onReject(row) {
  let reason = ''
  try {
    const r = await ElMessageBox.prompt('请输入驳回原因', '驳回提现', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '驳回原因'
    })
    reason = r.value || '驳回'
  } catch (e) {
    return
  }
  try {
    await rejectWithdrawal(row.id, reason)
    ElMessage.success('已驳回')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}
.text-dim {
  color: #909399;
  font-size: 13px;
}
.platform-row {
  display: flex;
  gap: 40px;
}
.platform-item {
  flex: 1;
}
.platform-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}
.platform-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffa940;
}
</style>
