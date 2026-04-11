export default function RootLoading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
