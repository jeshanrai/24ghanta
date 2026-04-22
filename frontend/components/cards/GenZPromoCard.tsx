import Link from 'next/link';
import Image from 'next/image';

export function GenZPromoCard() {
  return (
    <Link href="/genz" className="block group">
      <div className="relative overflow-hidden rounded-sm h-[180px]">
        {/* Background Image */}
        <Image
          src="https://picsum.photos/seed/genz/400/300"
          alt="Gen Z"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF6B6B] transition-colors">
            Gen Z
          </h3>

          {/* Description */}
          <p className="text-sm text-white/80 mb-3 leading-relaxed">
            Trending news, viral stories, and everything Gen Z cares about.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#FF6B6B] group-hover:text-[#FFE66D] transition-colors">
            <span>Explore now</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
