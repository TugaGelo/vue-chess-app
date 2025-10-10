<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { TheChessboard } from 'vue3-chessboard';
import { useRouter } from 'vue-router';
import 'vue3-chessboard/style.css';

const props = defineProps({
  id: String,
});

const historyStore = useHistoryStore();
const router = useRouter();
const boardAPI = ref(null);
const history = ref([]);
const historyContainer = ref(null);

onMounted(() => {
  historyStore.fetchGameById(props.id);
});

function onBoardCreated(api) {
  boardAPI.value = api;
}

watch([() => historyStore.currentGame, boardAPI], ([newGame, api]) => {
  if (newGame && api) {
    api.loadPgn(newGame.pgn);
    history.value = api.getHistory({ verbose: true }) || [];
  }
});

watch(history, () => {
  nextTick(() => {
    if (historyContainer.value) {
      // Logic to scroll to the current move can be added here later if desired
    }
  });
}, { deep: true });

const formattedHistory = computed(() => {
  const movePairs = [];
  if (!history.value) return [];
  for (let i = 0; i < history.value.length; i += 2) {
    movePairs.push({
      move: Math.floor(i / 2) + 1,
      white: history.value[i]?.san || '',
      black: history.value[i + 1]?.san || '',
    });
  }
  return movePairs;
});

function viewStart() { 
  boardAPI.value?.viewStart(); 
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function viewPrevious() { 
  boardAPI.value?.viewPrevious(); 
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function viewNext() { 
  boardAPI.value?.viewNext(); 
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function viewEnd() { 
  boardAPI.value?.stopViewingHistory(); 
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
</script>

<template>
  <div class="app-container">
    <div v-if="historyStore.loading" class="loading">Loading Replay...</div>
    
    <div v-else-if="historyStore.currentGame" class="main-content">
      <div class="board-wrapper">
        <TheChessboard
          :board-config="{ viewOnly: true, coordinates: true }"
          @board-created="onBoardCreated"
        />
      </div>
      <div class="history-wrapper">
        <div class="game-info">
          <p>White: <strong>{{ historyStore.currentGame.white_username || 'N/A' }}</strong></p>
          <p>Black: <strong>{{ historyStore.currentGame.black_username || 'N/A' }}</strong></p>
          <p>Result: <strong>{{ historyStore.currentGame.result }}</strong></p>
        </div>
        <div class="playback-controls">
          <button @click="viewStart()">&lt;&lt;</button>
          <button @click="viewPrevious()">&lt;</button>
          <button @click="viewNext()">&gt;</button>
          <button @click="viewEnd()">&gt;&gt;</button>
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
              <tr v-for="move in formattedHistory" :key="move.move">
                <td>{{ move.move }}</td>
                <td>{{ move.white }}</td>
                <td>{{ move.black }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="button-group">
          <button @click="router.push('/history')" class="back-button">Back to History</button>
        </div>
      </div>
    </div>

    <div v-else class="no-games">
      <h1>Game Not Found</h1>
      <button @click="router.push('/history')" class="back-button">Back to History</button>
    </div>
  </div>
</template>

<style scoped>
.app-container { 
  text-align: center; 
  padding: 10px; 
  color: #333; 
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
  background: #f0d9b5; 
  border-radius: 8px; 
  padding: 15px; 
  margin-top: 1rem; 
  box-sizing: border-box; 
}
.game-info { 
  padding-bottom: 10px; 
  border-bottom: 2px solid #b58863; 
  margin-bottom: 10px; 
  text-align: left; 
}
.game-info p { 
  margin: 5px 0; 
  font-size: 1.1em; 
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
  background-color: #f0d9b5; 
}
.button-group { 
  display: flex; 
  gap: 10px; 
  flex-shrink: 0; 
  margin-top: auto; 
}
.button-group button { 
  flex: 1; 
}
.back-button { 
  padding: 10px 20px; 
  font-size: 16px; 
  cursor: pointer; 
  border-radius: 4px; 
  border: none; 
  background-color: #6c757d; 
  color: white; 
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
  padding: 10px; 
  border: 1px solid #b58863; 
  background: #e3c196; 
  color: #333; 
  border-radius: 4px; 
  cursor: pointer; 
}
.playback-controls button:hover { 
  background: #d4b58c; 
}
.loading, .no-games { 
  color: white; 
  font-size: 1.5em; 
  padding-top: 50px; 
  text-align: center; 
}
</style>
