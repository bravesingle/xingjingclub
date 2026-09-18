<template>
  <div>
    <!-- 工具栏 -->
    <div class="page-card page-toolbar">
      <div class="toolbar-left">
        <span class="page-title">首页 Banner 管理</span>
        <el-tag type="info" size="small">小程序首页顶部轮播</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="openAdd">添加 Banner</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="page-card">
      <el-table :data="list" v-loading="loading" style="width: 100%">
        <el-table-column label="预览" width="220">
          <template #default="{ row }">
            <div
              class="banner-preview"
              :style="row.cover ? '' : 'background:' + (row.gradient || '#3A5BFF,#7B5CFF')">
              <img v-if="row.cover" :src="coverUrl(row.cover)" class="banner-preview-img" />
              <span class="banner-preview-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="subtitle" label="副标题" min-width="160" />
        <el-table-column label="跳转" min-width="140">
          <template #default="{ row }">
            <el-tag size="small" :type="linkTypeTag(row.linkType)">
              {{ linkTypeText(row.linkType, row.linkId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加弹窗 -->
    <el-dialog v-model="dialogVisible" title="添加 Banner" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="关联商品">
          <el-select
            v-model="form.serviceId"
            placeholder="选择已有商品（自动填充标题/图片/跳转）"
            filterable
            clearable
            style="width: 100%">
            <el-option
              v-for="s in services"
              :key="s.id"
              :label="s.title"
              :value="s.id" />
          </el-select>
          <div class="form-tip">选择商品后自动带出封面图、标题，点击跳转商品详情；也可留空自定义</div>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="Banner 标题" maxlength="20" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" placeholder="Banner 副标题（选填）" maxlength="30" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload :show-file-list="false" accept="image/*" :http-request="doUpload">
            <img v-if="form.cover" :src="coverUrl(form.cover)" class="cover-preview" />
            <el-button v-else>上传图片</el-button>
          </el-upload>
          <div class="form-tip">有图优先显示图片，无图用渐变占位</div>
        </el-form-item>
        <el-form-item label="跳转类型" v-if="!form.serviceId">
          <el-radio-group v-model="form.linkType">
            <el-radio value="service">商品详情</el-radio>
            <el-radio value="category">分类列表</el-radio>
            <el-radio value="page">全部服务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类 ID" v-if="!form.serviceId && form.linkType === 'category'">
          <el-input v-model="form.linkId" placeholder="rank / loot / task / warfare" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="99" />
          <div class="form-tip">数字越小越靠前</div>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listBanners, createBanner, removeBanner } from '../api/banner'
import { listServices } from '../api/service'
import { uploadImage } from '../api/upload'
import { API_BASE } from '../api/base'

const loading = ref(false)
const list = ref([])
const services = ref([])
const dialogVisible = ref(false)
const saving = ref(false)

const emptyForm = () => ({
  serviceId: null,
  title: '',
  subtitle: '',
  cover: '',
  linkType: 'service',
  linkId: '',
  sort: 0
})
const form = reactive(emptyForm())

function coverUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return API_BASE.replace(/\/api$/, '') + path
}

function linkTypeText(type, id) {
  if (type === 'service') return '商品 #' + id
  if (type === 'category') return '分类：' + id
  return '全部服务'
}
function linkTypeTag(type) {
  if (type === 'service') return 'primary'
  if (type === 'category') return 'success'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    list.value = await listBanners()
  } finally {
    loading.value = false
  }
}

async function fetchServices() {
  try {
    const data = await listServices()
    services.value = data || []
  } catch (e) {
    services.value = []
  }
}

function openAdd() {
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

/** 图片上传 */
async function doUpload(option) {
  try {
    const data = await uploadImage(option.file)
    form.cover = data.url
    ElMessage.success('图片上传成功')
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  }
}

async function onSave() {
  if (!form.title && !form.serviceId) {
    ElMessage.warning('请填写标题或选择关联商品')
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      cover: form.cover,
      linkType: form.linkType,
      linkId: form.linkId,
      sort: form.sort
    }
    if (form.serviceId) payload.serviceId = form.serviceId
    await createBanner(payload)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    fetchList()
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    saving.value = false
  }
}

function onRemove(row) {
  ElMessageBox.confirm('确定删除该 Banner？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await removeBanner(row.id)
    ElMessage.success('已删除')
    fetchList()
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
  fetchServices()
})
</script>

<style scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
.banner-preview {
  width: 200px;
  height: 70px;
  border-radius: 6px;
  background: linear-gradient(135deg, #3a5bff, #7b5cff);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.banner-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-preview-text {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  position: absolute;
}
.cover-preview {
  width: 160px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
}
</style>
