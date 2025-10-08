import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useChessStore = defineStore('chess', () => {
  let boardAPI = null;
  let socket = null;
  const history = ref([]);
  const gameOverMessage = ref('');
  const errorMessage = ref('');
  
  const gamePhase = ref('lobby');
  const gameId = ref('');
  const playerColor = ref('');
  const isGameOver = ref(false);

  const initialPgn = ref('');

  const boardConfig = computed(() => ({
    coordinates: true,
    highlight: { lastMove: true, check: true },
    orientation: playerColor.value || 'white',
  }));

  function sanitizePgn(pgn) {
    return pgn
      .split('\n')
      .filter(line => !line.startsWith('[') && line.trim() !== '')
      .join(' ')
      .replace(/\*/g, '')
      .trim();
  }

  function setBoardApi(api) {
    boardAPI = api;
    if (gamePhase.value === 'playing' && initialPgn.value) {
      const cleaned = sanitizePgn(initialPgn.value);
      if (cleaned) {
        boardAPI.loadPgn(cleaned);
        history.value = boardAPI.getHistory(true);
      }
    }
  }

  function connect() {
    if (socket) return;
    socket = io(`http://${window.location.hostname}:3000`);

    socket.on('gameCreated', (data) => {
      gameId.value = data.gameId;
      playerColor.value = data.playerColor;
      gamePhase.value = 'waiting';
    });

    socket.on('gameStarted', (gameState) => {
      initialPgn.value = gameState.pgn;
      playerColor.value = gameState.playerColor;
      isGameOver.value = gameState.isGameOver;
      gameOverMessage.value = '';
      gamePhase.value = 'playing';

      if (boardAPI) {
        const cleaned = sanitizePgn(initialPgn.value);
        if (cleaned) boardAPI.loadPgn(cleaned);
        history.value = boardAPI.getHistory(true);
      }
    });

    socket.on('moveMade', (gameState) => {
      try {
        if (gameState.pgn && boardAPI) {
          const cleaned = sanitizePgn(gameState.pgn);
          if (cleaned) boardAPI.loadPgn(cleaned);
        }
      } catch (err) {
        console.error('Failed to load PGN:', err);
      }
      history.value = boardAPI?.getHistory(true) || [];
      isGameOver.value = gameState.isGameOver;
    });

    socket.on('boardState', (gameState) => {
      if (gameState.pgn && boardAPI) {
        const cleaned = sanitizePgn(gameState.pgn);
        if (cleaned) boardAPI.loadPgn(cleaned);
      }
      history.value = boardAPI?.getHistory(true);
      isGameOver.value = gameState.isGameOver;
      gameOverMessage.value = '';
    });
    
    socket.on('error', (msg) => {
      errorMessage.value = msg;
    });
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      gamePhase.value = 'lobby';
    }
  }

  function createGame() {
    errorMessage.value = '';
    socket?.emit('createGame');
  }

  function joinGame(id) {
    if (id) {
      errorMessage.value = '';
      gameId.value = id.toUpperCase();
      socket?.emit('joinGame', id.toUpperCase());
    }
  }

  function handleMove(move) {
    const simpleMove = {
      from: move.from,
      to: move.to,
      promotion: move.promotion
    };
    socket?.emit('makeMove', { gameId: gameId.value, move: simpleMove });
  }

  function resetGame() {
    socket?.emit('resetGame', gameId.value);
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

  function setGameOverMessage(message) {
    gameOverMessage.value = message;
  }
  
  function viewStart() { boardAPI?.viewStart(); }
  function viewPrevious() { boardAPI?.viewPrevious(); }
  function viewNext() { boardAPI?.viewNext(); }
  function viewEnd() { boardAPI?.stopViewingHistory(); }

  return { 
    history, boardConfig, formattedHistory, setBoardApi, handleMove, 
    connect, disconnect, gameOverMessage, setGameOverMessage,
    resetGame, viewStart, viewPrevious, viewNext, viewEnd, gamePhase, 
    gameId, playerColor, createGame, joinGame, errorMessage, isGameOver,
  };
});
