'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { CloseIcon } from '@/components/icons';

interface SubscribeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SubscribeDialog({ open, onClose }: SubscribeDialogProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // TODO: wire to backend /api/newsletter once available
    await new Promise((r) => setTimeout(r, 600));
    setStatus('done');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-title"
    >
      <button
        type="button"
        aria-label="Close subscribe dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-sm shadow-xl p-6 animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-[var(--color-surface)] transition-colors"
          aria-label="Close"
        >
          <CloseIcon size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" />
          <h2 id="subscribe-title" className="text-h2 font-bold">
            Subscribe to our newsletter
          </h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-5">
          Get the day&apos;s top stories delivered to your inbox every morning. No spam,
          unsubscribe anytime.
        </p>

        {status === 'done' ? (
          <div className="py-6 text-center animate-fade-in-up">
            <p className="text-lg font-semibold text-[var(--color-success)] mb-1">
              You&apos;re subscribed!
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              Check your inbox for a confirmation email.
            </p>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={status === 'submitting'}
            >
              Subscribe
            </Button>
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              By subscribing you agree to our{' '}
              <a href="/privacy" className="link-underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
