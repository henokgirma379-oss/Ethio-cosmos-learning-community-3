import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;          // true only during the FIRST session check
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  // Convenience display name that is available INSTANTLY
  displayName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fast auth provider:
 *  - Sets `user` immediately from the Supabase session (read from localStorage synchronously).
 *  - Sets `loading = false` as soon as the session has been read. The UI is never blocked
 *    waiting for the profile row.
 *  - Fetches the profile row (for username + role/admin) in the background.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Derive a display name synchronously from whatever we have right now.
  // Priority: profile.username -> user_metadata.full_name -> user_metadata.name
  //           -> email local-part -> 'User'
  const displayName =
    profile?.username ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'User';

  const isAdmin = profile?.role === 'admin';

  // --- Profile fetch (background, non-blocking) --------------------------------
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (!mountedRef.current) return;

    if (error) {
      // Most common cause: the `profiles` row has not been created yet (e.g.
      // trigger delay). We simply leave profile=null; the UI still works
      // because displayName falls back to user_metadata / email prefix.
      console.warn('Profile fetch warning:', error.message);
      return;
    }
    if (data) {
      setProfile(data as UserProfile);
    }
  }, []);

  // Handle a session change from anywhere (init, login, logout, token refresh)
  const applySession = useCallback(
    (session: Session | null) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        // Fire-and-forget. Do NOT await — the UI must render immediately.
        fetchProfile(nextUser.id);
      } else {
        setProfile(null);
      }
    },
    [fetchProfile]
  );

  // --- Init + listener ---------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    // 1) Read the stored session synchronously-ish. getSession() does not hit
    //    the network; it reads from localStorage, so it resolves in a few ms.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mountedRef.current) return;
        applySession(data.session ?? null);
      })
      .catch((e) => console.error('getSession error:', e))
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    // 2) Subscribe to any future auth state changes (login, logout, refresh,
    //    OAuth redirect callback). These must also be instant — again we do
    //    not await the profile fetch.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      // After the first init the listener may fire again; keep loading false.
      if (mountedRef.current) setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  // --- Actions -----------------------------------------------------------------
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Apply immediately so the UI updates without waiting for the listener.
      applySession(data.session ?? null);
    },
    [applySession]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: username ? { username, full_name: username } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.session) {
        // Email confirmation is disabled in Supabase → we already have a
        // session. Apply it immediately so the user is signed in RIGHT NOW.
        applySession(data.session);
        return { needsEmailConfirmation: false };
      }
      // Email confirmation is required (default Supabase setting).
      return { needsEmailConfirmation: true };
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear local state immediately so the UI reacts without waiting.
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        displayName,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined)
    throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
