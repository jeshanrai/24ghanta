'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { SubscribeDialog } from './SubscribeDialog';

export function UserActions() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Link href="/signin">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setSubscribeOpen(true)}
        >
          Subscribe
        </Button>
      </div>
      <SubscribeDialog open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </>
  );
}
