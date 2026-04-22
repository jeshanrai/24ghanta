import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - 24Ghanta',
  description: 'How 24Ghanta collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="container py-10 lg:py-14 animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wide">
            Privacy Policy
          </h1>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us (for example, when you
              subscribe to our newsletter or create an account) and information gathered
              automatically through cookies and analytics (pages viewed, device type,
              approximate location).
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">2. How We Use Information</h2>
            <p>
              Your information helps us deliver and improve our services, personalise
              content, send newsletters you have opted in to, and comply with legal
              obligations. We do not sell personal information.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">3. Cookies</h2>
            <p>
              We use first-party and third-party cookies to remember your preferences,
              measure site performance and serve relevant advertising. You can disable
              cookies in your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">4. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of the personal data
              we hold about you. To exercise these rights, email us via the{' '}
              <a href="/contact" className="text-[var(--color-primary)] link-underline">contact page</a>.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">5. Contact</h2>
            <p>
              Questions about this policy? Reach us at{' '}
              <a href="mailto:privacy@24ghanta.com" className="text-[var(--color-primary)] link-underline">
                privacy@24ghanta.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
