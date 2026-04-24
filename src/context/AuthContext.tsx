import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase';
import { fetchProfile } from '@/services/profiles';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await fetchProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  }, []);

  // Load profile asynchronously without blocking auth state
  const loadProfileAsync = useCallback((userId: string) => {
    loadProfile(userId).catch(error => {
      console.error('Error loading profile asynchronously:', error);
    });
  }, [loadProfile]);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          // Load profile asynchronously in the background
          loadProfileAsync(session.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Load profile asynchronously in the background without blocking
          loadProfileAsync(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfileAsync]);

  const signInWithGoogle = async () => {
    // Use production URL if available, otherwise fall back to current origin
    const redirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }

    // Note: Profile will be loaded automatically by onAuthStateChange listener
    // when the OAuth callback redirects back to the app
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }

    // Load profile asynchronously after successful sign-in
    if (data?.user) {
      loadProfileAsync(data.user.id);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    // Use production URL if available, otherwise fall back to current origin
    const redirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }

    // Load profile asynchronously if user is immediately authenticated (no confirmation required)
    if (data?.user && data?.session) {
      loadProfileAsync(data.user.id);
    }

    // Check if email confirmation is required
    const { data: { session } } = await supabase.auth.getSession();
    return { needsConfirmation: !session };
  };

  // BUG 7 FIX: Do NOT touch localStorage for app data. Supabase manages its own
  // session storage internally — removing a hand-picked key is both unnecessary
  // and can corrupt the library's internal state. We only clear our own
  // in-memory React state here.
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during signOut:", error);
    } finally {
      // Always clear local state even if signOut fails
      setUser(null);
      setProfile(null);
    }
  };
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
