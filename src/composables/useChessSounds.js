let moveSound = null;
let captureSound = null;
let checkSound = null;
let castleSound = null;
let gameEndSound = null;
let gameStartSound = null;

function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.warn("Could not play sound:", error);
    });
  }
}

export function useChessSounds() {
  function initChessSounds() {
    if (!moveSound) {
      moveSound = new Audio('/move.mp3');
      captureSound = new Audio('/capture.mp3');
      checkSound = new Audio('/check.mp3');
      castleSound = new Audio('/castle.mp3');
      gameEndSound = new Audio('/game-end.mp3');
      gameStartSound = new Audio('/game-start.mp3');

      [moveSound, captureSound, checkSound, castleSound, gameEndSound, gameStartSound].forEach(sound => {
        if (sound) sound.preload = 'auto';
      });
    }
  }

  function playMoveSound(moveObject, isGameEndingMove = false) {
    if (!moveObject) return;

    if (isGameEndingMove) {
      playSound(gameEndSound);
    } else {
      if (moveObject.san?.includes('+')) {
        playSound(checkSound);
      } else if (moveObject.flags?.includes('c')) {
        playSound(captureSound);
      } else if (moveObject.flags?.includes('k') || moveObject.flags?.includes('q')) {
        playSound(castleSound);
      } else {
        playSound(moveSound);
      }
    }
  }

  function playGameStartSound() {
    playSound(gameStartSound);
  }

  function playGameEndSound() {
    playSound(gameEndSound);
  }

  return {
    initChessSounds,
    playMoveSound,
    playGameStartSound,
    playGameEndSound
  };
}
