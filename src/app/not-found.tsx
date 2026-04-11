import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <p className="text-secondary mb-6">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
