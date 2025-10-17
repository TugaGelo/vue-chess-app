<script setup>
import { ref, onMounted, computed, watch, } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { TheChessboard } from 'vue3-chessboard';
import { useRouter } from 'vue-router';
import { Chess } from 'chess.js';
import 'vue3-chessboard/style.css';

const props = defineProps({
  id: String,
});

const historyStore = useHistoryStore();
const router = useRouter();
const boardAPI = ref(null);
const isAnalysisMode = ref(false);
const analysisStartPly = ref(0);
const currentPly = ref(0);
const saving = ref(false);

const history = ref([]);
const historyContainer = ref(null);
const analysisMoves = ref([]);
const isBoardLoading = ref(false);

onMounted(() => {
  historyStore.fetchGameById(props.id);
});

watch([() => historyStore.currentGame, boardAPI, () => isAnalysisMode.value], ([newGame, api, isAnalyzing]) => {
  if (newGame) {
    if (!newGame.variations) {
      newGame.variations = [];
    }
    if (api && !isAnalyzing) {
      api.loadPgn(newGame.pgn);
      api.stopViewingHistory();
      currentPly.value = api.getCurrentPlyNumber();
      history.value = api.getHistory({ verbose: true });
    }
  }
});

function onBoardCreated(api) {
  boardAPI.value = api;

  if (isAnalysisMode.value) {
    analysisMoves.value = [];
    isBoardLoading.value = true;

    if (historyStore.currentGame?.pgn && analysisStartPly.value > 0) {
      const chess = new Chess();
      chess.loadPgn(historyStore.currentGame.pgn);
      const movesToPlay = chess.history().slice(0, analysisStartPly.value);

      api.setConfig({ animation: { duration: 0 } });

      for (const move of movesToPlay) {
        api.move(move);
      }
    }

    api.setConfig({
      animation: { duration: 200 },
      movable: { free: false, color: 'both', showDests: true },
    });

    isBoardLoading.value = false;
  }
}

function toggleAnalysisMode() {
  if (boardAPI.value) {
    if (!isAnalysisMode.value) {
      analysisStartPly.value = currentPly.value;
    }
    isAnalysisMode.value = !isAnalysisMode.value;
  }
}

const boardConfig = computed(() => {
  if (isAnalysisMode.value) {
    return {
      coordinates: true,
      movable: { free: false, color: 'both' },
    };
  } else {
    return {
      pgn: historyStore.currentGame?.pgn,
      coordinates: true,
      viewOnly: true,
    };
  }
});

function handleAnalysisMove(move) {
  if (isAnalysisMode.value && !isBoardLoading.value) {
    analysisMoves.value.push(move.san);
  }
}

async function saveVariation() {
  if (!boardAPI.value) return;
  const resolvedGameId = historyStore.currentGame?.id ?? props.id;
  if (!resolvedGameId) return;

  try {
    saving.value = true;
    const tempChess = new Chess();
    tempChess.loadPgn(historyStore.currentGame.pgn);
    const allMoves = tempChess.history();
    const movesToReplay = allMoves.slice(0, analysisStartPly.value);
    const chess = new Chess();
    movesToReplay.forEach(move => chess.move(move));

    analysisMoves.value.forEach(move => {
      if (chess.move(move) === null) {
        throw new Error(`Invalid move: ${move}`);
      }
    });

    const correctPgn = chess.pgn();

    if (analysisMoves.value.length === 0) {
      alert('No new moves to save.');
      saving.value = false;
      return;
    }

    const nameInput = window.prompt("Name your variation:", `Analysis ${new Date().toLocaleTimeString()}`);
    if (!nameInput) {
      saving.value = false;
      return;
    }

    const variation = {
      name: nameInput.trim() || `Variation ${Date.now()}`,
      pgn: correctPgn,
      created_at: new Date().toISOString(),
    };

    await historyStore.saveAnalysis(resolvedGameId, variation);

    isAnalysisMode.value = false;

  } catch (err) {
    console.error('Error saving variation:', err);
    alert(`Failed to save variation: ${err.message}`);
  } finally {
    saving.value = false;
  }
}

function loadVariation(pgn) {
  if (boardAPI.value) {
    boardAPI.value.loadPgn(pgn);
    currentPly.value = boardAPI.value.getCurrentPlyNumber();
    history.value = boardAPI.value.getHistory({ verbose: true });
  }
}

function playViewStart() {
  boardAPI.value?.viewStart();
  currentPly.value = 0;
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function playViewPrevious() {
  boardAPI.value?.viewPrevious();
  if (currentPly.value > 0) currentPly.value--;
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function playViewNext() {
  boardAPI.value?.viewNext();
  currentPly.value++;
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}
function playViewEnd() {
  boardAPI.value?.stopViewingHistory();
  currentPly.value = boardAPI.value?.getCurrentPlyNumber() || 0;
  history.value = boardAPI.value?.getHistory({ verbose: true }) || [];
}

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
</script>

<template>
  <div class="app-container">
    <div v-if="historyStore.loading" class="loading">Loading Replay...</div>

    <div v-else-if="historyStore.currentGame" class="main-content">
      <div class="board-wrapper">
        <TheChessboard
          :key="isAnalysisMode"
          :board-config="boardConfig"
          @board-created="onBoardCreated"
          @move="handleAnalysisMove"
        />
      </div>
      <div class="history-wrapper">
        <div class="game-info">
          <p>White: <strong>{{ historyStore.currentGame.white_username || 'N/A' }}</strong></p>
          <p>Black: <strong>{{ historyStore.currentGame.black_username || 'N/A' }}</strong></p>
          <p>Result: <strong>{{ historyStore.currentGame.result }}</strong></p>
        </div>

        <div v-if="!isAnalysisMode" class="playback-controls">
          <button @click="playViewStart()">&lt;&lt;</button>
          <button @click="playViewPrevious()">&lt;</button>
          <button @click="playViewNext()">&gt;</button>
          <button @click="playViewEnd()">&gt;&gt;</button>
        </div>

        <div class="variations-menu" v-if="historyStore.currentGame.variations?.length > 0">
          <label for="variations">View Analysis:</label>
          <select id="variations" @change="loadVariation($event.target.value)">
            <option :value="historyStore.currentGame.pgn">Main Game</option>
            <option v-for="(variation, index) in historyStore.currentGame.variations" :key="index" :value="variation.pgn">
              {{ variation.name }}
            </option>
          </select>
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
          <button @click="toggleAnalysisMode" class="analysis-button">
            {{ isAnalysisMode ? 'Exit Analysis' : 'Analyze Game' }}
          </button>
          <button v-if="isAnalysisMode" @click="saveVariation" :disabled="saving" class="save-button">
            {{ saving ? 'Saving...' : 'Save Variation' }}
          </button>
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
  flex-wrap: wrap;
}
.button-group button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  border: none;
  color: white;
  font-weight: bold;
}
.analysis-button {
  background-color: #007bff;
}
.analysis-button:hover {
  background-color: #0056b3;
}
.save-button {
  background-color: #28a745;
}
.save-button:hover {
  background-color: #218838;
}
.back-button {
  background-color: #6c757d;
}
.back-button:hover {
  background-color: #5a6268;
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
.variations-menu {
  margin-bottom: 1rem;
}
.variations-menu label {
  font-weight: bold;
  font-size: 1.1em;
  color: #333;
  margin-bottom: 8px;
  display: block;
  text-align: left;
}
.variations-menu select {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  font-weight: bold;
  color: #333;
  background: #e3c196;
  border: 1px solid #b58863;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
}
.variations-menu select:hover {
  background: #d4b58c;
}
</style>
