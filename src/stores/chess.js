// src/stores/chess.js
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useChessStore = defineStore('chess', () => {
  let boardAPI = null;
  let socket = null;
  const history = ref([]);
  const gameOverMessage = ref('');
  const isViewingHistory = ref(false);

  const boardConfig = { movable: { color: 'both', free: false }, coordinates: true };

  function setBoardApi(api) {
    boardAPI = api;
    history.value = boardAPI?.getHistory({ verbose: true });
  }

  function connect() {
    socket = io(`http://${window.location.hostname}:3000`);

    socket.on('moveMade', (move) => {
      boardAPI?.move(move);
      history.value = boardAPI?.getHistory({ verbose: true });
    });

    socket.on('gameReset', () => {
      boardAPI?.resetBoard();
      history.value = [];
      gameOverMessage.value = '';
    });
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }
  
  function handleMove(move) {
    if (isViewingHistory.value) return;

    socket?.emit('makeMove', move);
    history.value = boardAPI?.getHistory({ verbose: true });
  }

  function resetGame() {
    boardAPI?.resetBoard();
    history.value = [];
    gameOverMessage.value = '';
    socket?.emit('resetGame');
  }

  function viewStart() {
    boardAPI?.viewStart();
    isViewingHistory.value = true;
  }
  function viewPrevious() {
    boardAPI?.viewPrevious();
    isViewingHistory.value = true;
  }
  function viewNext() {
    boardAPI?.viewNext();
  }
  function viewEnd() {
    boardAPI?.stopViewingHistory();
    isViewingHistory.value = false;
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

  function flipBoard() {
    boardAPI?.toggleOrientation();
  }

  return { 
    history, boardConfig, formattedHistory, setBoardApi, handleMove, 
    connect, disconnect, gameOverMessage, setGameOverMessage, flipBoard, 
    resetGame, viewStart, viewPrevious, viewNext, viewEnd
  };
});
