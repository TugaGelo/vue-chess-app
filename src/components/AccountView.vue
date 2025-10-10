<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const newPassword = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleUpdatePassword = async () => {
  if (!newPassword.value) {
    errorMessage.value = 'Password cannot be empty.'
    return
  }
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    await userStore.updatePassword(newPassword.value)
    successMessage.value = 'Password updated successfully!'
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
    newPassword.value = '' 
  }
}
</script>

<template>
  <div class="account-container">
    <div class="account-box">
      <h3>Update Your Password</h3>
      <form @submit.prevent="handleUpdatePassword">
        <input
          v-model="newPassword"
          type="password"
          placeholder="Enter new password"
          required
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save New Password' }}
        </button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.account-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #3a3a3a;
}
.account-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}
input {
  width: 90%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}
button {
  width: 100%;
  padding: 12px;
  background-color: #b58863;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
.error-message { 
  color: #e74c3c; 
}
.success-message { 
  color: #27ae60; 
}
</style>
