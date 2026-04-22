import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - 24Ghanta',
  description: 'The terms and conditions that govern your use of 24Ghanta.',
};

export default function TermsPage() {
  return (
    <div className="container py-10 lg:py-14 animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wide">
            Terms of Service
          </h1>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">1. Acceptance</h2>
            <p>
              By accessing 24Ghanta you agree to be bound by these Terms. If you do not
              agree, please do not use the site.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">2. Content Ownership</h2>
            <p>
              All articles, videos, images and trademarks on this site are the property
              of 24Ghanta or its licensors. You may share links to our content but may
              not republish it without written permission.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">3. User Conduct</h2>
            <p>
              When commenting or submitting content, you agree not to post anything
              unlawful, defamatory, infringing or harmful. We reserve the right to
              remove content and suspend accounts that violate these rules.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">4. Disclaimer</h2>
            <p>
              Content is provided on an &quot;as is&quot; basis. While we strive for
              accuracy, 24Ghanta is not liable for errors, omissions or actions taken
              based on information published here.
            </p>
          </div>

          <div>
            <h2 className="text-h2 font-bold text-[var(--color-text-primary)] mb-2">5. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of the site
              after changes constitutes acceptance of the revised Terms.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
