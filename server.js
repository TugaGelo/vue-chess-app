import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const games = {}; 

const getGameState = (gameInstance) => ({
  fen: gameInstance.fen(),
  history: gameInstance.history({ verbose: true }),
  isGameOver: gameInstance.isGameOver()
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createGame', () => {
    const gameId = Math.random().toString(36).substr(2, 5).toUpperCase();
    games[gameId] = {
      game: new Chess(),
      players: { white: socket.id, black: null },
    };
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, playerColor: 'white' });
    console.log(`Game ${gameId} created by ${socket.id} (White)`);
  });

  socket.on('joinGame', (gameId) => {
    const gameData = games[gameId];
  
    if (gameData && !gameData.players.black && gameData.players.white !== socket.id) {
      gameData.players.black = socket.id;
      socket.join(gameId);
      
      const gameState = getGameState(gameData.game);
      io.to(gameData.players.white).emit('gameStarted', { ...gameState, playerColor: 'white' });
      io.to(gameData.players.black).emit('gameStarted', { ...gameState, playerColor: 'black' });
      console.log(`${socket.id} (Black) joined game ${gameId}. Game starting.`);
    } else if (gameData && gameData.players.white === socket.id) {
      socket.emit('error', "You can't join your own game.");
    } else {
      socket.emit('error', 'Game not found or is full.');
    }
  });

  socket.on('makeMove', ({ gameId, move }) => {
    const gameData = games[gameId];
    if (!gameData) return;

    const game = gameData.game;
    const playerColor = game.turn() === 'w' ? 'white' : 'black';
    const playerSocketId = gameData.players[playerColor];

    if (socket.id !== playerSocketId) {
      console.log(`Move rejected for game ${gameId}: Not your turn.`);
      return;
    }

    const result = game.move(move);
    if (result) {
      io.to(gameId).emit('moveMade', getGameState(game));
    }
  });

  socket.on('resetGame', (gameId) => {
    const gameData = games[gameId];
    if(gameData) {
      gameData.game = new Chess();
      const whitePlayer = gameData.players.white;
      gameData.players.white = gameData.players.black;
      gameData.players.black = whitePlayer;
      console.log(`Game ${gameId} reset. Colors swapped.`);

      const gameState = getGameState(gameData.game);
      if (gameData.players.white) {
        io.to(gameData.players.white).emit('gameStarted', { ...gameState, playerColor: 'white' });
      }
      if (gameData.players.black) {
        io.to(gameData.players.black).emit('gameStarted', { ...gameState, playerColor: 'black' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
