import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { supabase } from '../supabase';

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
  const userId = ref(null);
  const material = ref({ materialWhite: 39, materialBlack: 39, materialDiff: 0 });

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

    fetchUser().then(() => {
      if (userId.value) {
        socket.emit('registerUser', userId.value);
      }
    });

    socket.on('waitingForGame', () => {
      console.log('[CLIENT] Waiting in queue for an opponent...');
      gamePhase.value = 'waiting';
    });

    socket.on('gameStarted', (gameState) => {
      initialPgn.value = gameState.pgn;
      playerColor.value = gameState.playerColor;
      isGameOver.value = gameState.isGameOver;
      gameOverMessage.value = '';
      gamePhase.value = 'playing';

      if (gameState.gameId) {
        gameId.value = gameState.gameId;
      }

      if (boardAPI) {
        boardAPI.resetBoard();
        boardAPI.setConfig({
          orientation: playerColor.value,
          movable: { color: playerColor.value }
        });
        const cleaned = sanitizePgn(initialPgn.value);
        if (cleaned) boardAPI.loadPgn(cleaned);

        if (boardAPI) {
            const newMaterial = boardAPI.getMaterialCount();
            history.value = boardAPI.getHistory(true) || [];
            material.value = newMaterial;
            console.log('[DEBUG] History populated on game start:', history.value.length);
        }
      }
    });

    socket.on('moveMade', (gameState) => {
      if (boardAPI) {
        const cleaned = sanitizePgn(gameState.pgn);
        if (cleaned) boardAPI.loadPgn(cleaned);

        if (boardAPI) {
            const newMaterial = boardAPI.getMaterialCount();
            history.value = boardAPI.getHistory(true) || [];
            material.value = newMaterial;
            console.log('[DEBUG] History updated after move:', history.value.length);
        }
      }
      isGameOver.value = gameState.isGameOver;
    });

    socket.on('gameOver', (result) => {
      isGameOver.value = true;
      if (result === 'white_wins') {
        gameOverMessage.value = 'Game Over: White wins by checkmate!';
      } else if (result === 'black_wins') {
        gameOverMessage.value = 'Game Over: Black wins by checkmate!';
      } else {
        gameOverMessage.value = 'Game Over: Draw.';
      }
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

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    userId.value = user?.id || null;
  }

  function findGame() {
    if (!userId.value) {
      errorMessage.value = 'You must be logged in to create a game.';
      return;
    }
    errorMessage.value = '';
    socket?.emit('findGame');
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

  function setGameOverMessage(message) {
    gameOverMessage.value = message;
  }

  function viewStart() { boardAPI?.viewStart(); }
  function viewPrevious() { boardAPI?.viewPrevious(); }
  function viewNext() { boardAPI?.viewNext(); }
  function viewEnd() { boardAPI?.stopViewingHistory(); }

  return {
    history, boardConfig, setBoardApi, handleMove,
    connect, disconnect, gameOverMessage, setGameOverMessage,
    resetGame, viewStart, viewPrevious, viewNext, viewEnd, gamePhase,
    gameId, playerColor, findGame, errorMessage, isGameOver,
    fetchUser, userId, material
  };
});
