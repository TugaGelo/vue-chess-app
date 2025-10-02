<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// State to toggle between login, register, and forgot password
const formMode = ref('login') // 'login', 'register', or 'forgotPassword'

const handleAuth = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    if (formMode.value === 'login') {
      await userStore.signIn(email.value, password.value)
    } else if (formMode.value === 'register') {
      await userStore.signUp(email.value, password.value)
      successMessage.value = 'Success! Please check your email to verify your account.'
    } else if (formMode.value === 'forgotPassword') {
      await userStore.sendPasswordResetEmail(email.value)
      successMessage.value = 'Password reset link sent! Please check your email.'
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-box">
      <h1>{{ formMode === 'register' ? 'Create Account' : (formMode === 'login' ? 'Welcome Back' : 'Reset Password') }}</h1>
      <form @submit.prevent="handleAuth">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-if="formMode !== 'forgotPassword'" v-model="password" type="password" placeholder="Password" required />
        
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Loading...' : (formMode === 'register' ? 'Register' : (formMode === 'login' ? 'Login' : 'Send Reset Link')) }}
        </button>
      </form>

      <div class="toggle-links">
        <a v-if="formMode !== 'login'" href="#" @click.prevent="formMode = 'login'">Back to Login</a>
        <a v-if="formMode === 'login'" href="#" @click.prevent="formMode = 'register'">Don't have an account? Register</a>
        <a v-if="formMode === 'login'" href="#" @click.prevent="formMode = 'forgotPassword'">Forgot Password?</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #3a3a3a; }
.auth-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 100%; max-width: 400px; text-align: center; }
input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
button { width: 100%; padding: 12px; background-color: #b58863; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background-color 0.3s; }
button:disabled { background-color: #ccc; }
.error-message { color: #e74c3c; }
.success-message { color: #2ecc71; }
.toggle-links { margin-top: 20px; display: flex; justify-content: space-around; }
a { color: #b58863; text-decoration: none; }
</style>