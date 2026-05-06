import { UpliftLocalHeader, MediaGrid } from '@/components/uplift-local';
import { getUpliftLocalMedia } from '@/lib/data/upliftLocalMedia';

export default function UpliftLocalPage() {
  const media = getUpliftLocalMedia();

  return (
    <div className="min-h-screen" style={{ background: 'var(--uplift-bg, #f8f4f0)' }}>
      <div className="container py-6">
        <UpliftLocalHeader />
        <div className="mt-6">
          <MediaGrid media={media} />
        </div>
      </div>
    </div>
  );
}
