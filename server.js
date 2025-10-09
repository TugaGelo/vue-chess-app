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

const getGameState = (gameInstance) => ({
  pgn: gameInstance.pgn(),
  isGameOver: gameInstance.isGameOver()
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('registerUser', (userId) => {
    socketUserMap.set(socket.id, userId);
  });

  socket.on('createGame', async (userId) => {
    const gameId = crypto.randomUUID();
    const chess = new Chess();
    games[gameId] = { game: chess, players: { white: socket.id, black: null } };
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, playerColor: 'white' });
    const { error } = await supabase.from('games').insert([{ id: gameId, white_player_id: userId }]);
    if (error) console.error('[SERVER] Supabase insert error:', error);
    console.log(`Game ${gameId} created by ${socket.id} (White)`);
  });

  socket.on('joinGame', async ({ gameId, userId }) => {
    const gameData = games[gameId];
    if (!gameData) {
      socket.emit('error', 'Game not found.');
      return;
    }
    if (gameData.players.black) {
      socket.emit('error', 'Game is full.');
      return;
    }
    const creatorUserId = socketUserMap.get(gameData.players.white);
    if (creatorUserId === userId) {
      socket.emit('error', "You can't join your own game.");
      return;
    }
    gameData.players.black = socket.id;
    socket.join(gameId);
    await supabase.from('games').update({ black_player_id: userId }).eq('id', gameId);
    const gameState = getGameState(gameData.game);
    io.to(gameData.players.white).emit('gameStarted', { ...gameState, playerColor: 'white' });
    io.to(gameData.players.black).emit('gameStarted', { ...gameState, playerColor: 'black' });
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
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
