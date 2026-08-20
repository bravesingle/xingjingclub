<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <div class="logo-mark">星</div>
        <div>
          <div class="logo-name">星竞电竞</div>
          <div class="logo-sub">管理控制台</div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2430"
        text-color="#aab2c8"
        active-text-color="#ffd34d"
        class="menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon><span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/services">
          <el-icon><Goods /></el-icon><span>服务商品</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon><span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon><span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/boosters">
          <el-icon><Medal /></el-icon><span>打手管理</span>
        </el-menu-item>
        <el-menu-item index="/withdrawals">
          <el-icon><Money /></el-icon><span>提现审核</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon><span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <el-tag type="warning" effect="plain" size="small">本地演示数据</el-tag>
          <span class="admin-name">{{ adminName }}</span>
          <el-tag v-if="isSuper" type="danger" size="small">超级管理员</el-tag>
          <el-tag v-else type="info" size="small">运营管理员</el-tag>
          <el-button link type="danger" @click="onLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { DataLine, Goods, Tickets, User, Medal, Setting, Money } from '@element-plus/icons-vue'
import { authState, logout } from '../stores/auth'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => (route.meta && route.meta.title) || '管理控制台')
const adminName = computed(() => (authState.user && authState.user.name) || '管理员')
const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')

function onLogout() {
  ElMessageBox.confirm('确定退出登录吗？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}
.aside {
  background: #1f2430;
  overflow-x: hidden;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffd34d, #ffa940);
  color: #3a2e00;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.logo-sub {
  color: #8a93ab;
  font-size: 12px;
}
.menu {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.admin-name {
  color: #303133;
  font-size: 14px;
}
.main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
