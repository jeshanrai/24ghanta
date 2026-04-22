import Link from 'next/link';
import Image from 'next/image';

const previewImages = [
  'https://picsum.photos/seed/local1/200/200',
  'https://picsum.photos/seed/local4/200/200',
  'https://picsum.photos/seed/local7/200/200',
  'https://picsum.photos/seed/local12/200/200',
];

export function UpliftLocalPromoCard() {
  return (
    <Link href="/uplift-local" className="block group">
      <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-[#f8f4f0] to-[#efe8e0] p-5 ">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#c41d2f]/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-[#d97706]/10 blur-2xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c41d2f] text-white text-xs font-bold uppercase tracking-wide mb-3">
            <span>Local</span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-2 group-hover:text-[#c41d2f] transition-colors">
            Uplift Local
          </h3>

          {/* Description */}
          <p className="text-sm text-[#6b6b6b] mb-3 leading-relaxed">
            Celebrating our community through photos and videos.
          </p>

          {/* Image grid */}
          <div className="flex gap-1 mb-3">
            {previewImages.map((src, index) => (
              <div key={index} className="relative w-6 h-6 rounded-sm overflow-hidden">
                <Image
                  src={src}
                  alt={`Local preview ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="24px"
                />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#c41d2f] group-hover:text-[#a31825] transition-colors">
            <span>View gallery</span>
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

        {/* Icon decoration */}
        <div className="absolute bottom-3 right-3 text-2xl opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all">
          📍
        </div>
      </div>
    </Link>
  );
}
