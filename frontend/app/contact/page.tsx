'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to submit message');
      }
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="container py-10 lg:py-14 animate-fade-in-up">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wide">
            Contact Us
          </h1>
        </div>

        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          Have a story tip, feedback, or a correction to report? We&apos;d love to hear
          from you. Expect a reply within 1&ndash;2 business days.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 border border-[var(--color-border)] rounded-sm">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] font-semibold mb-1">
              Newsroom
            </p>
            <a href="mailto:news@24ghanta.com" className="text-[var(--color-primary)] link-underline text-sm">
              news@24ghanta.com
            </a>
          </div>
          <div className="p-4 border border-[var(--color-border)] rounded-sm">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] font-semibold mb-1">
              General
            </p>
            <a href="mailto:hello@24ghanta.com" className="text-[var(--color-primary)] link-underline text-sm">
              hello@24ghanta.com
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
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
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
            <input
              id="subject"
              type="text"
              required
              value={form.subject}
              onChange={update('subject')}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="message"
              required
              rows={6}
              value={form.message}
              onChange={update('message')}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-y"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" variant="primary" isLoading={status === 'sending'}>
              Send Message
            </Button>
            {status === 'sent' && (
              <span className="text-sm text-[var(--color-success)] animate-fade-in">
                Thanks — we received your message.
              </span>
            )}
            {status === 'error' && error && (
              <span className="text-sm text-[var(--color-error)]">{error}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
