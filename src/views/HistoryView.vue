<script setup>
import { onMounted } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { useRouter } from 'vue-router';

const historyStore = useHistoryStore();
const router = useRouter();

onMounted(() => {
  historyStore.fetchGames();
});

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function formatResult(result) {
  if (result === 'white_wins') return { white: '1', black: '0' };
  if (result === 'black_wins') return { white: '0', black: '1' };
  if (result === 'draw') return { white: '½', black: '½' };
  return { white: '-', black: '-' };
}

function goToReplay(gameId) {
  router.push(`/replay/${gameId}`);
}

function handleDelete(gameId) {
  if (confirm('Are you sure you want to delete this game?')) {
    historyStore.deleteGame(gameId);
  }
}
</script>

<template>
  <div class="history-container">
    <div class="history-box">
      <div class="header">
        <h1>Game History</h1>
        <button @click="router.push('/')" class="back-button">Back to Lobby</button>
      </div>
      
      <div v-if="historyStore.loading" class="loading">Loading...</div>
      
      <div v-else class="game-list-container">
        <div class="list-header">
          <div class="col-players">Players</div>
          <div class="col-result">Result</div>
          <div class="col-date">Date</div>
          <div class="col-actions">Actions</div> </div>

        <div class="game-list">
          <div v-if="historyStore.games.length === 0" class="no-games">
            No completed games found.
          </div>
          <div v-for="game in historyStore.games" :key="game.id" class="game-row">
            <div class="col-players players-link" @click="goToReplay(game.id)">
              <div class="player-name">{{ game.white_username || 'N/A' }}</div>
              <div class="player-name">{{ game.black_username || 'N/A' }}</div>
            </div>
            <div class="col-result">
              <div class="result-score">{{ formatResult(game.result).white }}</div>
              <div class="result-score">{{ formatResult(game.result).black }}</div>
            </div>
            <div class="col-date">
              <span>{{ formatDate(game.created_at) }}</span>
            </div>
            <div class="col-actions">
              <button @click.stop="handleDelete(game.id)" class="delete-button" title="Delete Game">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-container { 
  padding: 20px; 
  display: flex; 
  justify-content: center; 
  align-items: flex-start; 
  min-height: 100vh; 
}
.history-box { 
  width: 100%; 
  max-width: 800px; 
  background: white; 
  padding: 20px 30px; 
  border-radius: 8px; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
}
.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid #eee; 
  padding-bottom: 15px; 
  margin-bottom: 20px; 
}
h1 { 
  color: #333; 
  margin: 0; 
}
.back-button { 
  padding: 8px 16px; 
  font-size: 14px; 
  cursor: pointer; 
  border-radius: 4px; 
  border: none; 
  background-color: #6c757d; 
  color: white; 
  transition: background-color 0.2s; 
}
.back-button:hover { 
  background-color: #5a6268; 
}
.loading, .no-games { 
  font-size: 1.1em; 
  padding: 50px; text-align: center; color: #888; }
.list-header, .game-row { 
  display: flex; 
  align-items: center; 
  padding: 0 15px; 
}
.list-header { 
  font-weight: bold; 
  color: #888; 
  font-size: 0.9em; 
  text-transform: uppercase; 
}
.game-list { 
  margin-top: 10px; 
}
.game-row { 
  padding: 15px; 
  border-radius: 6px; 
  transition: background-color 0.2s; 
  border-bottom: 1px solid #f0f0f0; 
}
.game-row:hover { 
  background-color: #f9f9f9; 
}

.col-players { 
  flex: 3; 
  display: flex; 
  flex-direction: column; 
  gap: 5px; 
}
.players-link {
  cursor: pointer;
}
.col-result { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  text-align: center; 
  gap: 5px; 
}
.col-date { 
  flex: 2; 
  text-align: right; 
  color: #666; 
  font-size: 0.9em; 
}
.col-actions {
  flex: 1;
  text-align: right;
}

.player-name { 
  font-size: 1em; 
  color: #333; 
}
.result-score { 
  font-weight: bold; 
  font-size: 1.1em; 
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px;
  border-radius: 4px;
  line-height: 1;
}
.delete-button:hover {
  background-color: #ffebee;
  color: #c62828;
}
</style>