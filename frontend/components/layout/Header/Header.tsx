'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { MainNav } from './MainNav';
import { SearchButton } from './SearchButton';
import { HeaderSearch } from './HeaderSearch';
import { UserActions } from './UserActions';
import { MobileMenuButton } from './MobileMenuButton';
import { MobileMenu } from './MobileMenu';
import { SearchOverlay } from './SearchOverlay';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          <MainNav />

          <div className="flex items-center gap-2">
            <div className="hidden lg:block w-56 xl:w-72">
              <HeaderSearch />
            </div>
            <div className="lg:hidden">
              <SearchButton onClick={() => setIsSearchOpen(true)} />
            </div>
            <UserActions />
            <MobileMenuButton isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
