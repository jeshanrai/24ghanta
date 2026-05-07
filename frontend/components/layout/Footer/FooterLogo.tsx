import Link from 'next/link';
import Image from 'next/image';

interface FooterLogoProps {
  centered?: boolean;
}

export function FooterLogo({ centered = false }: FooterLogoProps) {
  return (
    <div className={`mb-5 md:mb-6 ${centered ? 'flex flex-col items-center' : ''}`}>
      <Link href="/" className="inline-flex items-center">
        <Image
          src="/24 GHANTA WHITE.png"
          alt="24 Ghanta"
          width={180}
          height={60}
          className="h-10 w-auto object-contain"
          priority
        />
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

