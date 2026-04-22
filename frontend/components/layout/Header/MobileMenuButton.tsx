'use client';

import { IconButton } from '@/components/ui';
import { MenuIcon, CloseIcon } from '@/components/icons';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <div className="lg:hidden">
      <IconButton label={isOpen ? 'Close menu' : 'Open menu'} onClick={onClick}>
        {isOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </IconButton>
    </div>
  );
}
