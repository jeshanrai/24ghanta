import { PlayIcon } from '@/components/icons';

export function PlayOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-14 h-14 flex items-center justify-center bg-white/90 rounded-full shadow-lg group-hover:bg-white group-hover:scale-110 transition-all duration-200">
        <PlayIcon size={24} className="text-[var(--color-primary)] ml-1" />
      </div>
    </div>
  );
}
