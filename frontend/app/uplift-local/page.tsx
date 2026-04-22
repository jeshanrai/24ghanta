'use client';

import { UpliftLocalHeader, MediaGrid } from '@/components/uplift-local';
import { getUpliftLocalMedia } from '@/lib/data/upliftLocalMedia';

export default function UpliftLocalPage() {
  const media = getUpliftLocalMedia();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-5xl mx-auto px-4">
        <UpliftLocalHeader />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <MediaGrid media={media} />
      </div>
    </div>
  );
}
