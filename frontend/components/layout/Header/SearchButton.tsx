'use client';

import { IconButton } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

interface SearchButtonProps {
  onClick?: () => void;
}

export function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <IconButton label="Search" onClick={onClick} size="lg">
      <SearchIcon size={20} />
    </IconButton>
  );
}
