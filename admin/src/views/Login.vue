<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-mark">星</div>
        <h1 class="brand-title">星竞电竞</h1>
        <p class="brand-sub">管理控制台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="onSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="warning"
            class="login-btn"
            :loading="loading"
            native-type="submit"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <p class="tip">默认账号 admin / 密码 admin123（本地演示）</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../stores/auth'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function onSubmit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await login(form.username.trim(), form.password)
      if (res.ok) {
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error(res.msg)
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1222, #1d2340);
}

.login-card {
  width: 400px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px 24px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
}

@media (max-width: 768px) {
  .login-card {
    padding: 32px 24px 20px;
    border-radius: 10px;
  }
}

.brand {
  text-align: center;
  margin-bottom: 28px;
}

.brand-mark {
  width: 52px;
  height: 52px;
  margin: 0 auto 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffd34d, #ffa940);
  color: #3a2e00;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.brand-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: #8a93ab;
}

.login-btn {
  width: 100%;
  letter-spacing: 6px;
  font-weight: 600;
}

.tip {
  margin: 4px 0 0;
  text-align: center;
  font-size: 12px;
  color: #a8abb2;
}
</style>
