import { FacebookIcon, InstagramIcon, YouTubeIcon, ThreadsIcon, LinkedinIcon, TiktokIcon } from '@/components/icons';

const socialLinks = [
  { id: 'facebook', icon: FacebookIcon, href: 'https://www.facebook.com/24GhantaNepal/', label: 'Facebook' },
  { id: 'instagram', icon: InstagramIcon, href: 'https://www.instagram.com/24ghantanepal/', label: 'Instagram' },
  { id: 'threads', icon: ThreadsIcon, href: 'https://www.threads.com/@24ghantanepal', label: 'Threads' },
  { id: 'tiktok', icon: TiktokIcon, href: 'https://www.tiktok.com/@24ghanta_nepal', label: 'TikTok' },
  { id: 'linkedin', icon: LinkedinIcon, href: 'https://www.linkedin.com/company/24-ghanta-nepal/', label: 'LinkedIn' },
  { id: 'youtube', icon: YouTubeIcon, href: 'https://www.youtube.com/@24GhantaNepal', label: 'YouTube' },
];

interface SocialLinksProps {
  centered?: boolean;
}

export function SocialLinks({ centered = false }: SocialLinksProps) {
  return (
    <div className={`flex items-center gap-3 ${centered ? 'justify-center mt-4' : 'mt-2'}`}>
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.id}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
}
