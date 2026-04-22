import Link from 'next/link';
import { Button } from '@/components/ui';

export function UserActions() {
  return (
    <div className="hidden sm:flex items-center gap-2">
      <Link href="/signin">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
      <Button variant="primary" size="sm">
        Subscribe
      </Button>
    </div>
  );
}
