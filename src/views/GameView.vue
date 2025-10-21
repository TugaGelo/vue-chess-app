<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useChessStore } from '@/stores/chess';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

const router = useRouter();
const chessStore = useChessStore();
const historyContainer = ref(null);

function onBoardCreated(boardApi) {
  chessStore.setBoardApi(boardApi);
}

function backToLobby() {
  chessStore.disconnect();
  router.push('/');
}

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
  <div class="app-container">
    <div class="main-content">
      <div class="board-wrapper">
        <TheChessboard
          :player-color="chessStore.playerColor"
          :board-config="chessStore.boardConfig"
          @board-created="onBoardCreated"
          @move="chessStore.handleMove"
          @checkmate="handleCheckmate"
          @stalemate="handleStalemate"
          @draw="handleDraw"
        />
      </div>
      <div class="history-wrapper">
        <div class="game-info">
          <p>You are playing as: <strong>{{ chessStore.playerColor }}</strong></p>

          <div v-if="chessStore.material.materialDiff !== 0" class="material-info">
            <p> Advantage:
              <strong :class="chessStore.material.materialDiff > 0 ? 'white-adv' : 'black-adv'">
                {{ chessStore.material.materialDiff > 0 ? 'White' : 'Black' }} (+{{ Math.abs(chessStore.material.materialDiff) }})
              </strong>
            </p>
          </div>

        </div>
        <div class="playback-controls">
          <button @click="chessStore.viewStart()">&lt;&lt;</button>
          <button @click="chessStore.viewPrevious()">&lt;</button>
          <button @click="chessStore.viewNext()">&gt;</button>
          <button @click="chessStore.viewEnd()">&gt;&gt;</button>
        </div>
        <div class="history-content-scroll" ref="historyContainer">
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
        <div class="button-group">
          <button v-if="chessStore.isGameOver" @click="chessStore.resetGame()" class="new-game-button">New Game</button>
          <button @click="backToLobby" class="lobby-button">Back to Lobby</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.app-container {
  text-align: center;
  padding: 10px;
}
.main-content {
  display: flex;
  justify-content: center;
  gap: 4rem;
  align-items: flex-start;
  margin-top: 1.5rem;
}
.board-wrapper {
  width: 85vh;
  height: 85vh;
  max-width: 85vh;
  flex-shrink: 0;
}
.history-wrapper {
  width: 100%;
  max-width: 30rem;
  height: 89.5vh;
  display: flex;
  flex-direction: column;
  background-color: #f0d9b5;
  border-radius: 5px;
  padding: 15px;
  box-sizing: border-box;
}
.history-content-scroll {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
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
.lobby-button {
  background-color: #6c757d;
}
.playback-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 10px;
}
.playback-controls button {
  flex: 1;
  font-family: monospace;
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1;
  border: 1px solid #b58863;
  background: #e3c196;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.playback-controls button:hover {
  background: #d4b58c;
}
.material-info {
  margin-top: 10px;
  font-size: 0.9em;
  color: #333;
}
.material-info strong {
  font-weight: bold;
}
.white-adv {
  color: #4CAF50;
}
.black-adv {
  color: #4CAF50;
}
@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 0;
  }
  .board-wrapper {
    width: 95%;
    max-width: 95vw;
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
  .lobby-button {
    flex-basis: 100%;
  }
  .new-game-button + .lobby-button {
    flex-basis: calc(50% - 5px);
  }
}
</style>
