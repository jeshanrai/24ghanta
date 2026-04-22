'use client';

import { useState } from 'react';
import { GenZHeader, GenZCard, TrendingTags, defaultTrendingTags } from '@/components/genz';
import { getGenzArticles } from '@/lib/data';

export default function GenZPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const articles = getGenzArticles();

  const filteredArticles = selectedTag
    ? articles.filter((article) => article.tags.includes(selectedTag))
    : articles;

  const handleTagClick = (tagId: string) => {
    setSelectedTag(selectedTag === tagId ? null : tagId);
  };

  return (
    <div className="genz-theme min-h-screen bg-[var(--genz-bg)]">
      {/* Header */}
      <div className="container">
        <GenZHeader />
      </div>

      {/* Trending Tags */}
      <div className="container mb-8">
        <TrendingTags
          tags={defaultTrendingTags}
          selectedTag={selectedTag}
          onTagClick={handleTagClick}
        />
      </div>

      {/* Articles Grid */}
      <div className="container pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map((article, index) => (
            <GenZCard
              key={article.id}
              article={article}
              colorIndex={index}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🙈</p>
            <h3 className="text-2xl font-bold text-[var(--genz-text)] mb-2">
              No posts found
            </h3>
            <p className="text-[var(--genz-text-muted)]">
              Try selecting a different tag
            </p>
            <button
              onClick={() => setSelectedTag(null)}
              className="mt-4 px-6 py-2 bg-[var(--genz-coral)] text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Footer decoration */}
      <div className="container pb-8">
        <div className="flex justify-center gap-2">
          <span className="text-[var(--genz-text-dim)]">made with</span>
          <span className="text-[var(--genz-coral)]">❤️</span>
          <span className="text-[var(--genz-text-dim)]">for gen z</span>
        </div>
      </div>
    </div>
  );
}
