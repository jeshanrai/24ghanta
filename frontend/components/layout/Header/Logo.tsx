import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <Image
        src="/24ghantalogo.jpg"
        alt="24 Ghanta icon"
        width={48}
        height={48}
        className="h-10 w-10 rounded-md object-contain"
        priority
      />
      <Image
        src="/24 GHANTA BLACK.png"
        alt="24 Ghanta"
        width={160}
        height={45}
        className="h-8 w-auto object-contain"
        priority
      />
    </Link>
  );
}

