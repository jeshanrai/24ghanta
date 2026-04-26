import { footerColumns } from '@/lib/constants';
import { FooterLogo } from './FooterLogo';
import { FooterColumn } from './FooterColumn';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-white mt-12">
      <div className="container py-10 md:py-12">
        {/* Mobile: logo + tagline + socials stacked at the top, centered */}
        <div className="md:hidden flex flex-col items-center text-center pb-8 mb-8 border-b border-white/10">
          <FooterLogo centered />
          <SocialLinks centered />
        </div>

        {/* Link columns. On mobile: 2-col grid. On md+: 6-col grid with logo block. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 md:grid-cols-6 md:gap-8">
          {/* Logo / tagline / socials — md+ only */}
          <div className="hidden md:block md:col-span-2">
            <FooterLogo />
            <SocialLinks />
          </div>

          {footerColumns.map((column) => (
            <FooterColumn key={column.id} column={column} />
          ))}
        </div>

        {/* Bottom legal bar */}
        <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-xs md:text-sm text-gray-500">
              &copy; {currentYear} 24Ghanta. All rights reserved.
            </p>
            <nav className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs md:text-sm">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Privacy
              </a>
              <span aria-hidden="true" className="text-gray-700">·</span>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Terms
              </a>
              <span aria-hidden="true" className="text-gray-700">·</span>
              <a
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
