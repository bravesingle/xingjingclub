<template>
  <div class="services-page">
    <div class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <span class="page-title">服务商品（共 {{ filteredList.length }} 个）</span>
          <el-input
            v-model="keywordInput"
            placeholder="搜索服务标题/副标题"
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
          <el-button type="primary" :icon="Plus" @click="openAdd">新增服务</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredList" stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="封面" width="90">
          <template #default="{ row }">
            <img v-if="row.cover" :src="coverUrl(row.cover)" class="cover-img" />
            <span v-else class="cover-block" :style="{ background: row.coverGradient }">{{ row.coverText }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="220">
          <template #default="{ row }">
            <div class="svc-title">{{ row.title }}</div>
            <div v-if="row.subtitle" class="svc-subtitle">{{ row.subtitle }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="modeName" label="模式" width="100" />
        <el-table-column label="计价方式" width="90">
          <template #default="{ row }">
            {{ row.priceUnit === 'hour' ? '按小时' : '按局' }}
          </template>
        </el-table-column>
        <el-table-column label="起步价" width="110">
          <template #default="{ row }">
            ¥{{ fenToYuan(row.basePrice) }}/{{ row.unitName }}
          </template>
        </el-table-column>
        <el-table-column label="规格数" width="80">
          <template #default="{ row }">{{ (row.specs || []).length }}</template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="rating" label="评分" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isOnSale" type="success">上架</el-tag>
            <el-tag v-else type="info">下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.isOnSale" link type="warning" @click="onToggle(row)">下架</el-button>
            <el-button v-else link type="success" @click="onToggle(row)">上架</el-button>
            <el-button link type="danger" v-if="isSuper" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增服务' : '编辑服务'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="服务标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入服务标题" maxlength="30" />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="form.subtitle" placeholder="请输入副标题（选填）" maxlength="40" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="o in CATEGORY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="模式" prop="mode">
          <el-select v-model="form.mode" placeholder="请选择模式" style="width: 100%">
            <el-option v-for="o in MODE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计价方式" prop="priceUnit">
          <el-radio-group v-model="form.priceUnit">
            <el-radio value="hour">按小时</el-radio>
            <el-radio value="match">按局</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="起步价" prop="basePrice">
          <el-input-number v-model="form.basePrice" :min="100" :step="100" :precision="0" style="width: 200px" />
          <div class="form-tip">单位：分，如 3000 = ¥30</div>
        </el-form-item>
        <el-form-item v-if="specsWillRegenerate" label="规格提示">
          <el-alert type="warning" :closable="false" title="保存后将按折扣规则重新生成规格" />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="多个标签用英文逗号分隔，如：高胜率,语音带飞" />
        </el-form-item>
        <el-form-item label="封面文字" prop="coverText">
          <el-input v-model="form.coverText" placeholder="封面色块上的文字（选填）" maxlength="6" />
        </el-form-item>
        <el-form-item label="封面图片">
          <el-upload :show-file-list="false" accept="image/*" :http-request="doUpload">
            <img v-if="form.cover" :src="coverUrl(form.cover)" class="cover-preview" />
            <el-button v-else>上传图片</el-button>
          </el-upload>
          <div class="form-tip" v-if="form.cover">已上传，再次点击可替换</div>
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
import {
  listServices,
  createService,
  updateService,
  toggleService,
  removeService,
  batchRemoveServices,
  CATEGORY_OPTIONS,
  MODE_OPTIONS
} from '../api/service'
import { fenToYuan, API_BASE } from '../api/base'
import { uploadImage } from '../api/upload'
import { authState } from '../stores/auth'

const isSuper = computed(() => authState.user && authState.user.role === 'super_admin')

const loading = ref(false)
const list = ref([])

/* ============ 搜索（本地过滤 title/subtitle） ============ */
const keywordInput = ref('')
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(kw) ||
      (s.subtitle || '').toLowerCase().includes(kw)
  )
})

function handleSearch() {
  keyword.value = keywordInput.value.trim()
}

/* ============ 列表 ============ */
async function fetchList() {
  loading.value = true
  try {
    list.value = await listServices()
  } finally {
    loading.value = false
  }
}

/* ============ 新增 / 编辑弹窗 ============ */
const dialogVisible = ref(false)
const dialogMode = ref('add') // add | edit
const editingId = ref('')
const formRef = ref(null)
const saving = ref(false)

const emptyForm = () => ({
  title: '',
  subtitle: '',
  category: 'rank',
  mode: 'hazard',
  priceUnit: 'hour',
  basePrice: 1000,
  tags: '',
  coverText: '',
  cover: ''
})

const form = reactive(emptyForm())

const rules = {
  title: [{ required: true, message: '请输入服务标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  mode: [{ required: true, message: '请选择模式', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入起步价', trigger: 'blur' }]
}

function openAdd() {
  dialogMode.value = 'add'
  editingId.value = ''
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    title: row.title || '',
    subtitle: row.subtitle || '',
    category: row.category || 'rank',
    mode: row.mode || 'hazard',
    priceUnit: row.priceUnit || 'hour',
    basePrice: row.basePrice || 0,
    tags: Array.isArray(row.tags) ? row.tags.join(',') : '',
    coverText: row.coverText || '',
    cover: row.cover || ''
  })
  dialogVisible.value = true
}

/** 图片上传（自定义 http-request） */
async function doUpload(option) {
  try {
    const data = await uploadImage(option.file)
    form.cover = data.url
    ElMessage.success('图片上传成功')
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  }
}

/** 封面图片完整地址（后端返回 /uploads/xxx） */
function coverUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return API_BASE.replace(/\/api$/, '') + path
}

/** 编辑模式下修改了计价方式或起步价 → 提示将重建规格 */
const specsWillRegenerate = computed(() => {
  if (dialogMode.value !== 'edit' || !editingId.value) return false
  const row = list.value.find((s) => s.id === editingId.value)
  if (!row) return false
  return form.priceUnit !== row.priceUnit || Number(form.basePrice) !== Number(row.basePrice)
})

async function onSave() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  saving.value = true
  try {
    const cat = CATEGORY_OPTIONS.find((o) => o.value === form.category)
    const mode = MODE_OPTIONS.find((o) => o.value === form.mode)
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      category: form.category,
      categoryName: cat ? cat.label : form.category,
      mode: form.mode,
      modeName: mode ? mode.label : form.mode,
      priceUnit: form.priceUnit,
      unitName: form.priceUnit === 'match' ? '局' : '小时',
      basePrice: Number(form.basePrice),
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      coverText: form.coverText.trim(),
      cover: form.cover || ''
    }
    if (dialogMode.value === 'edit') {
      await updateService(editingId.value, payload)
    } else {
      await createService(payload)
    }
    ElMessage.success(dialogMode.value === 'edit' ? '服务已更新' : '服务已创建')
    dialogVisible.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/* ============ 上架 / 下架 ============ */
async function onToggle(row) {
  const action = row.isOnSale ? '下架' : '上架'
  try {
    await ElMessageBox.confirm(`确定${action}「${row.title}」吗？`, '提示', {
      confirmButtonText: action,
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await toggleService(row.id)
    ElMessage.success(action === '下架' ? '已下架' : '已上架')
    await fetchList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

/* ============ 删除 ============ */
async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`确定删除服务「${row.title}」吗？删除后不可恢复。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error'
    })
  } catch (e) {
    return
  }
  try {
    await removeService(row.id)
    ElMessage.success('已删除')
    await fetchList()
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
    ElMessage.warning('请先勾选要删除的服务')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 个服务吗？删除后不可恢复。`,
      '批量删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' }
    )
  } catch (e) {
    return
  }
  try {
    await batchRemoveServices(selectedRows.value.map((r) => r.id))
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
.svc-title {
  color: #303133;
  font-weight: 500;
}
.svc-subtitle {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}
.cover-img {
  width: 56px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}
.cover-preview {
  width: 120px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 32px;
  margin-left: 10px;
  white-space: nowrap;
}
</style>
