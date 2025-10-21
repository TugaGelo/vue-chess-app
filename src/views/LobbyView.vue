<script setup>
import { useChessStore } from '@/stores/chess';
import { useRouter } from 'vue-router';

const chessStore = useChessStore();
const router = useRouter();

function goToHistory() {
  router.push('/history');
}
</script>

<template>
  <div class="lobby-container">
    <div class="lobby-box">
      <h1>Multiplayer Chess</h1>

      <p>Click "Play" to find a game or "History" to view your replays.</p>

      <div class="actions">

        <button
          @click="chessStore.findGame"
          class="play-button"
          :disabled="chessStore.gamePhase === 'waiting'"
        >
          {{ chessStore.gamePhase === 'waiting' ? 'Searching...' : 'Play' }}
        </button>

        <button @click="goToHistory" class="history-button">View Game History</button>
      </div>

      <p v-if="chessStore.gamePhase === 'waiting'" class="game-id-display">
        Waiting for opponent...
      </p>

      <p v-if="chessStore.errorMessage" class="error-message">{{ chessStore.errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.lobby-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #3a3a3a;
  text-align: center;
  font-family: sans-serif;
}
.lobby-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}
h1 {
  color: #333;
}
p {
  color: #666;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
button {
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  border: none;
  color: white;
  transition: background-color 0.3s;
}

.play-button {
  background-color: #9c714c;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
}
.play-button:hover {
  background-color: #7B542F;
}
.play-button:disabled {
  background-color: #9c714c;
  cursor: not-allowed;
}

.game-id-display {
  margin-top: 20px;
  font-size: 1.2em;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
}
.error-message {
  color: #e74c3c;
  margin-top: 15px;
}
.history-button {
  background-color: #6c757d;
}
.history-button:hover {
  background-color: #5a6268;
}
</style>
