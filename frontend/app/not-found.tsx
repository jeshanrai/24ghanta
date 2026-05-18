import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-xl w-full text-center">
        <p className="text-[var(--color-primary)] font-semibold tracking-widest text-sm mb-4">
          404 ERROR
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-4">
          Page not found
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base sm:text-lg mb-8">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-white! font-medium hover:bg-(--color-primary-hover) transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Search news
          </Link>
        </div>
      </div>
    </div>
  );
}
