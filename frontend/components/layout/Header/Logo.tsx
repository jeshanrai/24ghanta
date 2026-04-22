import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <Image
        src="/24ghantalogo.jpg"
        alt="24 Ghanta"
        width={40}
        height={40}
        className="h-10 w-10 rounded transition-transform duration-500 ease-out group-hover:rotate-[-6deg] group-hover:scale-105"
        priority
      />
      <div className="flex items-center">
        <span className="text-2xl font-bold text-[var(--color-primary)] transition-colors duration-300">24</span>
        <span className="text-2xl font-bold text-[var(--color-text-primary)] transition-colors duration-300 group-hover:text-[var(--color-primary)]">Ghanta</span>
      </div>
    </Link>
  );
}
