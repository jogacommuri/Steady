/**
 * A tiny in-process event bus that decouples the data hooks from the sync
 * engine, so neither has to import the other.
 *
 * - Hooks call `emitLocalChange()` after a write; the sync engine listens and
 *   debounces a push.
 * - The sync engine calls `emitRemoteChange()` after applying pulled or
 *   realtime rows; hooks listen and re-query SQLite to refresh the UI.
 */

type Listener = () => void;

function channel() {
  const listeners = new Set<Listener>();
  return {
    emit() {
      listeners.forEach((l) => {
        try {
          l();
        } catch {
          // A misbehaving listener must not break the others.
        }
      });
    },
    on(l: Listener): () => void {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

const local = channel();
const remote = channel();

export const syncBus = {
  emitLocalChange: local.emit,
  onLocalChange: local.on,
  emitRemoteChange: remote.emit,
  onRemoteChange: remote.on,
};
