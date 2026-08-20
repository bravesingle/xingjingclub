<template>
  <div>
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <el-select
            v-model="query.status"
            placeholder="审核状态"
            style="width: 160px"
            @change="load"
          >
            <el-option
              v-for="opt in auditOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="query.keyword"
            placeholder="姓名 / 备注"
            clearable
            style="width: 240px"
            @keyup.enter="load"
            @clear="load"
          />
          <el-button type="primary" @click="load">查询</el-button>
        </div>
        <div class="toolbar-right">
          <el-button type="danger" plain :disabled="!selectedRows.length" v-if="isSuper" @click="onBatchRemove">
            批量删除{{ selectedRows.length ? '（' + selectedRows.length + '）' : '' }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">新增打手</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="姓名" width="130">
          <template #default="{ row }">
            <div class="booster-name">
              <el-avatar :size="28" class="avatar">{{ (row.name || '?').slice(0, 1) }}</el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="押金" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.deposited" type="success" size="small">已缴纳</el-tag>
            <el-tag v-else type="info" size="small">未缴纳</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="擅长分类" min-width="150">
          <template #default="{ row }">
            {{ (row.categoryNames || []).join('、') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="模式" width="110">
          <template #default="{ row }">{{ modeText(row.mode) }}</template>
        </el-table-column>
        <el-table-column prop="rank" label="段位" width="90" />
        <el-table-column prop="rating" label="评分" width="80" />
        <el-table-column prop="orderCount" label="累计接单" width="90" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="auditMeta(row.audit).type" size="small">
              {{ auditMeta(row.audit).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small" effect="plain">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接单中" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.accepting" type="warning" size="small" effect="plain">接单中</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <!-- 待审核 -->
            <template v-if="row.audit === 'pending'">
              <el-button link type="success" @click="audit(row, 'approve')">通过</el-button>
              <el-button link type="danger" @click="audit(row, 'reject')">驳回</el-button>
            </template>
            <!-- 已通过 -->
            <template v-else-if="row.audit === 'approved'">
              <el-button
                link
                :type="row.online ? 'warning' : 'success'"
                @click="toggleOnline(row)"
              >
                {{ row.online ? '下线' : '上线' }}
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="!row.online"
                @click="toggleAccepting(row)"
              >
                {{ row.accepting ? '停止接单' : '开始接单' }}
              </el-button>
            </template>
            <!-- 已驳回 -->
            <template v-else>
              <el-button link type="success" @click="audit(row, 'approve')">重新审核通过</el-button>
            </template>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" v-if="isSuper" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 / 编辑打手对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑打手' : '新增打手'"
      width="520px"
      @closed="resetForm"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item v-if="!isEdit" label="姓名" required>
          <el-input v-model="form.name" placeholder="请输入打手姓名" maxlength="20" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="手机号" required>
          <el-input v-model="form.phone" placeholder="请输入11位手机号（备案，用于登录身份）" maxlength="11" />
          <div v-if="phoneError" class="form-error">{{ phoneError }}</div>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="审核状态">
          <el-select v-model="form.audit" style="width: 100%">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过（立即生效）" value="approved" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="擅长分类">
          <el-select
            v-model="form.categories"
            multiple
            placeholder="请选择擅长分类"
            style="width: 100%"
          >
            <el-option
              v-for="opt in CATEGORY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="模式">
          <el-select v-model="form.mode" style="width: 100%">
            <el-option
              v-for="opt in MODE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="段位">
          <el-input v-model="form.rank" placeholder="如：少校" maxlength="10" />
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="form.rating" :min="0" :max="5" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { AUDIT_MAP, listBoosters, addBooster, updateBooster, removeBooster, batchRemoveBoosters } from '../api/booster'
import { authState } from '../stores/auth'

const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')
import { CATEGORY_OPTIONS, MODE_OPTIONS } from '../api/service'

const auditOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

const MODE_TEXT = { hazard: '烽火地带', warfare: '全面战场' }
function modeText(mode) {
  return MODE_TEXT[mode] || mode || '-'
}

const query = reactive({ status: 'all', keyword: '' })
const list = ref([])
const loading = ref(false)

function auditMeta(audit) {
  return AUDIT_MAP[audit] || { text: audit || '-', type: 'info' }
}

// 统一刷新函数
async function load() {
  loading.value = true
  try {
    list.value = await listBoosters({ status: query.status, keyword: query.keyword })
  } catch (e) {
    ElMessage.error(e.message || '加载打手列表失败')
  } finally {
    loading.value = false
  }
}

async function audit(row, action) {
  try {
    await updateBooster(row.id, { audit: action })
    ElMessage.success(action === 'approve' ? '已通过审核' : '已驳回')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function onRemove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除打手「${row.name}」吗？将解除其关联用户的打手身份，且不可恢复。`,
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
    await removeBooster(row.id)
    ElMessage.success('打手已删除')
    load()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

/* ============ 批量删除 ============ */
const selectedRows = ref([])
function onSelectionChange(rows) {
  selectedRows.value = rows
}
async function onBatchRemove() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要删除的打手')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 个打手吗？将解除关联用户的打手身份，且不可恢复。`,
      '批量删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' }
    )
  } catch (e) {
    return
  }
  try {
    await batchRemoveBoosters(selectedRows.value.map((r) => r.id))
    ElMessage.success('已删除')
    load()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function toggleOnline(row) {
  try {
    await updateBooster(row.id, { online: !row.online })
    ElMessage.success(row.online ? '已下线' : '已上线')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function toggleAccepting(row) {
  try {
    await updateBooster(row.id, { accepting: !row.accepting })
    ElMessage.success(row.accepting ? '已停止接单' : '已开始接单')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 新增 / 编辑表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const submitting = ref(false)
const phoneError = ref('')
const form = reactive({ name: '', phone: '', audit: 'pending', categories: [], mode: 'hazard', rank: '', rating: 5, remark: '' })

function openAdd() {
  isEdit.value = false
  phoneError.value = ''
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.rank = row.rank
  form.rating = row.rating
  form.remark = row.remark
  dialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.phone = ''
  form.audit = 'pending'
  form.categories = []
  form.mode = 'hazard'
  form.rank = ''
  form.rating = 5
  form.remark = ''
  phoneError.value = ''
  editId.value = ''
}

async function submitForm() {
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateBooster(editId.value, { rank: form.rank, rating: form.rating, remark: form.remark })
      ElMessage.success('已保存')
    } else {
      if (!form.name.trim()) {
        ElMessage.warning('请填写打手姓名')
        return
      }
      // 手机号必填校验（11 位）
      if (!form.phone.trim()) {
        phoneError.value = '手机号不能为空'
        ElMessage.warning('请填写打手手机号（登录身份备案）')
        return
      }
      if (!/^1[0-9]{10}$/.test(form.phone.trim())) {
        phoneError.value = '手机号格式不正确（11 位）'
        return
      }
      phoneError.value = ''
      const categoryNames = form.categories.map((v) => {
        const opt = CATEGORY_OPTIONS.find((o) => o.value === v)
        return opt ? opt.label : v
      })
      await addBooster({
        name: form.name.trim(),
        phone: form.phone.trim(),
        audit: form.audit,
        categories: form.categories,
        categoryNames,
        mode: form.mode,
        rank: form.rank,
        rating: form.rating,
        remark: form.remark
      })
      ElMessage.success('已新增打手')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.booster-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
.booster-name .avatar {
  background: #3a5bff;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}
.form-error {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.4;
}
</style>
