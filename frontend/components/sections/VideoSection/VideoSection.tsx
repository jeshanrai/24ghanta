import type { Video } from '@/lib/types';
import { SectionBlock } from '@/components/sections/SectionBlock';
import { VideoCard } from '@/components/cards';

interface VideoSectionProps {
  title?: string;
  videos: Video[];
  href?: string;
}

export function VideoSection({
  title = 'Most Watched Videos',
  videos,
  href = '/videos',
}: VideoSectionProps) {
  if (videos.length === 0) return null;

  return (
    <SectionBlock title={title} href={href}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.slice(0, 4).map((video, idx) => (
          <div
            key={video.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}
