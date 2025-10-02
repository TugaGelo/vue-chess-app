import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// The server holds the one true game state
let serverGame = new Chess();

const getGameState = () => ({
  fen: serverGame.fen(),
  history: serverGame.history({ verbose: true })
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // Send the current state to the player who just connected
  socket.emit('boardState', getGameState());

  // When a player sends a move, validate it and broadcast the new state
  socket.on('makeMove', (move) => {
    const result = serverGame.move(move);
    if (result) {
      console.log('Move validated, broadcasting new state to all clients');
      io.emit('moveMade', getGameState()); // Use io.emit to send to everyone
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
