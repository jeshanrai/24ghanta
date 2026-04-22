import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/24ghantalogo.jpg"
        alt="24 Ghanta"
        width={40}
        height={40}
        className="h-10 w-10 rounded"
        priority
      />
      <div className="flex items-center">
        <span className="text-2xl font-bold text-[var(--color-primary)]">24</span>
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">Ghanta</span>
      </div>
    </Link>
  );
}
