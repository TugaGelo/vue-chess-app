import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useChessStore = defineStore('chess', () => {
  let boardAPI = null;
  const history = ref([]);

  const boardConfig = {
    movable: { color: 'both', free: false },
  };

  const socket = io('http://localhost:3000');

  function setBoardApi(api) {
    boardAPI = api;
  }

  // Listener for the initial state when we connect
  socket.on('boardState', (gameState) => {
    console.log('Received initial board state:', gameState);
    boardAPI?.setPosition(gameState.fen);
    history.value = gameState.history;
  });

  // Listener for all subsequent move updates
  socket.on('moveMade', (gameState) => {
    console.log('Received move update from server:', gameState);
    boardAPI?.setPosition(gameState.fen);
    history.value = gameState.history;
  });

  // When the user makes a move, we just tell the server. That's it.
  function handleMove(move) {
    socket.emit('makeMove', move);
  }
  
  const formattedHistory = computed(() => {
    const movePairs = [];
    for (let i = 0; i < history.value.length; i += 2) {
      movePairs.push({
        move: Math.floor(i / 2) + 1,
        white: history.value[i]?.san || '',
        black: history.value[i + 1]?.san || '',
      });
    }
    return movePairs;
  });

  return { 
    history,
    boardConfig,
    formattedHistory, 
    setBoardApi,
    handleMove
  };
});