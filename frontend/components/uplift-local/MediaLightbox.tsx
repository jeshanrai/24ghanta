'use client';

import Image from 'next/image';
import { useEffect, useCallback, useState, useRef } from 'react';
import type { LocalMedia } from '@/lib/data/upliftLocalMedia';

interface Comment {
  id: string;
  username: string;
  text: string;
  timeAgo: string;
}

const mockComments: Comment[] = [
  { id: '1', username: 'rahul_sharma', text: 'Amazing capture! Love this place', timeAgo: '2h' },
  { id: '2', username: 'priya_patel', text: 'This is so beautiful', timeAgo: '3h' },
  { id: '3', username: 'amit_kumar', text: 'Need to visit here soon!', timeAgo: '5h' },
  { id: '4', username: 'sneha_gupta', text: 'Incredible shot', timeAgo: '6h' },
  { id: '5', username: 'vikram_singh', text: 'Love the colors in this', timeAgo: '8h' },
];

interface MediaLightboxProps {
  media: LocalMedia;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function MediaLightbox({ media, onClose, onPrev, onNext }: MediaLightboxProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const formatLikes = (likes: number): string => {
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}k`;
    }
    return likes.toString();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    },
    [onClose, onPrev, onNext]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0 && onNext) {
        onNext();
      } else if (diffX < 0 && onPrev) {
        onPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col lg:items-center lg:justify-center lg:bg-black/90 lg:backdrop-blur-sm lg:p-4"
      onClick={handleBackdropClick}
    >
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-black text-white">
        <button onClick={onClose} className="p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c41d2f] to-[#d97706] flex items-center justify-center text-white text-[10px] font-bold">
            24
          </div>
          <span className="font-semibold text-sm">24ghanta_local</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Desktop Close button */}
      <button
        onClick={onClose}
        className="hidden lg:flex absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
        aria-label="Close"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Desktop Previous button */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Desktop Next button */}
      {onNext && (
        <button
          onClick={onNext}
          className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
          aria-label="Next"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div className="flex-1 lg:flex-none bg-black lg:bg-white lg:rounded-lg overflow-hidden lg:max-w-6xl w-full lg:max-h-[90vh] flex flex-col lg:flex-row lg:mx-16">
        {/* Media */}
        <div
          className="relative bg-black flex-1 lg:flex-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full lg:h-[80vh]">
            {media.type === 'image' ? (
              <Image
                src={media.mediaUrl}
                alt={media.caption || 'Local media'}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Image
                  src={media.thumbnailUrl}
                  alt={media.caption || 'Video thumbnail'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile navigation arrows */}
          <div className="lg:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
            {onPrev && (
              <button
                onClick={onPrev}
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div />
            {onNext && (
              <button
                onClick={onNext}
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Actions Bar */}
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="p-3">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setIsLiked(!isLiked)}>
                <svg
                  className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`}
                  fill={isLiked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button onClick={() => setShowComments(!showComments)}>
                <svg className="w-7 h-7 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button>
                <svg className="w-7 h-7 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <p className="font-semibold text-sm text-gray-900">{formatLikes(media.likes + (isLiked ? 1 : 0))} likes</p>
            {media.caption && (
              <p className="text-sm mt-1">
                <span className="font-semibold">24ghanta_local</span> {media.caption}
              </p>
            )}
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-gray-500 mt-1"
            >
              View all {mockComments.length} comments
            </button>
          </div>
        </div>

        {/* Mobile Comments Bottom Sheet */}
        {showComments && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowComments(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-4 pb-2 border-b border-gray-200">
                <h3 className="font-semibold text-center">Comments</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mockComments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{c.username}</span>{' '}
                        <span className="text-gray-700">{c.text}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{c.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none py-2"
                  />
                  <button
                    className={`text-sm font-semibold ${comment ? 'text-[#c41d2f]' : 'text-[#c41d2f]/40'}`}
                    disabled={!comment}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Right side - Comments */}
        <div className="hidden lg:flex lg:w-[420px] lg:min-w-[420px] flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c41d2f] to-[#d97706] flex items-center justify-center text-white text-xs font-bold">
              24
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">24ghanta_local</p>
              {media.location && (
                <p className="text-xs text-gray-500">{media.location}</p>
              )}
            </div>
          </div>

          {/* Caption and Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption */}
            {media.caption && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c41d2f] to-[#d97706] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  24
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">24ghanta_local</span>{' '}
                    <span className="text-gray-700">{media.caption}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">1h</p>
                </div>
              </div>
            )}

            {/* Comments */}
            {mockComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                <div>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">{c.username}</span>{' '}
                    <span className="text-gray-700">{c.text}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{c.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="hover:opacity-70 transition-opacity"
              >
                <svg
                  className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`}
                  fill={isLiked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button className="hover:opacity-70 transition-opacity">
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="hover:opacity-70 transition-opacity">
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <p className="font-semibold text-sm text-gray-900 mb-2">
              {formatLikes(media.likes + (isLiked ? 1 : 0))} likes
            </p>

            {/* Comment input */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                className={`text-sm font-semibold ${
                  comment ? 'text-[#c41d2f]' : 'text-[#c41d2f]/40'
                }`}
                disabled={!comment}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
