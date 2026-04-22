import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - 24Ghanta',
  description:
    'Learn about 24Ghanta, our mission to bring you accurate breaking news, live updates, and comprehensive coverage of events that matter.',
};

export default function AboutPage() {
  return (
    <div className="container py-10 lg:py-14 animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
          <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
            About 24Ghanta
          </h1>
        </div>

        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-6">
          24Ghanta brings you round-the-clock news coverage — accurate, independent and
          fast. From breaking headlines to deep-dive reporting, we keep you informed on
          the stories that matter.
        </p>

        <h2 className="text-h2 font-bold mt-10 mb-3">Our Mission</h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
          To deliver factual, timely and unbiased journalism to readers across India and
          around the world. We believe an informed audience is the foundation of a
          healthy democracy.
        </p>

        <h2 className="text-h2 font-bold mt-10 mb-3">What We Cover</h2>
        <ul className="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
          <li>Breaking news and live updates from India and the world</li>
          <li>Politics, business, sports, entertainment and technology</li>
          <li>Health, lifestyle, science and long-form features</li>
          <li>Stories from the community through our Uplift Local initiative</li>
        </ul>

        <h2 className="text-h2 font-bold mt-10 mb-3">Editorial Standards</h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          Every story we publish is verified by our editorial team. Corrections are made
          transparently and promptly. If you spot an error, please reach out via our{' '}
          <a href="/contact" className="text-[var(--color-primary)] link-underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
