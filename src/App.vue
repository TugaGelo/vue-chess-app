<script setup>
import { watch } from 'vue';
import { useUserStore } from './stores/user';
import { useChessStore } from './stores/chess';
import AuthView from './components/AuthView.vue';
import AccountView from './components/AccountView.vue';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

const userStore = useUserStore();
const chessStore = useChessStore();

function onBoardCreated(boardApi) {
  chessStore.setBoardApi(boardApi);
}

watch(() => userStore.user, (newUser) => {
  if (newUser) {
    chessStore.connect();
  } else {
    chessStore.disconnect();
  }
}, { immediate: true });

function handleCheckmate(matedPlayerColor) {
  const winner = matedPlayerColor === 'white' ? 'Black' : 'White';
  chessStore.setGameOverMessage(`Checkmate! ${winner} wins.`);
}

function handleStalemate() {
  chessStore.setGameOverMessage('Game over: Stalemate.');
}

function handleDraw() {
  chessStore.setGameOverMessage('Game over: Draw.');
}
</script>

<template>
  <div v-if="userStore.user">
    <AccountView v-if="userStore.requiresPasswordUpdate" />
    <div v-else class="app-container">
      <div class="main-content">
        <div class="board-wrapper">
          <TheChessboard
            :board-config="chessStore.boardConfig"
            @board-created="onBoardCreated"
            @move="chessStore.handleMove"
            @checkmate="handleCheckmate"
            @stalemate="handleStalemate"
            @draw="handleDraw"
          />
        </div>
        <div class="history-wrapper">
          <div class="header-bar">
            <h2>Welcome!</h2>
            <button @click="userStore.signOut()" class="logout-button">Logout</button>
          </div>
          <div class="history-table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>White</th>
                  <th>Black</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="move in chessStore.formattedHistory" :key="move.move">
                  <td>{{ move.move }}</td>
                  <td>{{ move.white }}</td>
                  <td>{{ move.black }}</td>
                </tr>
              </tbody>
              </table>
            <div v-if="chessStore.gameOverMessage" class="game-over-message">
              {{ chessStore.gameOverMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <AuthView v-else />
</template>

<style>
body { 
  margin: 0; 
  font-family: sans-serif; 
}
.app-container { 
  text-align: center; 
  padding: 20px; 
}
.main-content { 
  display: flex; 
  justify-content: center; 
  gap: 7.5rem; 
}
.board-wrapper { 
  width: 70%; 
  max-width: 80vh; 
}
.history-wrapper { 
  width: 30%; 
  max-width: 350px; 
  display: flex; 
  flex-direction: column;
  height: 80vh; 
}
.history-table-container { 
  background-color: #f0d9b5; 
  border-radius: 5px; 
  flex-grow: 1; 
  overflow-y: auto; 
}
table { 
  width: 100%; 
  border-collapse: collapse; 
}
th, td { 
  padding: 8px 12px; 
  text-align: center; 
}
thead { 
  background-color: #b58863; 
  color: white; 
  position: sticky; 
  top: 0; 
}
tbody tr:nth-child(even) { 
  background-color: #e3c196; 
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.logout-button {
  padding: 5px 10px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.game-over-message {
  padding: 15px;
  font-size: 1.5em;
  font-weight: bold;
  color: #c0392b;
  border-top: 2px solid #b58863;
  margin-top: auto;
}
</style>