import { computed } from 'vue';

function sanToFigurine(san, color = 'w') {
  if (!san) return '';

  const whitePieceMap = {
    'K': '♔',
    'Q': '♕',
    'R': '♖',
    'B': '♗',
    'N': '♘'
  };

  const blackPieceMap = {
    'K': '♚',
    'Q': '♛',
    'R': '♜',
    'B': '♝',
    'N': '♞'
  };

  const pieceMap = (color === 'b') ? blackPieceMap : whitePieceMap;

  const firstChar = san.charAt(0);

  if (pieceMap[firstChar]) {
    return pieceMap[firstChar] + san.substring(1);
  } else {
    return san;
  }
}

export function useFormattedHistory(historyRef) {

  const formattedHistory = computed(() => {
    console.log("[useFormattedHistory] Recalculating with colored figurines...");
    const movePairs = [];
    const historyArray = historyRef.value || [];

    for (let i = 0; i < historyArray.length; i += 2) {
      const whiteMove = historyArray[i];
      const blackMove = historyArray[i + 1];

      const whiteSan = whiteMove?.san || '';
      const blackSan = blackMove?.san || '';

      movePairs.push({
        move: Math.floor(i / 2) + 1,
        white: sanToFigurine(whiteSan, 'w'),
        black: sanToFigurine(blackSan, 'b')
      });
    }
    return movePairs;
  });

  return {
    formattedHistory
  };
}
