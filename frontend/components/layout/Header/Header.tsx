'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { MainNav } from './MainNav';
import { SearchButton } from './SearchButton';
import { UserActions } from './UserActions';
import { MobileMenuButton } from './MobileMenuButton';
import { MobileMenu } from './MobileMenu';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <SearchButton />
            <UserActions />
            <MobileMenuButton isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}
