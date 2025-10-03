<script setup>
import { ref, watch, nextTick } from 'vue';
import { useUserStore } from './stores/user';
import { useChessStore } from './stores/chess';
import AuthView from './components/AuthView.vue';
import AccountView from './components/AccountView.vue';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

const userStore = useUserStore();
const chessStore = useChessStore();

const historyContainer = ref(null);

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

watch(() => chessStore.history, () => {
  nextTick(() => {
    if (historyContainer.value) {
      historyContainer.value.scrollTop = historyContainer.value.scrollHeight;
    }
  });
}, { deep: true });

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
          <div class="history-content-scroll" ref="historyContainer"> <table>
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
          <div class="button-group"> <button @click="chessStore.resetGame" class="new-game-button">New Game</button>
            <button @click="chessStore.flipBoard" class="action-button">Flip Board</button>
            <button @click="userStore.signOut()" class="logout-button">Logout</button>
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
  padding: 10px; 
}
.main-content { 
  display: flex; 
  justify-content: center; 
  gap: 5rem; 
  flex-wrap: wrap;
  margin-top: 1rem;
}
.board-wrapper { 
  width: 70%; 
  max-width: 85vh; 
  flex-shrink: 0;
}
.history-wrapper { 
  width: 30%; 
  max-width: 350px; 
  display: flex; 
  flex-direction: column;
  height: 85vh; 
  background-color: #f0d9b5;
  border-radius: 5px;
  padding: 15px;
  margin-top: 1rem;
  box-sizing: border-box;
}
.history-content-scroll {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  background-color: #f0d9b5;
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
  z-index: 1;
}
tbody tr:nth-child(even) { 
  background-color: #e3c196; 
}
.game-over-message {
  padding: 15px;
  font-size: 1.2em;
  font-weight: bold;
  color: #c0392b;
  border-top: 2px solid #b58863;
  background-color: #f0d9b5;
}
.button-group {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.button-group button {
  flex: 1;
  padding: 10px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
.new-game-button {
  background-color: #007bff;
}
.action-button {
  background-color: #769656;
}
.logout-button {
  background-color: #e74c3c;
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column; 
    align-items: center;   
    gap: 0px;
  }
  .board-wrapper {
    width: 95%;
    max-width: 95vw;
    height: 95vw;
  }
  .history-wrapper {
    width: 95%;
    max-width: 95vw;
    height: auto;
    min-height: 200px;
    margin-top: 0rem;
  }
  .history-content-scroll {
    height: 200px;
  }
  .button-group {
    flex-wrap: wrap;
  }
  .button-group button {
    flex-basis: calc(50% - 5px);
  }
  .button-group .logout-button {
    flex-basis: 100%;
  }
}
</style>
