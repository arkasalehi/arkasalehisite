export function HeartIcon({ filled = false, className = "w-5 h-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-6.5-4.35-9.33-8.2C.8 10.3 1.1 6.6 4 5.15 6.2 4.05 8.6 4.7 10 6.4c1.4-1.7 3.8-2.35 6-1.25 2.9 1.45 3.2 5.15 1.33 7.65C18.5 16.65 12 21 12 21z" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkIcon({ filled = false, className = "w-5 h-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4.5h12A1.5 1.5 0 0 1 19.5 6v15L12 16.5 4.5 21V6A1.5 1.5 0 0 1 6 4.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5.5v13l11-6.5L8 5.5z" />
    </svg>
  );
}

export function BellIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function CartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h2l1.5 11h11L21 8H7" strokeLinejoin="round" />
      <circle cx="9.5" cy="19" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function ShareIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="M8 13l8 5M16 6l-8 5" />
    </svg>
  );
}

export function UserIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3 4-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  );
}
