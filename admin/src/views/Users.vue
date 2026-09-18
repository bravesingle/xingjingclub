<template>
  <div class="users-page">
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <span class="page-title">用户（共 {{ users.length }} 个）</span>
          <el-input
            v-model="keywordInput"
            placeholder="搜索昵称/游戏ID"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" plain :icon="Search" @click="handleSearch">搜索</el-button>
        </div>
        <div class="toolbar-right">
          <el-button type="danger" plain :disabled="!selectedRows.length" v-if="isSuper" @click="onBatchRemove">
            批量删除{{ selectedRows.length ? '（' + selectedRows.length + '）' : '' }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">新增用户</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="users" stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="昵称" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar v-if="row.avatar" :src="row.avatar" :size="32" />
              <el-avatar v-else :size="32">{{ row.nickname.slice(0, 1) }}</el-avatar>
              <span class="user-name">{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="游戏ID" min-width="140">
          <template #default="{ row }">{{ row.gameId || '-' }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="OpenID" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.openid" class="openid-cell">{{ row.openid }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="90">
          <template #default="{ row }">Lv{{ row.level }}</template>
        </el-table-column>
        <el-table-column label="VIP" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.vip" type="warning">VIP</el-tag>
            <span v-else class="plain-text">普通</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">{{ formatTime(row.registeredAt) }}</template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="90" />
        <el-table-column label="累计消费" width="110">
          <template #default="{ row }">¥{{ fenToYuan(row.totalSpend) }}</template>
        </el-table-column>
        <el-table-column label="余额" width="110">
          <template #default="{ row }">
            <span class="balance-cell">¥{{ fenToYuan(row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.banned" type="danger">已封禁</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.banned" link type="success" @click="onToggleBan(row)">解封</el-button>
            <el-button v-else link type="danger" @click="onToggleBan(row)">封禁</el-button>
            <el-button link type="primary" @click="onRecharge(row)">加余额</el-button>
            <el-button link type="danger" v-if="isSuper" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增用户" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入用户昵称" maxlength="20" />
        </el-form-item>
        <el-form-item label="游戏ID" prop="gameId">
          <el-input v-model="form.gameId" placeholder="请输入游戏ID" maxlength="30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { listUsers, toggleBan, removeUser, batchRemoveUsers, addUser } from '../api/user'
import { adminRechargeUser } from '../api/fund'
import { authState } from '../stores/auth'

const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')
import { fenToYuan, formatTime } from '../api/base'

const loading = ref(false)
const users = ref([])

/* ============ 搜索（接口侧过滤昵称/游戏ID） ============ */
const keywordInput = ref('')
const keyword = ref('')

function handleSearch() {
  keyword.value = keywordInput.value.trim()
  fetchList()
}

/* ============ 列表 ============ */
async function fetchList() {
  loading.value = true
  try {
    users.value = await listUsers({ keyword: keyword.value })
  } finally {
    loading.value = false
  }
}

/* ============ 新增用户弹窗 ============ */
const dialogVisible = ref(false)
const formRef = ref(null)
const saving = ref(false)
const form = reactive({ nickname: '', gameId: '' })

const rules = {
  nickname: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }]
}

function openAdd() {
  form.nickname = ''
  form.gameId = ''
  dialogVisible.value = true
}

async function onSave() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  saving.value = true
  try {
    await addUser({ nickname: form.nickname.trim(), gameId: form.gameId.trim() })
    ElMessage.success('用户已创建')
    dialogVisible.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    saving.value = false
  }
}

/* ============ 封禁 / 解封 ============ */
async function onToggleBan(row) {
  const action = row.banned ? '解封' : '封禁'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.nickname}」吗？`, '提示', {
      confirmButtonText: action,
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await toggleBan(row.id)
    ElMessage.success(action === '封禁' ? '已封禁' : '已解封')
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

/* ============ 删除用户 ============ */
async function onRemove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.nickname}」吗？将同时删除其全部订单，且不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
  } catch (e) {
    return
  }
  try {
    await removeUser(row.id)
    ElMessage.success('用户已删除')
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

/* ============ 加余额 ============ */
async function onRecharge(row) {
  let amount = ''
  try {
    const r = await ElMessageBox.prompt(`给用户「${row.nickname}」加余额（元）`, '加余额', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入金额（元）'
    })
    amount = r.value
  } catch (e) {
    return
  }
  const yuan = parseFloat(amount)
  if (isNaN(yuan) || yuan <= 0) {
    ElMessage.warning('金额无效')
    return
  }
  try {
    await adminRechargeUser(row.id, Math.round(yuan * 100))
    ElMessage.success('已加余额')
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

/* ============ 批量删除 ============ */
const selectedRows = ref([])
function onSelectionChange(rows) {
  selectedRows.value = rows
}
async function onBatchRemove() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要删除的用户')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 个用户吗？将同时删除其全部订单，且不可恢复。`,
      '批量删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' }
    )
  } catch (e) {
    return
  }
  try {
    await batchRemoveUsers(selectedRows.value.map((r) => r.id))
    ElMessage.success('已删除')
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-name {
  color: #303133;
}
.plain-text {
  color: #909399;
}
</style>
