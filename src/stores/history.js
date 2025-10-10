import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../supabase';

export const useHistoryStore = defineStore('history', () => {
  const games = ref([]);
  const currentGame = ref(null);
  const loading = ref(false);

  async function fetchGames() {
    loading.value = true;
    const { data, error } = await supabase.rpc('get_game_history');

    if (error) {
      console.error('Error fetching games:', error);
    } else {
      games.value = data;
    }
    loading.value = false;
  }

  async function fetchGameById(id) {
    loading.value = true;
    currentGame.value = null;
    
    const { data, error } = await supabase
      .rpc('get_game_by_id', { game_id: id })
      .single();
    
    if (error) {
      console.error('Error fetching game:', error);
    } else {
      currentGame.value = data;
    }
    loading.value = false;
  }

  async function deleteGame(id) {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
    } else {
      games.value = games.value.filter(game => game.id !== id);
    }
  }

  return { games, currentGame, loading, fetchGames, fetchGameById, deleteGame };
});
