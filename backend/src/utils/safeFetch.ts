import dns from 'dns/promises';
import type { LookupAddress } from 'dns';
import net from 'net';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB cap, matches image upload size sanity
const TIMEOUT_MS = 8000;

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  // 0.0.0.0/8
  if ((n & 0xff000000) === 0x00000000) return true;
  // 10.0.0.0/8
  if ((n & 0xff000000) === 0x0a000000) return true;
  // 100.64.0.0/10 (CGNAT)
  if ((n & 0xffc00000) === 0x64400000) return true;
  // 127.0.0.0/8
  if ((n & 0xff000000) === 0x7f000000) return true;
  // 169.254.0.0/16 (link-local + cloud metadata)
  if ((n & 0xffff0000) === 0xa9fe0000) return true;
  // 172.16.0.0/12
  if ((n & 0xfff00000) === 0xac100000) return true;
  // 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24
  if ((n & 0xffffff00) === 0xc0000000) return true;
  if ((n & 0xffffff00) === 0xc0000200) return true;
  if ((n & 0xffffff00) === 0xc0586300) return true;
  if ((n & 0xffff0000) === 0xc0a80000) return true;
  if ((n & 0xfffe0000) === 0xc6120000) return true;
  if ((n & 0xffffff00) === 0xc6336400) return true;
  if ((n & 0xffffff00) === 0xcb007100) return true;
  // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved
  if ((n & 0xf0000000) === 0xe0000000) return true;
  if ((n & 0xf0000000) === 0xf0000000) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  // ::ffff:a.b.c.d (IPv4-mapped) — check the embedded v4
  const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  // fc00::/7 (unique local)
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // fe80::/10 (link-local)
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // ff00::/8 (multicast)
  if (lower.startsWith('ff')) return true;
  // 2002:a9fe::/32, 2002:7f00::/24 etc — 6to4 wrapping link-local/loopback
  if (lower.startsWith('2002:')) {
    const parts = lower.split(':');
    if (parts.length >= 3) {
      const a = parseInt(parts[1], 16);
      const b = parseInt(parts[2], 16);
      const v4 = `${(a >> 8) & 0xff}.${a & 0xff}.${(b >> 8) & 0xff}.${b & 0xff}`;
      if (isPrivateIPv4(v4)) return true;
    }
  }
  return false;
}

function isPrivateAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true; // unknown → treat as unsafe
}

export interface SafeFetchResult {
  buffer: Buffer;
  contentType: string | null;
}

/**
 * Fetches a remote URL with SSRF protections suitable for an admin-supplied
 * "image URL" feature. Refuses non-https, non-public hosts, redirects, and
 * oversized bodies.
 */
export async function safeFetchImage(rawUrl: string): Promise<SafeFetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only https:// URLs are allowed');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials are not allowed');
  }

  const host = parsed.hostname;

  // Resolve DNS and verify every returned address is publicly routable.
  // (DNS rebinding TOCTOU is mitigated by admin-only access + magic-byte
  // validation of the response body before any further processing.)
  const literalFamily = net.isIP(host);
  if (literalFamily) {
    if (isPrivateAddress(host)) {
      throw new Error('URL resolves to a non-public address');
    }
  } else {
    let addrs: LookupAddress[];
    try {
      addrs = await dns.lookup(host, { all: true });
    } catch {
      throw new Error('DNS lookup failed');
    }
    if (addrs.length === 0) throw new Error('DNS lookup returned no addresses');
    for (const a of addrs) {
      if (isPrivateAddress(a.address)) {
        throw new Error('URL resolves to a non-public address');
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'error', // any redirect aborts — we won't re-walk a chain
      signal: controller.signal,
      headers: { 'Accept': 'image/*' },
    });
    if (!res.ok) {
      throw new Error(`Remote server returned ${res.status}`);
    }
    const lenHeader = res.headers.get('content-length');
    if (lenHeader) {
      const n = parseInt(lenHeader, 10);
      if (Number.isFinite(n) && n > MAX_BYTES) {
        throw new Error('Remote content exceeds size limit');
      }
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Empty response');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try { await reader.cancel(); } catch { /* ignore */ }
        throw new Error('Remote content exceeds size limit');
      }
      chunks.push(value);
    }
    return {
      buffer: Buffer.concat(chunks.map((c) => Buffer.from(c)), total),
      contentType: res.headers.get('content-type'),
    };
  } finally {
    clearTimeout(timer);
  }
}
