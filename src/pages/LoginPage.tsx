import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // If the user is already authenticated, go straight to the homepage.
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setActionLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await signInWithGoogle();
      // Supabase handles the redirect. The listener in AuthContext will pick up
      // the session the moment we come back with ?code=... in the URL.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      console.error('Google sign-in error:', err);
      setAuthError(message);
      setActionLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setActionLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      if (isSignUp) {
        const { needsEmailConfirmation } = await signUpWithEmail(
          email,
          password,
          username.trim() || undefined
        );

        if (needsEmailConfirmation) {
          setAuthNotice(
            'Account created! Please check your email to confirm your address, then sign in.'
          );
          setIsSignUp(false);
        } else {
          // We already have a session → redirect INSTANTLY.
          navigate('/', { replace: true });
        }
      } else {
        await signInWithEmail(email, password);
        // Session applied synchronously in AuthContext → navigate now.
        navigate('/', { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check your credentials.';
      console.error('Email auth error:', err);
      setAuthError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Only show a global loader while the FIRST session check runs. After that
  // the page is interactive immediately.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-orange-500 border-b-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔭 Ethio-cosmos</h1>
          <p className="text-gray-400">
            {isSignUp ? 'Create your account to start learning' : 'Welcome back to your cosmic journey'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-4 text-sm">
            {authError}
          </div>
        )}
        {authNotice && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-md mb-4 text-sm">
            {authNotice}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full bg-white text-gray-900 hover:bg-gray-100 border-0 mb-6 flex items-center justify-center"
          onClick={handleGoogleSignIn}
          disabled={actionLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Username <span className="text-gray-600">(optional)</span>
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800 border-white/20 text-white"
                placeholder="cosmic_explorer"
                autoComplete="username"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-white/20 text-white"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-white/20 text-white"
              placeholder="••••••••"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={actionLoading}
          >
            {actionLoading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
              setAuthNotice(null);
            }}
            className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
