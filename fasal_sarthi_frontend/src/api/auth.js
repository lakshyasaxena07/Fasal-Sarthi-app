import { supabaseClient } from '../lib/supabaseClient';

/**
 * Authentication API wrapper leveraging Supabase Auth.
 */
export const authApi = {
  /**
   * Sign in with email and password.
   */
  signIn: async (email, password) => {
    return await supabaseClient.auth.signInWithPassword({ email, password });
  },

  /**
   * Sign up a new user with email, password, and optional metadata.
   */
  signUp: async (email, password, metadata = {}) => {
    return await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
  },

  /**
   * Sign out the currently authenticated user.
   */
  signOut: async () => {
    return await supabaseClient.auth.signOut();
  },

  /**
   * Retrieve the active Supabase session.
   */
  getSession: async () => {
    return await supabaseClient.auth.getSession();
  },

  /**
   * Retrieve the current Supabase user object.
   */
  getUser: async () => {
    return await supabaseClient.auth.getUser();
  }
};
