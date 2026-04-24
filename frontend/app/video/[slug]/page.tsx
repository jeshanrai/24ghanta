import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchVideoBySlug, fetchLatestVideos } from '@/lib/api';
import { VideoCard } from '@/components/cards';
import { OptimizedImage, Badge } from '@/components/ui';
import { formatDate, formatDuration } from '@/lib/utils';
import { PlayIcon } from '@/components/icons';

export const revalidate = 30;

interface VideoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await fetchVideoBySlug(slug);

  if (!video) return { title: 'Video not found - 24Ghanta' };

  return {
    title: `${video.title} - 24Ghanta`,
    description: video.description ?? video.title,
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = await fetchVideoBySlug(slug);

  if (!video) notFound();

  const allVideos = await fetchLatestVideos(12);
  const related = allVideos
    .filter((v) => v.slug !== slug && v.category.slug === video.category.slug)
    .slice(0, 4);
  const viewsLabel = typeof video.views === 'number'
    ? `${video.views.toLocaleString()} views`
    : null;

  return (
    <div className="container py-8 lg:py-10 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Player area */}
          <div className="relative aspect-video rounded-sm overflow-hidden bg-black">
            {video.embedUrl ? (
              <iframe
                src={video.embedUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : video.videoUrl ? (
              <video
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                controls
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <>
                <OptimizedImage
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  priority
                  containerClassName="absolute inset-0"
                  className="opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 flex items-center justify-center bg-white/95 rounded-full shadow-lg">
                    <PlayIcon size={32} className="text-[var(--color-primary)] ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded bg-black/70 text-white">
                  Preview · {formatDuration(video.durationSeconds)}
                </span>
              </>
            )}
          </div>

          {/* Meta */}
          <div className="mt-5">
            <Badge color={video.category.color} className="mb-3">
              {video.category.name}
            </Badge>
            <h1 className="font-headline text-h1 lg:text-hero text-[var(--color-text-primary)] mb-3">
              {video.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span>{formatDate(video.publishedAt)}</span>
              <span>•</span>
              <span>{formatDuration(video.durationSeconds)}</span>
              {viewsLabel && (
                <>
                  <span>•</span>
                  <span>{viewsLabel}</span>
                </>
              )}
            </div>
            {video.description && (
              <p className="mt-5 text-[var(--color-text-secondary)] leading-relaxed">
                {video.description}
              </p>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="flex items-center mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
            <h2 className="text-h2 font-bold">Related Videos</h2>
          </div>
          {related.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No related videos yet.{' '}
              <Link href="/videos" className="text-[var(--color-primary)] link-underline">
                Browse all videos
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {related.map((v, idx) => (
                <div
                  key={v.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <VideoCard video={v} />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
