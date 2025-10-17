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

  async function saveAnalysis(gameId, newVariation) {
    try {
      if (!newVariation?.pgn) {
        throw new Error("Variation missing PGN — cannot save.");
      }

      // Fetch existing variations
      const { data: gameData, error: fetchErr } = await supabase
        .from('games')
        .select('variations')
        .eq('id', gameId)
        .single();

      if (fetchErr) {
        console.error('Error fetching game for variations:', fetchErr);
        throw fetchErr;
      }

      const currentVariations = gameData?.variations || [];
      const updatedArray = [...currentVariations, newVariation];

      // Update with new array
      const { error: updateErr } = await supabase
        .from('games')
        .update({ variations: updatedArray })
        .eq('id', gameId);

      if (updateErr) {
        console.error('Error updating variations:', updateErr);
        throw updateErr;
      }

      // Sync local store to instantly update the UI
      if (currentGame.value && currentGame.value.id === gameId) {
        currentGame.value.variations = updatedArray;
      }

      console.log("✅ Variation saved with PGN:", newVariation.pgn);

    } catch (err) {
      console.error('Failed to update variations in DB:', err);
      throw err;
    }
  }

  return {
    games,
    currentGame,
    loading,
    fetchGames,
    fetchGameById,
    deleteGame,
    saveAnalysis
  };
});
