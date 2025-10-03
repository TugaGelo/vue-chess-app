import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useChessStore = defineStore('chess', () => {
  let boardAPI = null;
  let socket = null;
  const history = ref([]);
  const gameOverMessage = ref(''); 

  const boardConfig = { movable: { color: 'both', free: false } };

  function setBoardApi(api) {
    boardAPI = api;
  }

  function connect() {
    socket = io(`http://${window.location.hostname}:3000`);

    socket.on('boardState', (gameState) => {
      boardAPI?.setPosition(gameState.fen);
      history.value = gameState.history;
      gameOverMessage.value = '';
    });

    socket.on('moveMade', (gameState) => {
      if (boardAPI?.getFen() !== gameState.fen) {
        boardAPI?.setPosition(gameState.fen);
      }
      history.value = gameState.history;
    });
  }

  function flipBoard() {
    boardAPI?.toggleOrientation();
  }
  
  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  function handleMove(move) {
    socket?.emit('makeMove', move);
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

  function setGameOverMessage(message) {
    gameOverMessage.value = message;
  }

  return { 
    history, 
    boardConfig, 
    formattedHistory, 
    setBoardApi, 
    handleMove, 
    connect, 
    disconnect,
    gameOverMessage,
    setGameOverMessage,
    flipBoard 
  };
});
