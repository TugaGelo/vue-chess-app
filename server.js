import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('makeMove', (move) => {
    console.log('Relaying move:', move);
    socket.broadcast.emit('moveMade', move);
  });
  
  socket.on('resetGame', () => {
    console.log('Relaying reset command');
    socket.broadcast.emit('gameReset');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
