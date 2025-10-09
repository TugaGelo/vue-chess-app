import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../supabase';

export const useHistoryStore = defineStore('history', () => {
  const games = ref([]);
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
    const { data, error } = await supabase
      .from('games')
      .select('pgn, white_username:profiles!games_white_player_id_fkey(username), black_username:profiles!games_black_player_id_fkey(username)')
      .eq('id', id)
      .single();
    
    if (error) console.error('Error fetching game:', error);
    loading.value = false;
    return data;
  }

  return { games, loading, fetchGames, fetchGameById };
});
