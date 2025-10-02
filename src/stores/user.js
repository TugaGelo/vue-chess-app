import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  
  const requiresPasswordUpdate = ref(false);

  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session;

    if (event === 'PASSWORD_RECOVERY') {
      requiresPasswordUpdate.value = true;
    } 

    else if (event === 'SIGNED_IN') {
      requiresPasswordUpdate.value = false;
    }
  });

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendPasswordResetEmail = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    
    requiresPasswordUpdate.value = false;
    return data;
  };

  return {
    user,
    requiresPasswordUpdate,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
  };
});
