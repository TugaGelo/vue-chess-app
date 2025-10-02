<script setup>
import { useChessStore } from './stores/chess';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

const chessStore = useChessStore();

function onBoardCreated(boardApi) {
  chessStore.setBoardApi(boardApi);
}
</script>

<template>
  <div class="app-container">
    <div class="main-content">
      <div class="board-wrapper">
        <TheChessboard
          :board-config="chessStore.boardConfig"
          @board-created="onBoardCreated"
          @move="chessStore.handleMove"
        />
      </div>
      <div class="history-wrapper">
        <h2>Move History</h2>
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
        </div>
      </div>
    </div>
  </div>
</template>

<style>
body { margin: 0; font-family: sans-serif; }
.app-container { text-align: center; padding: 20px; }
.main-content { display: flex; justify-content: center; gap: 7.5rem; }
.board-wrapper { width: 70%; max-width: 80vh; }
.history-wrapper { width: 30%; max-width: 350px; display: flex; flex-direction: column; }
.history-table-container { background-color: #f0d9b5; border-radius: 5px; flex-grow: 1; overflow-y: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px 12px; text-align: center; }
thead { background-color: #b58863; color: white; position: sticky; top: 0; }
tbody tr:nth-child(even) { background-color: #e3c196; }
</style>
