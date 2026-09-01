import React, { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { KeyRound, LoaderCircle, LockKeyhole, ServerOff, ShieldCheck } from 'lucide-react';
import { getAppConfig } from '../config/appConfig';
import { User } from '../types';
import { AuthClient, AuthClientError, AuthSession } from './authClient';

interface AuthContextValue {
  sessionUser: User | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ sessionUser: null, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

type AuthState = 'checking' | 'signed_out' | 'authenticated' | 'unavailable' | 'expired';

const LoginScreen: React.FC<{
  mode: 'staging' | 'production';
  state: AuthState;
  busy: boolean;
  error?: string;
  onLogin: (username: string, password: string) => Promise<void>;
  onRetry: () => Promise<void>;
}> = ({ mode, state, busy, error, onLogin, onRetry }) => {
  const [username, setUsername] = useState('ramiro');
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onLogin(username, password);
    setPassword('');
  };

  return (
    <main className="min-h-screen bg-[#050B10] text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0A141D] p-6 sm:p-8 shadow-2xl shadow-black/50">
        <div className="mb-7 flex items-start gap-4">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-blue-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {mode === 'production' ? 'Producción privada' : 'Staging seguro'}
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">NUGA Team Console</h1>
            <p className="mt-1 text-sm text-slate-400">Acceso exclusivo del propietario</p>
          </div>
        </div>

        {state === 'unavailable' && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <div className="flex gap-2 font-semibold"><ServerOff className="h-4 w-4 shrink-0" /> Servidor no disponible</div>
            <p className="mt-1 text-xs text-amber-200/80">{error}</p>
            <button type="button" onClick={onRetry} disabled={busy} className="mt-3 text-xs font-bold underline disabled:opacity-50">Reintentar conexión</button>
          </div>
        )}

        {state === 'expired' && (
          <div role="alert" className="mb-5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
            Tu sesión terminó de forma segura. Inicia sesión nuevamente.
          </div>
        )}

        {error && state === 'signed_out' && <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-300">
            Usuario
            <input aria-label="Usuario" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050B10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </label>
          <label className="block text-xs font-semibold text-slate-300">
            Contraseña
            <input aria-label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050B10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </label>
          <button type="submit" disabled={busy || !username.trim() || !password} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 flex gap-2 border-t border-slate-800 pt-4 text-[11px] leading-relaxed text-slate-500">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
          La contraseña no se almacena en el navegador. La sesión usa una cookie HttpOnly y la protección CSRF permanece solo en memoria.
        </div>
      </section>
    </main>
  );
};

export const AuthGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const config = useMemo(() => getAppConfig(), []);
  const client = useMemo(() => new AuthClient(config.apiUrl, config.mode), [config]);
  const [state, setState] = useState<AuthState>(config.isDemo ? 'authenticated' : 'checking');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const applyFailure = useCallback((failure: unknown, restoring = false) => {
    const authError = failure instanceof AuthClientError ? failure : null;
    setSession(null);
    setError(authError?.message ?? 'No fue posible validar la sesión.');
    setState(authError?.failure === 'unavailable' ? 'unavailable' : restoring ? 'signed_out' : 'signed_out');
  }, []);

  const restore = useCallback(async () => {
    if (config.isDemo) return;
    setBusy(true);
    setError(undefined);
    try {
      setSession(await client.restore());
      setState('authenticated');
    } catch (failure) {
      applyFailure(failure, true);
    } finally {
      setBusy(false);
    }
  }, [applyFailure, client, config]);

  useEffect(() => {
    if (!config.isDemo) void restore();
  }, [config, restore]);

  useEffect(() => {
    if (!session) return;
    const delay = Date.parse(session.expiresAt) - Date.now();
    if (delay <= 0) {
      setSession(null);
      setState('expired');
      return;
    }
    const timer = window.setTimeout(() => {
      setSession(null);
      setState('expired');
    }, Math.min(delay, 2_147_000_000));
    return () => window.clearTimeout(timer);
  }, [session]);

  const login = async (username: string, password: string) => {
    setBusy(true);
    setError(undefined);
    try {
      setSession(await client.login(username.trim(), password));
      setState('authenticated');
    } catch (failure) {
      applyFailure(failure);
    } finally {
      setBusy(false);
    }
  };

  const logout = useCallback(async () => {
    if (!session) return;
    try {
      await client.logout(session.csrfToken);
    } finally {
      setSession(null);
      setState('signed_out');
      setError(undefined);
    }
  }, [client, session]);

  if (!config.isDemo && state === 'checking') {
    return <div role="status" className="min-h-screen bg-[#050B10] text-slate-300 flex items-center justify-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-blue-400" /> Restaurando sesión segura…</div>;
  }

  if (!config.isDemo && state !== 'authenticated') {
    return <LoginScreen mode={config.isProduction ? 'production' : 'staging'} state={state} busy={busy} error={error} onLogin={login} onRetry={restore} />;
  }

  return <AuthContext.Provider value={{ sessionUser: session?.user ?? null, logout }}>{children}</AuthContext.Provider>;
};
