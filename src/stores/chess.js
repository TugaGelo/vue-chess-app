import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { Chess } from 'chess.js';

export const useChessStore = defineStore('chess', () => {
  const game = new Chess();
  const fen = ref(game.fen());

  // NEW: A reactive trigger to force history updates.
  const historyTrigger = ref(0);

  const formattedHistory = computed(() => {
    // By accessing this trigger, Vue knows to re-run this function when it changes.
    historyTrigger.value; 

    const history = game.history();
    const movePairs = [];
    for (let i = 0; i < history.length; i += 2) {
      movePairs.push({
        move: i / 2 + 1,
        white: history[i],
        black: history[i + 1] || '',
      });
    }
    return movePairs;
  });

  function makeMove(move) {
    const result = game.move(move);
    if (result) {
      fen.value = game.fen();
      // UPDATED: Change the trigger's value after a successful move.
      historyTrigger.value++;
    }
  }

  return { 
    fen, 
    formattedHistory, 
    makeMove 
  };
});
