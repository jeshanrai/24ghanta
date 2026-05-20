'use client';

import { useEffect, useState } from 'react';
import { mainNavItems } from '@/lib/constants';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface NavCategory {
  id: string;
  label: string;
  href: string;
}

const FALLBACK: NavCategory[] = mainNavItems.map((item) => ({
  id: item.id,
  label: item.label,
  href: item.href,
}));

// Module-level promise so MainNav and MobileMenu share one in-flight fetch.
// Resolves once per page load; React Query / SWR would be overkill for a
// single static-ish endpoint.
let cached: Promise<NavCategory[]> | null = null;

function fetchNavCategories(): Promise<NavCategory[]> {
  if (cached) return cached;
  cached = fetch(`${API}/api/categories/nav`)
    .then((r) => (r.ok ? r.json() : null))
    .then((payload) => {
      const rows = payload?.data;
      if (!Array.isArray(rows) || rows.length === 0) return FALLBACK;
      return rows.map((r: { id: string; name: string; slug: string }) => ({
        id: r.id,
        label: r.name,
        href: `/category/${r.slug}`,
      }));
    })
    .catch(() => FALLBACK);
  return cached;
}

export function useNavCategories(): NavCategory[] {
  // Start with the fallback so the first paint matches SSR and there's no
  // empty-header flash. The fetch swaps in live data once it arrives.
  const [items, setItems] = useState<NavCategory[]>(FALLBACK);
  useEffect(() => {
    let cancelled = false;
    fetchNavCategories().then((rows) => {
      if (!cancelled) setItems(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
}
