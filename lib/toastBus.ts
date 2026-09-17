import { useEffect, useState } from 'react';

/**
 * A tiny global toast, mirroring the prototype's `flash()` — any screen can
 * call `showToast()` (e.g. right before navigating back after a submit) and
 * whichever screen mounts `useToast()` next picks it up. Auto-clears after
 * 2.2s, same as the prototype.
 */

type Listener = (message: string | null) => void;

let current: string | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(current));
}

export function showToast(message: string) {
  current = message;
  emit();
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    current = null;
    emit();
  }, 2200);
}

export function useToast(): string | null {
  const [message, setMessage] = useState(current);
  useEffect(() => {
    setMessage(current);
    listeners.add(setMessage);
    return () => {
      listeners.delete(setMessage);
    };
  }, []);
  return message;
}
