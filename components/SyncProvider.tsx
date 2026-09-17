import NetInfo from '@react-native-community/netinfo';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { SyncEngine } from '@/lib/sync';
import { syncBus } from '@/lib/syncBus';
import {
  ensureSession,
  isSupabaseConfigured,
  supabase,
  type AccountInfo,
} from '@/lib/supabase';

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'error';

interface SyncContextValue {
  status: SyncStatus;
  account: AccountInfo;
  /** Trigger a manual push+pull. */
  sync: () => void;
}

const initialAccount: AccountInfo = {
  configured: isSupabaseConfigured,
  loading: isSupabaseConfigured,
  userId: null,
  email: null,
  isAnonymous: false,
};

const SyncContext = createContext<SyncContextValue>({
  status: 'disabled',
  account: initialAccount,
  sync: () => undefined,
});

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}

const DEBOUNCE_MS = 800;

/**
 * Wires the SyncEngine into the app lifecycle. Must live inside <SQLiteProvider>.
 * When Supabase isn't configured it renders children untouched and reports
 * `disabled`, so the local-only app is unaffected.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();

  const engineRef = useRef<SyncEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SyncEngine(db);
  // Assigned just above, so it is always defined here.
  const engine = engineRef.current!;

  const [status, setStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'idle' : 'disabled'
  );
  const [account, setAccount] = useState<AccountInfo>(initialAccount);

  // Coalesce overlapping sync requests into one in-flight run plus one rerun.
  const running = useRef(false);
  const pending = useRef(false);

  const runSync = useCallback(async () => {
    if (!engine.enabled) return;
    if (running.current) {
      pending.current = true;
      return;
    }
    running.current = true;
    setStatus('syncing');
    try {
      const applied = await engine.syncAll();
      if (applied > 0) syncBus.emitRemoteChange();
      setStatus('idle');
    } catch {
      setStatus('error');
    } finally {
      running.current = false;
      if (pending.current) {
        pending.current = false;
        void runSync();
      }
    }
  }, [engine]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let cancelled = false;
    let unsubscribeRealtime: () => void = () => {};
    const prevUserId = { current: null as string | null };

    const resubscribe = () => {
      unsubscribeRealtime();
      unsubscribeRealtime = engine.subscribeRealtime(() =>
        syncBus.emitRemoteChange()
      );
    };

    const handleSession = async (session: Session | null) => {
      if (cancelled) return;
      const user = session?.user ?? null;

      // Signed out while configured — fall back to a fresh anonymous account.
      // The resulting SIGNED_IN event re-enters here.
      if (!user) {
        try {
          await ensureSession();
        } catch {
          if (!cancelled) setStatus('error');
        }
        return;
      }

      const newId = user.id;
      const switched = prevUserId.current !== null && prevUserId.current !== newId;
      prevUserId.current = newId;

      engine.setUser(newId);
      if (switched) {
        // A different account (e.g. a second device joined): re-pull + re-push.
        await engine.resetForNewUser();
        syncBus.emitRemoteChange();
      }

      setAccount({
        configured: true,
        loading: false,
        userId: newId,
        email: user.email ?? null,
        isAnonymous: user.is_anonymous ?? false,
      });

      resubscribe();
      await runSync();
    };

    const boot = async () => {
      try {
        const session = await ensureSession();
        await handleSession(session);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setAccount((a) => ({ ...a, loading: false }));
        }
      }
    };
    void boot();

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void handleSession(session);
      }
    );

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const offLocal = syncBus.onLocalChange(() => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void runSync(), DEBOUNCE_MS);
    });

    const offNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) void runSync();
    });

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void runSync();
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      authSub.subscription.unsubscribe();
      offLocal();
      offNet();
      appSub.remove();
      if (debounce) clearTimeout(debounce);
    };
  }, [engine, runSync]);

  const value = useMemo<SyncContextValue>(
    () => ({ status, account, sync: () => void runSync() }),
    [status, account, runSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
