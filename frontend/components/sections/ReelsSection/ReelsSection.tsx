'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, ExternalLink, X } from 'lucide-react';
import {
  TiktokIcon,
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
} from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Public social profiles — same URLs the footer points to, so the reels
// rail header doubles as a follow CTA without diverging from the rest of
// the site.
const SOCIAL_LINKS: { id: string; label: string; href: string; Icon: typeof TiktokIcon; brand: string }[] = [
  { id: 'tiktok',    label: 'TikTok',    href: 'https://www.tiktok.com/@24ghanta_nepal',         Icon: TiktokIcon,    brand: 'hover:bg-black hover:text-white hover:border-black' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/24ghantanepal/',       Icon: InstagramIcon, brand: 'hover:bg-gradient-to-tr hover:from-[#feda75] hover:via-[#d62976] hover:to-[#4f5bd5] hover:text-white hover:border-transparent' },
  { id: 'facebook',  label: 'Facebook',  href: 'https://www.facebook.com/24GhantaNepal/',        Icon: FacebookIcon,  brand: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]' },
  { id: 'youtube',   label: 'YouTube',   href: 'https://www.youtube.com/@24GhantaNepal',         Icon: YouTubeIcon,   brand: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]' },
];

type Platform = 'tiktok' | 'instagram' | 'youtube';

interface ReelRow {
  id: number;
  platform: Platform;
  url: string;
  caption: string;
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

const PLATFORM_ICON: Record<Platform, typeof TiktokIcon> = {
  tiktok: TiktokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
};

// TikTok / IG / FB iframes are cross-origin, so there's no JS hook for
// "video ended". These are aggressive upper bounds tuned to short-clip
// reality — TikTok's "Up Next" recommendation grid surfaces shortly after
// the first play loop, so we flip to our own overlay around then. Longer
// clips get cut early on purpose; the manual close button on the card
// gives users an escape hatch either way.
const FALLBACK_DURATION_MS: Record<Platform, number> = {
  tiktok: 15_000,
  instagram: 18_000,
  youtube: 0, // unused — YouTube uses the real IFrame Player API
};

// TikTok URLs look like https://www.tiktok.com/@user/video/<numeric id>;
// extract the numeric id for the official embed blockquote.
function extractTikTokId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

// YouTube can be watch?v=, youtu.be/, /shorts/, or /embed/ — all
// resolve to the same 11-char id we feed into the /embed/ URL.
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Mirrors `validatePermalink` in the admin form / backend route. Rows
// that pre-date the validation rules (or that bypassed it somehow) get
// rendered as a static "View on <Platform>" fallback card so the
// homepage rail never loads a known-bad iframe (which would trip
// Chrome's X-Frame-Options: deny error and break the surrounding rail).
function isEmbeddablePermalink(platform: Platform, rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  switch (platform) {
    case 'tiktok':
      return (
        (/(^|\.)tiktok\.com$/.test(host) && /\/video\/\d+/.test(path)) ||
        /(^|\.)vm\.tiktok\.com$/.test(host) ||
        /(^|\.)vt\.tiktok\.com$/.test(host)
      );
    case 'instagram':
      return /(^|\.)instagram\.com$/.test(host) && /^\/(p|reel|tv)\/[^/]+\/?$/.test(path);

    case 'youtube':
      return extractYouTubeId(rawUrl) !== null;
  }
}

interface YTPlayer {
  destroy(): void;
  getCurrentTime?(): number;
  getDuration?(): number;
}

interface YTPlayerEvent {
  data: number;
}

interface YTPlayerConstructor {
  new (
    element: HTMLElement | string,
    options: {
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: YTPlayerEvent) => void;
      };
    },
  ): YTPlayer;
}

declare global {
  interface Window {
    instgrm?: { Embeds?: { process: () => void } };
    YT?: {
      Player: YTPlayerConstructor;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Instagram + Facebook expose clean per-node processors (`instgrm.Embeds.
// process()` / `FB.XFBML.parse(el)`) we can call after our blockquotes
// mount. Memoized promises resolve when those globals appear so the
// individual embed components can `await` them on mount AND on replay.
const sdkPromises: { instagram?: Promise<void> } = {};

function loadSdk(
  key: 'instagram',
  src: string,
  isReady: () => boolean,
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (isReady()) return Promise.resolve();
  const cached = sdkPromises[key];
  if (cached) return cached;

  const p = new Promise<void>((resolve) => {
    if (!document.querySelector(`script[data-reels-sdk="${key}"]`)) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-reels-sdk', key);
      document.body.appendChild(s);
    }
    const start = Date.now();
    const tick = window.setInterval(() => {
      if (isReady()) {
        window.clearInterval(tick);
        resolve();
      } else if (Date.now() - start > 15_000) {
        // Give up after 15s; the embed will render the "View on X"
        // fallback link instead of a player.
        window.clearInterval(tick);
        resolve();
      }
    }, 100);
  });
  sdkPromises[key] = p;
  return p;
}

function loadInstagramSdk() {
  return loadSdk(
    'instagram',
    'https://www.instagram.com/embed.js',
    () => Boolean(window.instgrm?.Embeds?.process),
  );
}

// TikTok's embed.js works differently: it doesn't expose a per-node
// processor, only an auto-scanner that runs at load time + a MutationObserver
// for new blockquotes added later. The problem is once it has processed a
// blockquote (replaced it with an iframe), re-mounting a fresh blockquote
// of the same data-video-id is sometimes ignored. The reliable fix is to
// re-inject the script tag on every mount: removing + re-adding forces a
// fresh scan over the current DOM.
function reloadTikTokSdk() {
  if (typeof window === 'undefined') return;
  document.querySelectorAll('script[data-reels-sdk="tiktok"]').forEach((s) => s.remove());
  const s = document.createElement('script');
  s.src = 'https://www.tiktok.com/embed.js';
  s.async = true;
  s.setAttribute('data-reels-sdk', 'tiktok');
  document.body.appendChild(s);
}

// One-shot loader for YouTube's IFrame Player API. The script defines a
// global `onYouTubeIframeAPIReady` callback, and once loaded any number of
// players can be created without reloading the script. We resolve a single
// promise when the API is ready so individual cards can `await` it.
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const prior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prior?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.body.appendChild(s);
  });
  return ytApiPromise;
}

export function ReelsSection() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/reels`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (cancelled) return;
        setReels(Array.isArray(json?.data) ? json.data : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // SDK loading is owned by each *Embed component now — they call
  // load…Sdk() on mount and process their own node when it resolves.
  // That way replay re-mounts get a fresh process() call even after
  // the initial page-load scan has finished.

  function scrollBy(direction: 1 | -1) {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-reel-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  }

  if (loaded && reels.length === 0) return null;

  return (
    <section className="animate-fade-in-up -mt-10">
      {/* Header — underline style, matches the "Top stories / Business"
          pattern used by category sections. Right side carries follow
          pills + (desktop only) scroll arrows. */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1"
              style={{ color: 'var(--color-primary)' }}
            >
              Watch &amp; Follow
            </p>
            <h2
              className="font-headline font-bold text-[var(--color-text-primary)] tracking-tight uppercase"
              style={{ fontSize: 'clamp(1.375rem, 3.5vw, 1.875rem)' }}
            >
              Reels &amp; Shorts
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow 24Ghanta on ${s.label}`}
                title={`Follow on ${s.label}`}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-all duration-200 ${s.brand}`}
              >
                <s.Icon size={16} />
              </a>
            ))}

            <span aria-hidden="true" className="hidden md:inline-block w-px h-6 bg-[var(--color-border)] mx-1" />

            <button
              type="button"
              aria-label="Scroll reels left"
              onClick={() => scrollBy(-1)}
              className="hidden md:inline-flex w-9 h-9 rounded-full border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)] hover:border-[var(--color-border-dark)] items-center justify-center text-[var(--color-text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll reels right"
              onClick={() => scrollBy(1)}
              className="hidden md:inline-flex w-9 h-9 rounded-full border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)] hover:border-[var(--color-border-dark)] items-center justify-center text-[var(--color-text-primary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-16 rounded-full animate-expand-x bg-[var(--color-primary)]" />
      </div>

      <div
        ref={railRef}
        className="reels-rail flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
      >
        {reels.map((v) => (
          <ReelCard key={v.id} reel={v} />
        ))}
      </div>

      <style jsx global>{`
        .reels-rail::-webkit-scrollbar {
          height: 6px;
        }
        .reels-rail::-webkit-scrollbar-track {
          background: transparent;
        }
        .reels-rail::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }
        .reels-rail::-webkit-scrollbar-thumb:hover {
          background: var(--color-border-dark);
        }
        /* Every embed renders inside the .reel-frame 9:16 box; pin it
           to fill that box and let overflow:hidden on the parent clip
           anything taller (IG captions, FB's plugin chrome, etc.). The
           !important is needed because the platform SDKs inject their
           own inline width/max-width styles. */
        .reels-rail .reel-frame > div {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          min-width: 0 !important;
        }
        /* Platform iframes inside their wrapper elements also need to
           stretch — the SDKs hardcode width attributes. */
        .reels-rail .reel-frame iframe {
          width: 100% !important;
          min-width: 0 !important;
          border: 0 !important;
        }
        /* YouTube needs explicit height 100%. Instagram and TikTok 
           SDKs calculate and inject their own heights which we want to preserve 
           so the video itself isn't shrunk or clipped incorrectly. The parent 
           frame's overflow:hidden will crop their excess caption height. */
        .reels-rail .youtube-embed iframe {
          height: 100% !important;
        }
        /* YouTube wrapper has no children to position absolutely — its
           single iframe is the direct child, already covered above. */
        .reels-rail .youtube-embed {
          background: #000;
        }
        /* Instagram + TikTok embeds wrap their iframes in scrollable
           containers and inject extra chrome (caption blocks, attribution
           bars) that we don't want consuming vertical space. Clip them. */
        .reels-rail .reel-frame {
          overflow: hidden;
        }
        /* Safety net: if the overlay's content somehow exceeds the
           card's 9:16 footprint (narrow mobile, long platform name),
           let it scroll vertically inside the card rather than push
           the rail layout. */
        .reels-rail .reel-frame > .reel-overlay {
          overflow-y: auto;
        }
      `}</style>
    </section>
  );
}

// One reel = one card. The card owns "ended" state so we can swap the
// platform embed for our own Replay / Source overlay before the platform's
// own recommendation UI takes over. YouTube uses the real IFrame Player
// API to detect end; TikTok / Instagram / Facebook iframes are cross-
// origin and expose no playback events, so for them we start a per-
// platform timer the first time the card scrolls into view.
function ReelCard({ reel }: { reel: ReelRow }) {
  const [ended, setEnded] = useState(false);
  // Bumping `nonce` forces the embed to re-mount, which is how Replay
  // works for every platform without us having to talk to each SDK.
  const [nonce, setNonce] = useState(0);

  const replay = useCallback(() => {
    setEnded(false);
    setNonce((n) => n + 1);
  }, []);

  const handleEnded = useCallback(() => {
    setEnded(true);
  }, []);

  // Hard-guard: a non-embeddable URL (e.g. an IG profile page that
  // sends X-Frame-Options: deny) would otherwise blow up the rail with
  // a Chrome error iframe. Render a static "open in app" card instead.
  // Facebook is included — we try to embed FB videos inline via the
  // plugin URL. Videos FB refuses for copyright will show FB's own
  // "Unavailable" message inside the iframe; that's a content-side
  // restriction we can't bypass from our code.
  const embeddable = isEmbeddablePermalink(reel.platform, reel.url);

  return (
    <div
      data-reel-card
      className="snap-start shrink-0 w-[min(85vw,340px)] sm:w-[340px]"
    >
      {/* Hard 9:16 aspect-ratio container. Every embed renders absolutely
          inside this box so platforms that try to render at their own
          intrinsic height (IG with captions, FB plugin iframe) get clipped
          to the rail's uniform card size instead of stretching it. */}
      <div className="reel-frame relative w-full aspect-[9/16] bg-white border border-[var(--color-border-light)] rounded-md overflow-hidden">
        {!embeddable ? (
          <UnsupportedOverlay reel={reel} />
        ) : (
          <>
            {!ended && (
              <>
                <EmbedSwitch key={nonce} reel={reel} onEnded={handleEnded} />
                {/* Manual escape hatch: lets the user flip to our overlay
                    immediately if the platform's recommendation UI is about
                    to appear. Sits above the embed in the corner; pointer
                    events are scoped to the button itself so the iframe
                    stays fully interactive. */}
                <button
                  type="button"
                  onClick={handleEnded}
                  aria-label="Hide reel"
                  title="Hide reel"
                  className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {ended && <EndOverlay reel={reel} onReplay={replay} />}
          </>
        )}
      </div>
      {/* Instagram already renders the caption inside the embed itself,
          so suppress ours to avoid duplication. Other platforms don't
          show a caption in the embed, so we add one here. */}
      {reel.caption && reel.platform !== 'instagram' && (
        <p
          className="text-[12px] leading-snug text-[var(--color-text-secondary)] mt-2 line-clamp-1"
          title={reel.caption}
        >
          {reel.caption}
        </p>
      )}
    </div>
  );
}

// Rendered in place of the embed when a reel's URL isn't a permalink the
// platform will iframe — e.g. an Instagram profile URL. We don't mount
// the embed at all so we never trip an X-Frame-Options error in the
// console. The card still occupies the same footprint so the rail
// layout doesn't shift.
function UnsupportedOverlay({ reel }: { reel: ReelRow }) {
  const Icon = PLATFORM_ICON[reel.platform];
  return (
    <div
      className="reel-overlay bg-gradient-to-b from-[var(--color-surface)] to-white flex flex-col items-center justify-center px-4 py-5 text-center"
      role="region"
      aria-label="Reel cannot be embedded"
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[var(--color-border)] shadow-sm flex items-center justify-center mb-3 text-[var(--color-text-primary)] shrink-0">
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        Open in app
      </p>
      <p className="font-headline text-sm font-bold text-[var(--color-text-primary)] mt-0.5 mb-4 px-2">
        Watch this on {PLATFORM_LABEL[reel.platform]}
      </p>
      <a
        href={reel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors whitespace-nowrap"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View on {PLATFORM_LABEL[reel.platform]}
      </a>
    </div>
  );
}

function EmbedSwitch({ reel, onEnded }: { reel: ReelRow; onEnded: () => void }) {
  if (reel.platform === 'tiktok') {
    const id = extractTikTokId(reel.url);
    if (!id) return null;
    return <TikTokEmbed url={reel.url} id={id} onEnded={onEnded} />;
  }
  if (reel.platform === 'instagram') {
    return <InstagramEmbed permalink={reel.url} onEnded={onEnded} />;
  }

  if (reel.platform === 'youtube') {
    const id = extractYouTubeId(reel.url);
    if (!id) return null;
    return <YouTubeEmbed id={id} onEnded={onEnded} />;
  }
  return null;
}

// End-of-playback overlay. Sized to fill the card so the rail never jumps
// when an embed flips into overlay state. Two CTAs: Replay re-mounts the
// embed; Source link opens the original post in a new tab.
function EndOverlay({ reel, onReplay }: { reel: ReelRow; onReplay: () => void }) {
  const Icon = PLATFORM_ICON[reel.platform];
  return (
    <div
      className="reel-overlay bg-gradient-to-b from-[var(--color-surface)] to-white flex flex-col items-center justify-center px-4 py-5 text-center"
      role="region"
      aria-label="Reel ended"
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[var(--color-border)] shadow-sm flex items-center justify-center mb-3 text-[var(--color-text-primary)] shrink-0">
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        That&rsquo;s a wrap
      </p>
      <p className="font-headline text-base font-bold text-[var(--color-text-primary)] mt-0.5 mb-4">
        Watch again?
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Replay
        </button>
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] text-xs font-semibold hover:bg-[var(--color-surface)] hover:border-[var(--color-border-dark)] transition-colors whitespace-nowrap"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View on {PLATFORM_LABEL[reel.platform]}
        </a>
      </div>
    </div>
  );
}

// Cross-origin embeds: we can't read playback state from the iframe, so
// we wait until the card is actually visible (any portion in the viewport)
// before starting the platform's typical clip length as a timer. If the
// user scrolls away mid-clip we let the timer keep running — the goal is
// to suppress the recommendation overlay, not to track watch state.
function useViewportTimer(ref: React.RefObject<HTMLDivElement | null>, delayMs: number, onFire: () => void) {
  useEffect(() => {
    if (!ref.current || delayMs <= 0) return;
    let timer: number | undefined;
    let fired = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired && timer === undefined) {
            timer = window.setTimeout(() => {
              fired = true;
              onFire();
            }, delayMs);
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ref, delayMs, onFire]);
}

function TikTokEmbed({ url, id, onEnded }: { url: string; id: string; onEnded: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useViewportTimer(wrapRef, FALLBACK_DURATION_MS.tiktok, onEnded);

  // TikTok's SDK has no per-node API — it only auto-scans at script load
  // time + via MutationObserver. Re-injecting the script tag on every
  // mount forces a fresh scan of the current DOM, which covers both first
  // render and replay re-mounts. Cheap because the browser will reuse the
  // cached script body.
  useEffect(() => {
    reloadTikTokSdk();
  }, [id]);

  return (
    <div ref={wrapRef}>
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={id}
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a target="_blank" rel="noopener noreferrer" href={`${url}?refer=embed`}>
            View on TikTok
          </a>
        </section>
      </blockquote>
    </div>
  );
}

function InstagramEmbed({ permalink, onEnded }: { permalink: string; onEnded: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useViewportTimer(wrapRef, FALLBACK_DURATION_MS.instagram, onEnded);

  // Load the IG SDK if needed and then explicitly process this card's
  // blockquote. `instgrm.Embeds.process()` rescans the whole document,
  // but it's idempotent on already-processed nodes so it's safe to
  // call per-card.
  useEffect(() => {
    let cancelled = false;
    loadInstagramSdk().then(() => {
      if (cancelled) return;
      try {
        window.instgrm?.Embeds?.process();
      } catch {
        /* SDK threw during process — fallback link still renders */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [permalink]);

  return (
    <div ref={wrapRef}>
      {/* No data-instgrm-captioned: that flag tells IG to render the
          post caption inside the embed, which makes the iframe taller
          than 9:16 and overflows the card frame. Dropping it keeps the
          embed compact and uniform with TikTok / YouTube cards. */}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`${permalink}?utm_source=ig_embed&utm_campaign=loading`}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          margin: 0,
          padding: 0,
          width: '100%',
        }}
      >
        <div style={{ padding: 16 }}>
          <a
            href={`${permalink}?utm_source=ig_embed&utm_campaign=loading`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#FFFFFF', lineHeight: 0, textDecoration: 'none', width: '100%' }}
          >
            View this reel on Instagram
          </a>
        </div>
      </blockquote>
    </div>
  );
}

// YouTube is the one platform where we can detect end-of-playback for
// real: the IFrame Player API fires `onStateChange` with state 0 (ENDED).
// We still pass loop=0 so the player actually stops instead of restarting,
// which would otherwise fight with our overlay. Mute + autoplay are
// required for autoplay to be allowed by modern browsers.
function YouTubeEmbed({ id, onEnded }: { id: string; onEnded: () => void }) {
  // Per-instance DOM id so YT.Player can find the iframe to bind to. The
  // API requires the iframe to already exist with `enablejsapi=1` set.
  const [frameId] = useState(() => `yt-${id}-${Math.random().toString(36).slice(2, 9)}`);
  const playerRef = useRef<YTPlayer | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    let pollTimer: number | undefined;
    let cancelled = false;

    loadYouTubeIframeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(frameId);
      if (!el) return;

      playerRef.current = new window.YT.Player(frameId, {
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState.ENDED && !endedRef.current) {
              endedRef.current = true;
              onEnded();
            }
          },
        },
      });

      // Belt-and-braces: the ENDED event sometimes doesn't fire for
      // looped Shorts or short clips that stall at the last frame. We
      // also poll currentTime / duration and fire at >=96% as a backup.
      pollTimer = window.setInterval(() => {
        const p = playerRef.current;
        if (!p || endedRef.current) return;
        const cur = p.getCurrentTime?.();
        const dur = p.getDuration?.();
        if (typeof cur === 'number' && typeof dur === 'number' && dur > 0 && cur / dur >= 0.96) {
          endedRef.current = true;
          onEnded();
        }
      }, 500);
    });

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearInterval(pollTimer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* player may already be torn down */
      }
      playerRef.current = null;
    };
  }, [frameId, onEnded]);

  // We deliberately do NOT pass loop=1 here — when our overlay logic owns
  // the end state, looping inside the iframe would mean the ENDED event
  // never fires. Autoplay + mute are still required for the video to
  // start automatically inside the rail.
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    enablejsapi: '1',
  });

  return (
    <div className="youtube-embed">
      <iframe
        id={frameId}
        src={`https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

