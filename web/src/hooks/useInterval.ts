'use client';

import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delayMs: number | null, enabled = true) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delayMs == null) return;
    const tick = () => saved.current();
    tick();
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs, enabled]);
}
