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

  socket.on('boardState', (gameState) => {
    console.log('Syncing with initial server state:', gameState);
    boardAPI?.setPosition(gameState.fen);
    history.value = gameState.history;
  });

  socket.on('moveMade', (gameState) => {
    console.log('Received move update from server:', gameState);
    // Don't update if we are the source of the move
    if (boardAPI?.getFen() !== gameState.fen) {
      boardAPI?.setPosition(gameState.fen);
      history.value = gameState.history;
    }
  });

  function handleMove(move) {
    // The component already made the move locally. We just send it to the server.
    socket.emit('makeMove', move);
    // Update local history for a snappy UI
    history.value = boardAPI?.getHistory({ verbose: true }) || [];
  }
  
  const formattedHistory = computed(() => {
    const movePairs = [];
    // We now expect verbose history objects
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