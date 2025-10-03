import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let serverGame = new Chess();
const getGameState = () => ({ fen: serverGame.fen(), history: serverGame.history({ verbose: true }) });

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('boardState', getGameState());

  socket.on('makeMove', (move) => {
    if (serverGame.move(move)) {
      console.log('Move validated, broadcasting new state');
      io.emit('moveMade', getGameState());
    }
  });
  
  socket.on('resetGame', () => {
      serverGame = new Chess();
      console.log('Game reset by user, broadcasting initial state');
      io.emit('boardState', getGameState());
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
