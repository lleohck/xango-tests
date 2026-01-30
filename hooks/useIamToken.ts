'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Environment = 'DEV' | 'UAT' | 'PRD';

type State = {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
};

export function useIamToken(environment: Environment) {
  const [state, setState] = useState<State>({
    accessToken: null,
    loading: true,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchToken = useCallback(async (opts?: { forceRefresh?: boolean }) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch('/api/iam-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          environment,
          forceRefresh: !!opts?.forceRefresh,
        }),
        signal: ac.signal,
        cache: 'no-store',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao obter token (${res.status})`);
      }

      const data = await res.json();
      setState({
        accessToken: data?.accessToken ?? null,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setState({ accessToken: null, loading: false, error: err?.message ?? 'Erro' });
    }
  }, [environment]);

  useEffect(() => {
    void fetchToken();
    return () => abortRef.current?.abort();
  }, [fetchToken]);

  const refresh = useCallback(() => {
    void fetchToken({ forceRefresh: true });
  }, [fetchToken]);

  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}