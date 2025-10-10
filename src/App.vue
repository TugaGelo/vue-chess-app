<script setup>
import { watch } from 'vue';
import { useUserStore } from './stores/user';
import { useChessStore } from './stores/chess';
import { useRouter } from 'vue-router';
import AccountView from './components/AccountView.vue';
import AuthView from './components/AuthView.vue';

const userStore = useUserStore();
const chessStore = useChessStore();
const router = useRouter();

watch(() => userStore.user, async (newUser) => {
  if (newUser) {
    await chessStore.fetchUser();
    chessStore.connect();
  } else {
    chessStore.disconnect();
  }
}, { immediate: true });

watch(() => chessStore.gamePhase, (newPhase) => {
  if (newPhase === 'playing') {
    router.push('/game');
  } else if (newPhase === 'lobby') {
    router.push('/');
  }
});
</script>

<template>
  <div v-if="userStore.user">
    <AccountView v-if="userStore.requiresPasswordUpdate" />
    <router-view v-else />
  </div>
  <AuthView v-else />
</template>

<style>
body { 
  margin: 0; 
  font-family: sans-serif; 
}
</style>
