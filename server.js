import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iuzyffugeksdulkkvmnh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1enlmZnVnZWtzZHVsa2t2bW5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MDc1OCwiZXhwIjoyMDc0OTQ2NzU4fQ.xVjn6WGyzVMcwj0wKSfhOUTDhDdOq41J9yCoy2Xxuvk'
);

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const games = {};
const socketUserMap = new Map();

let waitingQueue = [];

const getGameState = (gameInstance) => ({
  pgn: gameInstance.pgn(),
  isGameOver: gameInstance.isGameOver()
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('registerUser', (userId) => {
    socketUserMap.set(socket.id, userId);
  });

  socket.on('findGame', async () => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) {
      socket.emit('error', 'User not registered. Please log in.');
      return;
    }

    if (waitingQueue.some(player => player.id === socket.id)) {
      console.log(`User ${socket.id} is already in the queue.`);
      return;
    }

    console.log(`User ${socket.id} (User ID: ${userId}) is looking for a game.`);

    waitingQueue.push(socket);

    if (waitingQueue.length >= 2) {

      const whiteSocket = waitingQueue.shift();
      const blackSocket = waitingQueue.shift();

      console.log(`Match found! ${whiteSocket.id} vs ${blackSocket.id}`);

      const whiteUserId = socketUserMap.get(whiteSocket.id);
      const blackUserId = socketUserMap.get(blackSocket.id);

      const gameId = crypto.randomUUID();
      const chess = new Chess();

      games[gameId] = {
        game: chess,
        players: { white: whiteSocket.id, black: blackSocket.id }
      };

      const { error } = await supabase.from('games').insert([
        { id: gameId, white_player_id: whiteUserId, black_player_id: blackUserId }
      ]);
      if (error) console.error('[SERVER] Supabase insert error:', error);

      whiteSocket.join(gameId);
      blackSocket.join(gameId);

      const gameState = getGameState(chess);

      io.to(whiteSocket.id).emit('gameStarted', { ...gameState, playerColor: 'white', gameId: gameId });
      io.to(blackSocket.id).emit('gameStarted', { ...gameState, playerColor: 'black', gameId: gameId });

    } else {
      console.log(`User ${socket.id} is now waiting in the queue.`);
      socket.emit('waitingForGame');
    }
  });

  socket.on('makeMove', async ({ gameId, move }) => {
    const gameData = games[gameId];
    if (!gameData) return;
    const game = gameData.game;
    const turnColor = game.turn() === 'w' ? 'white' : 'black';
    const playerSocketId = gameData.players[turnColor];
    if (socket.id !== playerSocketId) return;
    const result = game.move(move);
    if (!result) return;
    io.to(gameId).emit('moveMade', getGameState(game));
    if (game.isGameOver()) {
      let gameResult = 'draw';
      if (game.isCheckmate()) {
        gameResult = turnColor === 'white' ? 'white_wins' : 'black_wins';
      }
      const { error } = await supabase.from('games').update({ result: gameResult, pgn: game.pgn(), ended_at: new Date() }).eq('id', gameId);
      if (error) console.error('[SERVER] Supabase final update error:', error);
      else console.log(`[SERVER] Game ${gameId} saved to database with result: ${gameResult}`);
      io.to(gameId).emit('gameOver', gameResult);
    }
  });

  socket.on('resetGame', async (oldGameId) => {
    const oldGameData = games[oldGameId];
    if (!oldGameData || !oldGameData.players.white || !oldGameData.players.black) {
      return;
    }
    const whitePlayerSocketId = oldGameData.players.white;
    const blackPlayerSocketId = oldGameData.players.black;
    const whitePlayerUserId = socketUserMap.get(whitePlayerSocketId);
    const blackPlayerUserId = socketUserMap.get(blackPlayerSocketId);
    if (!whitePlayerUserId || !blackPlayerUserId) {
        console.error("Could not find user IDs for both players to start a rematch.");
        return;
    }
    const newGameId = crypto.randomUUID();
    const newChess = new Chess();
    games[newGameId] = {
        game: newChess,
        players: {
            white: blackPlayerSocketId,
            black: whitePlayerSocketId
        }
    };
    const { error } = await supabase.from('games').insert([{
        id: newGameId,
        white_player_id: blackPlayerUserId,
        black_player_id: whitePlayerUserId
    }]);
    if (error) {
        console.error('[SERVER] Rematch insert error:', error);
        return;
    }
    console.log(`Rematch game ${newGameId} created.`);
    const whiteSocket = io.sockets.sockets.get(whitePlayerSocketId);
    const blackSocket = io.sockets.sockets.get(blackPlayerSocketId);
    if(whiteSocket) {
        whiteSocket.leave(oldGameId);
        whiteSocket.join(newGameId);
    }
    if(blackSocket) {
        blackSocket.leave(oldGameId);
        blackSocket.join(newGameId);
    }
    const newGameState = getGameState(newChess);
    io.to(blackPlayerSocketId).emit('gameStarted', { ...newGameState, playerColor: 'white', gameId: newGameId });
    io.to(whitePlayerSocketId).emit('gameStarted', { ...newGameState, playerColor: 'black', gameId: newGameId });
    delete games[oldGameId];
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    socketUserMap.delete(socket.id);

    waitingQueue = waitingQueue.filter(player => player.id !== socket.id);
    console.log('Updated waiting queue after disconnect.');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
