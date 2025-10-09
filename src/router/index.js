// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LobbyView from '../views/LobbyView.vue';
import GameView from '../views/GameView.vue';
import HistoryView from '../views/HistoryView.vue';

const routes = [
  { path: '/', name: 'Lobby', component: LobbyView },
  { path: '/game', name: 'Game', component: GameView },
  { path: '/history', name: 'History', component: HistoryView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
