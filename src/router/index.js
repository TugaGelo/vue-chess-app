import { createRouter, createWebHistory } from 'vue-router';
import LobbyView from '../views/LobbyView.vue';
import GameView from '../views/GameView.vue';
import HistoryView from '../views/HistoryView.vue';
import ReplayView from '../views/ReplayView.vue';

const routes = [
  {
    path: '/',
    name: 'Lobby',
    component: LobbyView
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView
  },
  {
    path: '/replay/:id',
    name: 'Replay',
    component: ReplayView,
    props: true
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
