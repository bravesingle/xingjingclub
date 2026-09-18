<template>
  <div>
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <el-select
            v-model="query.status"
            placeholder="订单状态"
            style="width: 160px"
            @change="load"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="query.keyword"
            placeholder="单号 / 服务 / 玩家"
            clearable
            style="width: 240px"
            @keyup.enter="load"
            @clear="load"
          />
          <el-button type="primary" @click="load">查询</el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="load">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="150" />
        <el-table-column label="玩家" width="120">
          <template #default="{ row }">{{ row.userName || '-' }}</template>
        </el-table-column>
        <el-table-column label="打手" width="120">
          <template #default="{ row }">
            <span v-if="row.serveBy" class="text-main">{{ row.serveBy }}</span>
            <el-tag v-else type="warning" size="small" effect="plain">待接单</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="服务" min-width="200">
          <template #default="{ row }">
            <div class="svc-main">{{ row.serviceTitle }}</div>
            <div class="svc-sub">{{ row.specLabel }} × {{ row.quantity }}</div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">¥{{ fenToYuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="平台抽成" width="110">
          <template #default="{ row }">
            <span class="rate-text">{{ row.platformRate || 0 }}%</span>
            <span class="svc-sub">¥{{ fenToYuan(row.platformIncome) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打手收入" width="110">
          <template #default="{ row }">
            <span class="income-text">¥{{ fenToYuan(row.boosterIncome) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">
              {{ statusMeta(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="订单详情" size="480px">
      <div v-if="detail" class="drawer-body">
        <!-- 服务信息摘要 -->
        <div class="service-summary">
          <div class="cover-block" :style="{ background: detail.coverGradient }">
            {{ detail.coverText }}
          </div>
          <div class="summary-info">
            <div class="svc-title">{{ detail.serviceTitle }}</div>
            <div class="svc-spec">{{ detail.specLabel }} × {{ detail.quantity }}</div>
          </div>
        </div>

        <el-descriptions :column="1" border class="order-desc">
          <el-description-item label="订单号">{{ detail.orderNo }}</el-description-item>
          <el-description-item label="状态">
            <el-tag :type="statusMeta(detail.status).type" size="small">
              {{ statusMeta(detail.status).text }}
            </el-tag>
          </el-description-item>
          <el-description-item label="玩家">{{ detail.userName || '-' }}</el-description-item>
          <el-description-item label="服务">{{ detail.serviceTitle }}</el-description-item>
          <el-description-item label="规格数量">
            {{ detail.specLabel }} × {{ detail.quantity }}
          </el-description-item>
          <el-description-item label="单价">¥{{ fenToYuan(detail.unitPrice) }}</el-description-item>
          <el-description-item label="金额">¥{{ fenToYuan(detail.amount) }}</el-description-item>
          <el-description-item label="抽成比例">{{ detail.platformRate || 0 }}%</el-description-item>
          <el-description-item label="平台抽成">¥{{ fenToYuan(detail.platformIncome) }}</el-description-item>
          <el-description-item label="打手收入">¥{{ fenToYuan(detail.boosterIncome) }}</el-description-item>
          <el-description-item label="下单时间">{{ formatTime(detail.createdAt) }}</el-description-item>
          <el-description-item v-if="detail.paidAt" label="支付时间">
            {{ formatTime(detail.paidAt) }}
          </el-description-item>
          <el-description-item label="开始时间">{{ formatTime(detail.startedAt) }}</el-description-item>
          <el-description-item label="完成时间">{{ formatTime(detail.completedAt) }}</el-description-item>
          <el-description-item v-if="detail.refundReason" label="退款原因">
            {{ detail.refundReason }}
          </el-description-item>
          <el-description-item label="申请退款前状态">
            {{ detail.refundFrom || '-' }}
          </el-description-item>
          <el-description-item label="备注">{{ detail.remark || '-' }}</el-description-item>
        </el-descriptions>

        <!-- 聊天记录（后台只读查看） -->
        <div class="chat-section">
          <div class="chat-title">订单聊天记录（{{ chatList.length }}）</div>
          <div v-if="!chatList.length" class="chat-empty">暂无聊天记录</div>
          <div v-for="m in chatList" :key="m.id" class="chat-item" :class="{ 'chat-booster': m.senderRole === 'booster' }">
            <div class="chat-meta">
              <span class="chat-role">
                {{ m.senderRole === 'booster' ? '打手' : '玩家' }} · {{ m.senderName || '-' }}
              </span>
              <span class="chat-time">{{ formatTime(m.sentAt) }}</span>
            </div>
            <div class="chat-content">{{ m.content }}</div>
          </div>
        </div>

        <div class="drawer-actions">
          <template v-if="drawerActions && drawerActions.length">
            <el-button
              v-for="btn in drawerActions"
              :key="btn.action"
              :type="btn.type"
              :plain="!!btn.plain"
              @click="handleAction(btn.action)"
            >
              {{ btn.label }}
            </el-button>
          </template>
          <span v-else class="no-action">当前状态无可用操作</span>
          <el-button v-if="isSuper" type="warning" plain @click="onEditRate">修改抽成</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { ORDER_STATUS_MAP, listOrders, getOrder, updateOrderStatus, updateOrderRate } from '../api/order'
import { getChatHistory } from '../api/chat'
import { fenToYuan, formatTime } from '../api/base'
import { authState } from '../stores/auth'

const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')

// 状态筛选选项：全部 + 7 个状态
const statusOptions = [
  { value: 'all', label: '全部' },
  ...Object.entries(ORDER_STATUS_MAP).map(([value, meta]) => ({ value, label: meta.text }))
]

const query = reactive({ status: 'all', keyword: '' })
const list = ref([])
const loading = ref(false)

// 抽屉内按状态显示的操作按钮
const DRAWER_ACTIONS = {
  pending_pay: [{ label: '取消订单', type: 'danger', plain: true, action: 'cancel' }],
  paid: [
    { label: '开始服务', type: 'success', action: 'start' },
    { label: '取消并退款', type: 'danger', plain: true, action: 'cancel' }
  ],
  in_progress: [{ label: '标记完成', type: 'success', action: 'complete' }],
  refunding: [
    { label: '同意退款', type: 'success', action: 'approve_refund' },
    { label: '驳回退款', type: 'danger', plain: true, action: 'reject_refund' }
  ]
}

const drawerVisible = ref(false)
const detail = ref(null)
const chatList = ref([])
const drawerActions = computed(() =>
  detail.value ? DRAWER_ACTIONS[detail.value.status] || null : null
)

function statusMeta(status) {
  return ORDER_STATUS_MAP[status] || { text: status || '-', type: 'info' }
}

// 统一刷新函数：筛选变化时重新拉取列表
async function load() {
  loading.value = true
  try {
    list.value = await listOrders({ status: query.status, keyword: query.keyword })
  } catch (e) {
    ElMessage.error(e.message || '加载订单失败')
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  drawerVisible.value = true
  chatList.value = []
  try {
    detail.value = await getOrder(row.id)
    chatList.value = await getChatHistory(row.id)
  } catch (e) {
    ElMessage.error(e.message || '加载订单详情失败')
  }
}

async function handleAction(action) {
  try {
    await updateOrderStatus(detail.value.id, action)
    ElMessage.success('操作成功')
    // 刷新抽屉内数据 + 列表
    detail.value = await getOrder(detail.value.id)
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function onEditRate() {
  let rate = ''
  try {
    const r = await ElMessageBox.prompt(
      `修改该单抽成比例（%，当前 ${detail.value.platformRate || 0}%）`,
      '修改抽成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '0-100，如 20 表示平台抽 20%'
      }
    )
    rate = r.value
  } catch (e) {
    return
  }
  const num = Number(rate)
  if (isNaN(num) || num < 0 || num > 100) {
    ElMessage.warning('请输入 0-100 之间的比例')
    return
  }
  try {
    detail.value = await updateOrderRate(detail.value.id, Math.round(num))
    ElMessage.success('抽成已更新')
    load()
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  }
}

onMounted(load)
</script>

<style scoped>
.svc-main {
  color: #303133;
}
.svc-sub {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}
.rate-text {
  color: #ffa940;
  font-weight: 600;
  margin-right: 6px;
}
.income-text {
  color: #2ecc71;
  font-weight: 600;
}
.service-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}
.summary-info .svc-title {
  font-weight: 600;
  color: #303133;
}
.summary-info .svc-spec {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
.drawer-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}
.no-action {
  color: #909399;
  font-size: 13px;
}
.chat-section {
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}
.chat-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.chat-empty {
  color: #909399;
  font-size: 13px;
}
.chat-item {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.chat-item.chat-booster {
  background: #ecf5ff;
}
.chat-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.chat-role {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
}
.chat-time {
  font-size: 12px;
  color: #909399;
}
.chat-content {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}
</style>
