import { PlayIcon } from '@/components/icons';

export function PlayOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <span
          className="absolute inset-0 rounded-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ animation: 'pulse-ring 1.8s cubic-bezier(0.25,0.8,0.25,1) infinite' }}
          aria-hidden="true"
        />
        <div className="relative w-14 h-14 flex items-center justify-center bg-white/90 rounded-full shadow-lg group-hover:bg-white group-hover:scale-110 transition-all duration-300 ease-out">
          <PlayIcon size={24} className="text-[var(--color-primary)] ml-1" />
        </div>
      </div>
    </div>
  );
}
