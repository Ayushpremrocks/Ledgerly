import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

/** Small confirmation messages in the corner: toast.success("Saved"), toast.error("Nope") */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
    },
    [dismiss]
  );

  const toast = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg shadow-black/5"
          >
            {t.kind === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
            )}
            <p className="flex-1 text-ink">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-faint hover:text-ink" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
