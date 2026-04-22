'use client';

export function GenZHeader() {
  return (
    <div className="relative py-12 overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-30 genz-animate-gradient"
        style={{
          background: 'linear-gradient(45deg, #FF6B6B, #FFE66D, #4ECDC4, #AA96DA, #F38181, #FF6B6B)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating shapes decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-[10%] w-20 h-20 rounded-full bg-[#FF6B6B]/20 blur-xl genz-animate-float" />
        <div className="absolute top-20 right-[15%] w-32 h-32 rounded-full bg-[#4ECDC4]/20 blur-xl genz-animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-10 left-[30%] w-24 h-24 rounded-full bg-[#AA96DA]/20 blur-xl genz-animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-5 right-[25%] w-16 h-16 rounded-full bg-[#FFE66D]/20 blur-xl genz-animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Main title with gradient */}
        <h1 className="genz-heading-xl mb-2">
          <span
            className="bg-clip-text text-transparent genz-animate-gradient"
            style={{
              background: 'linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #AA96DA)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
            }}
          >
            GEN Z
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-[var(--genz-text-muted)] text-lg font-medium tracking-wide uppercase">
          trending now ✨
        </p>

        {/* Decorative line */}
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
          <div className="w-2 h-2 rounded-full bg-[#FFE66D]" />
          <div className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
          <div className="w-2 h-2 rounded-full bg-[#AA96DA]" />
          <div className="w-2 h-2 rounded-full bg-[#F38181]" />
        </div>
      </div>
    </div>
  );
}
