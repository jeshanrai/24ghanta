import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <Image
        src="/24ghantalogo.jpg"
        alt="24 Ghanta Icon"
        width={40}
        height={40}
        className="h-10 w-10 rounded object-contain"
        priority
      />
    </Link>
  );
}
