'use client';

import Script from 'next/script';

/** Loads Twitter's widgets.js so any <blockquote class="twitter-tweet"> in
 *  the article body hydrates into the embedded tweet UI. Async + lazy. */
export function TwitterScript() {
  return (
    <Script
      src="https://platform.twitter.com/widgets.js"
      strategy="lazyOnload"
      async
    />
  );
}
