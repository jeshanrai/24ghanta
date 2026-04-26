import { FacebookIcon, TwitterIcon, InstagramIcon, YouTubeIcon } from '@/components/icons';

const socialLinks = [
  { id: 'facebook', icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
  { id: 'twitter', icon: TwitterIcon, href: 'https://twitter.com', label: 'Twitter' },
  { id: 'instagram', icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { id: 'youtube', icon: YouTubeIcon, href: 'https://youtube.com', label: 'YouTube' },
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
