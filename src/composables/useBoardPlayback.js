export function useBoardPlayback(boardAPI, currentPly, history, playSoundCallback) {

  function playViewStart() {
    boardAPI.value?.viewStart();
    currentPly.value = 0;
    console.log("Navigated to Start (Ply 0)");
  }

  function playViewPrevious() {
    const oldPly = currentPly.value;
    const predictedPly = Math.max(0, oldPly - 1);

    boardAPI.value?.viewPrevious();

    if (predictedPly < oldPly) {
      currentPly.value = predictedPly;

      if (predictedPly > 0 && history.value && history.value.length >= predictedPly) {
        const moveIndex = predictedPly - 1;
        const currentMove = history.value[moveIndex];
        console.log(`Previous Button: Predicted Ply ${predictedPly}. Playing sound for move:`, currentMove);
        playSoundCallback(currentMove, predictedPly);
      } else {
        console.log(`Previous Button: Predicted Ply ${predictedPly}, but no move found or at start.`);
      }
    } else {
      console.log("Previous Button: Already at start.");
      setTimeout(() => { currentPly.value = boardAPI.value?.getCurrentPlyNumber() ?? 0; }, 60);
    }
  }

  function playViewNext() {
    const oldPly = currentPly.value;
    const historyLen = history.value.length;
    const predictedPly = Math.min(historyLen, oldPly + 1);

    boardAPI.value?.viewNext();

    if (predictedPly > oldPly) {
      currentPly.value = predictedPly;

      if (history.value && historyLen >= predictedPly) {
        const moveIndex = predictedPly - 1;
        const nextMove = history.value[moveIndex];
        console.log(`Next Button: Predicted Ply ${predictedPly}. Playing sound for move:`, nextMove);
        playSoundCallback(nextMove, predictedPly);
      } else {
        console.log(`Next Button: Predicted Ply ${predictedPly}, but no move found.`);
      }
    } else {
      console.log("Next Button: Already at end.");
      setTimeout(() => { currentPly.value = boardAPI.value?.getCurrentPlyNumber() ?? 0; }, 60);
    }
  }

  function playViewEnd() {
    const oldPly = currentPly.value;
    const historyLen = history.value.length;
    const predictedPly = historyLen;

    boardAPI.value?.stopViewingHistory();

    if (predictedPly > oldPly) {
      currentPly.value = predictedPly;
      if (historyLen > 0) {
        const moveIndex = historyLen - 1;
        const lastMove = history.value[moveIndex];
        console.log(`End Button: Predicted Ply ${predictedPly}. Playing sound for last move:`, lastMove);
        playSoundCallback(lastMove, predictedPly);
      }
    } else {
      console.log("End Button: Already at end.");
      setTimeout(() => { currentPly.value = boardAPI.value?.getCurrentPlyNumber() ?? 0; }, 60);
    }
  }

  return {
    playViewStart,
    playViewPrevious,
    playViewNext,
    playViewEnd
  };
}
