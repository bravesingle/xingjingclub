<template>
  <div v-loading="loading" class="dashboard">
    <!-- 顶部工具栏：标题 + 刷新 -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <span class="page-title">数据统计看板</span>
        <el-tag type="info" effect="plain" size="small">本地演示数据</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button type="warning" plain :icon="Refresh" :loading="loading" @click="load">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- ① 统计卡片行 -->
    <div class="page-card stat-row">
      <el-row :gutter="16">
        <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="6" :md="3">
          <div class="stat-card" :class="{ danger: card.danger }">
            <div class="stat-icon" :style="{ background: card.color }">
              <el-icon :size="20"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- ② 趋势图 + 状态分布 -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <div class="page-card">
          <div class="card-title">近14天支付订单趋势</div>
          <div ref="trendRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :xs="24" :md="10">
        <div class="page-card">
          <div class="card-title">订单状态分布</div>
          <div ref="pieRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ③ 打手概览 -->
    <div class="page-card">
      <div class="card-title">打手概览</div>
      <div class="booster-row">
        <div v-for="item in boosterCards" :key="item.label" class="booster-item">
          <el-statistic :title="item.label" :value="item.value" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Refresh,
  Calendar,
  Money,
  Tickets,
  Wallet,
  RefreshLeft,
  VideoPlay,
  User,
  Avatar
} from '@element-plus/icons-vue'
import { orderStats } from '../api/order'
import { fenToYuan } from '../api/base'

const loading = ref(false)
const stats = ref({})

// ---------- ① 统计卡片 ----------
const statCards = computed(() => {
  const s = stats.value || {}
  return [
    { label: '今日订单', value: s.todayOrders ?? 0, icon: Calendar, color: '#4D7CFF' },
    { label: '今日销售额', value: '¥' + fenToYuan(s.todayAmount), icon: Money, color: '#2ECC71' },
    { label: '订单总数', value: s.totalOrders ?? 0, icon: Tickets, color: '#7B5CFF' },
    { label: '总销售额', value: '¥' + fenToYuan(s.totalAmount), icon: Wallet, color: '#FFD34D' },
    { label: '待处理退款', value: s.refunding ?? 0, icon: RefreshLeft, color: '#F56C6C', danger: true },
    { label: '服务中订单', value: s.inProgress ?? 0, icon: VideoPlay, color: '#409EFF' },
    { label: '注册用户', value: s.totalUsers ?? 0, icon: User, color: '#E6A23C' },
    { label: '打手在线', value: s.onlineBoosters ?? 0, icon: Avatar, color: '#00B578' }
  ]
})

// ---------- ③ 打手概览 ----------
const boosterCards = computed(() => {
  const s = stats.value || {}
  return [
    { label: '打手总数', value: s.boosterTotal ?? 0 },
    { label: '待审核', value: s.boosterPending ?? 0 },
    { label: '在线', value: s.boosterOnline ?? 0 },
    { label: '接单中', value: s.boosterAccepting ?? 0 },
    { label: '累计接单', value: s.boosterOrders ?? 0 }
  ]
})

// ---------- ② 图表 ----------
const trendRef = ref(null)
const trendChart = ref(null)
const pieRef = ref(null)
const pieChart = ref(null)

const STATUS_META = {
  pending_pay: { name: '待支付', color: '#FF9F43' },
  paid: { name: '已支付', color: '#4D7CFF' },
  in_progress: { name: '服务中', color: '#7B5CFF' },
  completed: { name: '已完成', color: '#2ECC71' },
  cancelled: { name: '已取消', color: '#8a93ab' },
  refunding: { name: '退款中', color: '#FF9F43' },
  refunded: { name: '已退款', color: '#c0c4cc' }
}

function renderTrend() {
  if (!trendChart.value) trendChart.value = echarts.init(trendRef.value)
  const trend = (stats.value.trend || []).map((t) => ({
    date: t.date,
    count: t.count,
    amount: Number((t.amount / 100).toFixed(2)) // 分 -> 元
  }))
  trendChart.value.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '销售额(元)'], top: 0 },
    grid: { left: 52, right: 64, top: 36, bottom: 30 },
    xAxis: { type: 'category', data: trend.map((t) => t.date), boundaryGap: false },
    yAxis: [
      { type: 'value', name: '订单数', minInterval: 1, splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: '销售额(元)', splitLine: { show: false } }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: trend.map((t) => t.count),
        itemStyle: { color: '#4D7CFF' },
        areaStyle: { color: 'rgba(77, 124, 255, 0.12)' }
      },
      {
        name: '销售额(元)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trend.map((t) => t.amount),
        itemStyle: { color: '#FFD34D' },
        areaStyle: { color: 'rgba(255, 211, 77, 0.12)' }
      }
    ]
  })
}

function renderPie() {
  if (!pieChart.value) pieChart.value = echarts.init(pieRef.value)
  const dist = stats.value.statusDist || {}
  const data = Object.keys(STATUS_META)
    .filter((k) => (dist[k] || 0) > 0)
    .map((k) => ({
      name: STATUS_META[k].name,
      value: dist[k],
      itemStyle: { color: STATUS_META[k].color }
    }))
  pieChart.value.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 单（{d}%）' },
    legend: { bottom: 0, icon: 'circle' },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '44%'],
        data,
        label: { formatter: '{b} {c}' }
      }
    ]
  })
}

function onResize() {
  trendChart.value && trendChart.value.resize()
  pieChart.value && pieChart.value.resize()
}

// ---------- 数据加载 ----------
async function load() {
  loading.value = true
  try {
    stats.value = await orderStats()
    // 数据到达后容器一定存在，nextTick 确保 DOM 更新后再 init
    await nextTick()
    renderTrend()
    renderPie()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  trendChart.value && trendChart.value.dispose()
  pieChart.value && pieChart.value.dispose()
  trendChart.value = null
  pieChart.value = null
})
</script>

<style scoped>
.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

/* 统计卡片 */
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border-radius: 8px;
  background: #f8f9fc;
  margin-bottom: 16px;
}

.stat-card.danger {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.stat-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  white-space: nowrap;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-label {
  font-size: 12px;
  color: #8a93ab;
  margin-top: 2px;
  white-space: nowrap;
}

/* 图表 */
.chart-box {
  width: 100%;
  height: 320px;
}

/* 打手概览 */
.booster-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.booster-item {
  flex: 1 1 140px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fc;
  text-align: center;
}
</style>
