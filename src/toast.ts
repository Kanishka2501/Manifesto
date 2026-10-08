// Global, non-blocking toast notifications for iframe safety

type ToastListener = (message: string) => void;

const listeners: ToastListener[] = [];

export function toast(message: string) {
  listeners.forEach(listener => {
    try {
      listener(message);
    } catch (_) {}
  });
}

export function subscribeToast(listener: ToastListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}
