"use client";
import { useEffect, useState, useCallback, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

type Variant = "danger" | "warning" | "info";

type Options = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
};

type State = Options & { resolve: (v: boolean) => void };

let openDialog: ((opts: Options) => Promise<boolean>) | null = null;

export function confirmAction(opts: Options): Promise<boolean> {
  if (!openDialog) {
    // SSR / before mount fallback
    if (typeof window === "undefined") return Promise.resolve(false);
    return Promise.resolve(window.confirm(typeof opts.message === "string" ? opts.message : opts.title));
  }
  return openDialog(opts);
}

export function ConfirmDialogProvider() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    openDialog = (opts: Options) =>
      new Promise<boolean>(resolve => {
        setBusy(false);
        setState({ ...opts, resolve });
      });
    return () => { openDialog = null; };
  }, []);

  const close = useCallback((result: boolean) => {
    if (!state) return;
    state.resolve(result);
    setState(null);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  if (!state) return null;

  const variant: Variant = state.variant || "danger";
  const tone = {
    danger:  { ring: "bg-red-50 text-red-600",     btn: "bg-red-600 hover:bg-red-700" },
    warning: { ring: "bg-orange-50 text-orange-600", btn: "bg-orange-600 hover:bg-orange-700" },
    info:    { ring: "bg-blue-50 text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700" },
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={() => !busy && close(false)}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => !busy && close(false)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
          disabled={busy}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex gap-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone.ring}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900">{state.title}</h3>
              <div className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                {state.message}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => close(false)}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {state.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={() => { setBusy(true); close(true); }}
            disabled={busy}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${tone.btn}`}
            autoFocus
          >
            {state.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
