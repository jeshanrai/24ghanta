'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

type Mode = 'signin' | 'signup';
type Status = 'idle' | 'submitting' | 'error';

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      // TODO: wire to backend /api/auth/signin or /signup once available
      await new Promise((resolve) => setTimeout(resolve, 800));
      setError('Authentication is not yet enabled. Please check back soon.');
      setStatus('error');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="container py-12 lg:py-16 animate-fade-in-up">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {mode === 'signin'
              ? 'Sign in to save stories and get personalised picks.'
              : 'Join 24Ghanta to follow topics you care about.'}
          </p>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-sm p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="animate-fade-in-up">
                <label htmlFor="name" className="block text-sm font-medium mb-1">Full name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update('password')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--color-error)] animate-fade-in">{error}</p>
            )}

            <Button type="submit" variant="primary" fullWidth isLoading={status === 'submitting'}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" type="button">Google</Button>
            <Button variant="secondary" size="sm" type="button">Facebook</Button>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
          {mode === 'signin' ? (
            <>
              New to 24Ghanta?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="text-[var(--color-primary)] font-medium link-underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="text-[var(--color-primary)] font-medium link-underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
          By continuing you agree to our{' '}
          <Link href="/terms" className="link-underline">Terms</Link> and{' '}
          <Link href="/privacy" className="link-underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
