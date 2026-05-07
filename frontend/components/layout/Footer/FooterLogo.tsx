import Link from 'next/link';

interface FooterLogoProps {
  centered?: boolean;
}

export function FooterLogo({ centered = false }: FooterLogoProps) {
  return (
    <div className={`mb-5 md:mb-6 ${centered ? 'flex flex-col items-center' : ''}`}>
      <Link href="/" className="inline-flex items-center gap-1">
        <span className="text-3xl font-bold text-[var(--color-primary)]">24</span>
        <span className="text-3xl font-bold text-white">Ghanta</span>
      </Link>
      <p
        className={`mt-3 text-sm leading-relaxed text-gray-400 ${
          centered ? 'text-center max-w-[280px]' : 'max-w-xs'
        }`}
      >
        Your trusted source for breaking news and live updates from India and around the world.
      </p>
    </div>
  );
}
