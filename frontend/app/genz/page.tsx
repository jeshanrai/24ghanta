'use client';

import { useState } from 'react';
import { GenZHeader, GenZCard, TrendingTags, defaultTrendingTags } from '@/components/genz';
import { getGenzArticles } from '@/lib/data/genzArticles';

const allArticles = getGenzArticles();

export default function GenZPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const articles = selectedTag
    ? allArticles.filter((a) =>
        a.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      )
    : allArticles;

  return (
    <div className="genz-theme min-h-screen" style={{ background: 'var(--genz-bg)' }}>
      <div className="container">
        <GenZHeader />

        <div className="py-4">
          <TrendingTags
            tags={defaultTrendingTags}
            selectedTag={selectedTag}
            onTagClick={(id) => setSelectedTag((prev) => (prev === id ? null : id))}
          />
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {articles.map((article, i) => (
              <GenZCard key={article.id} article={article} colorIndex={i} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-(--genz-text-muted)">
            <p className="text-4xl mb-3">😶</p>
            <p className="text-lg font-semibold">No stories for #{selectedTag} yet</p>
            <button
              onClick={() => setSelectedTag(null)}
              className="mt-4 text-sm underline text-(--genz-text-muted) hover:text-(--genz-text)"
            >
              Show all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
