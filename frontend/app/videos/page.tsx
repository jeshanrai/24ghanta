import type { Metadata } from 'next';
import { fetchLatestVideos } from '@/lib/api';
import { VideoCard } from '@/components/cards';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Videos - 24Ghanta',
  description:
    'Watch the latest news videos, interviews, live events, and highlights from 24Ghanta.',
};

export default async function VideosPage() {
  const videos = await fetchLatestVideos(40);

  return (
    <div className="container py-8 lg:py-12 animate-fade-in-up">
      <div className="flex items-center mb-8 animate-fade-in-left">
        <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
        <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wide">
          Videos
        </h1>
      </div>

      {videos.length === 0 ? (
        <p className="text-[var(--color-text-secondary)]">No videos published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, idx) => (
            <div
              key={video.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
