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
    <div className={`flex items-center gap-4 ${centered ? 'justify-center' : ''}`}>
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.id}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <Icon size={18} className="md:w-5 md:h-5" />
          </a>
        );
      })}
    </div>
  );
}
