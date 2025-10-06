<script setup>
import { ref } from 'vue';
import { useChessStore } from '@/stores/chess';

const chessStore = useChessStore();
const gameIdInput = ref('');
</script>

<template>
  <div class="lobby-container">
    <div class="lobby-box">
      <h1>Multiplayer Chess</h1>
      <p>Create a new game or join one with an ID.</p>
      <div class="actions">
        <button @click="chessStore.createGame">Create New Game</button>
        <div class="join-game">
          <input v-model.trim="gameIdInput" @keyup.enter="chessStore.joinGame(gameIdInput)" placeholder="Enter Game ID" />
          <button @click="chessStore.joinGame(gameIdInput)">Join</button>
        </div>
      </div>
      <p v-if="chessStore.gamePhase === 'waiting'" class="game-id-display">
        Waiting for opponent... <br/> Share this code: <strong>{{ chessStore.gameId }}</strong>
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
  background-color: #b58863;
  color: white; 
  transition: background-color 0.3s;
}
button:hover {
  background-color: #9c714c;
}
.join-game { 
  display: flex; 
  gap: 10px; 
}
input {
  flex: 1; 
  padding: 12px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
  font-size: 16px;
}

.join-game button {
  flex: 0.5;
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
</style>