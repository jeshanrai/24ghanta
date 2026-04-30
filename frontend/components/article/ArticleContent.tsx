import sanitizeHtml from 'sanitize-html';
import { TwitterScript } from './TwitterScript';
import { resolveImageSrc } from '@/lib/safeImage';

interface ArticleContentProps {
  html: string;
}

/** Detect whether the stored content is rich HTML or legacy plain text. */
function isHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/** Rewrite `/uploads/...` to absolute API URLs so admin-uploaded inline
 *  images work no matter where the page is served from. */
function rewriteUploadUrls(html: string): string {
  return html.replace(
    /(src|href)\s*=\s*"(\/uploads\/[^"]+)"/gi,
    (_m, attr, url) => `${attr}="${resolveImageSrc(url)}"`
  );
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 's', 'u', 'sub', 'sup', 'code',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'a', 'img',
    'iframe',
    'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title'],
    blockquote: ['class', 'cite', 'data-dnt', 'data-lang', 'data-theme'],
    div: ['class'],
    span: ['class'],
    p: ['class'],
    h2: ['id'],
    h3: ['id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Only allow embeds from known-safe iframe hosts.
  allowedIframeHostnames: [
    'www.youtube-nocookie.com',
    'www.youtube.com',
    'youtube.com',
    'player.vimeo.com',
    'platform.twitter.com',
  ],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: attribs.target || '_blank',
      },
    }),
  },
};

export function ArticleContent({ html }: ArticleContentProps) {
  if (!html?.trim()) return null;

  if (!isHtml(html)) {
    // Legacy plain-text fallback: paragraph-split the string.
    return (
      <div className="article-rich-content">
        {html.split(/\n{2,}/).map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    );
  }

  const clean = sanitizeHtml(rewriteUploadUrls(html), SANITIZE_OPTIONS);
  const hasTweet = clean.includes('twitter-tweet');

  return (
    <>
      <div
        className="article-rich-content"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {hasTweet && <TwitterScript />}
    </>
  );
}
