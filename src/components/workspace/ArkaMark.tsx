export function ArkaMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" fill="var(--ws-accent)" />
      <path
        d="M8.5 23.5 16 8.5l7.5 15H21l-1.4-2.9h-7.2L11 23.5H8.5zm6.2-5.2h2.6L16 13.4l-1.3 4.9z"
        fill="var(--ws-on-accent)"
      />
    </svg>
  );
}
