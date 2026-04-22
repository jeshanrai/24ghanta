import { footerColumns } from '@/lib/constants';
import { FooterLogo } from './FooterLogo';
import { FooterColumn } from './FooterColumn';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-white mt-12">
      <div className="container py-8 md:py-12">
        {/* Logo and Social - Full width centered on mobile */}
        <div className="mb-6 pb-6 border-b border-gray-800 md:border-0 md:pb-0 md:mb-0 md:hidden text-center">
          <FooterLogo centered />
          <SocialLinks centered />
        </div>

        <div className="flex justify-center md:block">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-x-12 md:gap-8 lg:grid-cols-6">
            {/* Logo section - Hidden on mobile, shown on md+ */}
            <div className="hidden md:block lg:col-span-2">
              <FooterLogo />
              <SocialLinks />
            </div>

            {footerColumns.map((column) => (
              <FooterColumn key={column.id} column={column} />
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-center md:text-left">
            <p className="text-xs md:text-sm text-gray-400">
              &copy; {currentYear} 24Ghanta
            </p>
            <div className="flex items-center gap-3 md:gap-6">
              <a
                href="/privacy"
                className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
