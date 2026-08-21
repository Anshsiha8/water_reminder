import { useState } from 'react';
import { ArrowRight, GlassWater, Loader2, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Database is not configured.'); return; }
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message === 'Invalid login credentials' ? 'Incorrect email or password.' : message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><GlassWater size={22} /></div>
          <span>Hydrank</span>
        </div>
        <p className="auth-tagline">Adaptive hydration that follows your day.</p>

        <div className="auth-tabs">
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); }}>Create account</button>
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="auth-field">
              <User size={17} />
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </label>
          )}
          <label className="auth-field">
            <Mail size={17} />
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="auth-field">
            <Lock size={17} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="primary-button full auth-submit" type="submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signup' ? 'Already have an account?' : "Don't have one yet?"}
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}
