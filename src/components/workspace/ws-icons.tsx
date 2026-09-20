import type { ReactNode } from "react";

export function WsIcon({
  children,
  className = "h-5 w-5",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {children}
    </svg>
  );
}

function P({ d }: { d: string }) {
  return <path d={d} strokeLinecap="round" strokeLinejoin="round" />;
}

export function IconHome({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </WsIcon>
  );
}

export function IconChat({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5z" />
    </WsIcon>
  );
}

export function IconCall({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M7 4h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3L16 12.5 20 14v3a2 2 0 0 1-2.2 2A16 16 0 0 1 5 6.2 2 2 0 0 1 7 4z" />
    </WsIcon>
  );
}

export function IconTasks({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" />
    </WsIcon>
  );
}

export function IconCal({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M7 4v2M17 4v2M5 8h14M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    </WsIcon>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <P d="M16 16l4.5 4.5" />
    </WsIcon>
  );
}

export function IconSend({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M5 12h12M14 7l6 5-6 5" />
    </WsIcon>
  );
}

export function IconInfo({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <P d="M12 11v5M12 8h.01" />
    </WsIcon>
  );
}

export function IconVideo({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <P d="M16 10l5-3v10l-5-3z" />
    </WsIcon>
  );
}

export function IconBack({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M15 6l-6 6 6 6" />
    </WsIcon>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M6 9a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <P d="M10 19a2 2 0 0 0 4 0" />
    </WsIcon>
  );
}

export function IconSite({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <P d="M3.5 12h17M12 3c2.8 2.6 4.2 6 4.2 9s-1.4 6.4-4.2 9M12 3C9.2 5.6 7.8 9 7.8 12s1.4 6.4 4.2 9" />
    </WsIcon>
  );
}

export function IconAttach({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M16 8 8.5 15.5a3 3 0 0 1-4.2-4.2L12 3.6a4.5 4.5 0 0 1 6.4 6.4L10.2 18.2" />
    </WsIcon>
  );
}

export function IconSmile({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <P d="M8.5 10h.01M15.5 10h.01M8.5 14.5S10 16.5 12 16.5 15.5 14.5 15.5 14.5" />
    </WsIcon>
  );
}

export function IconMore({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" />
    </WsIcon>
  );
}

export function IconFolder({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <P d="M4 7h5l2 2h9v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </WsIcon>
  );
}

export function IconImage({ className }: { className?: string }) {
  return (
    <WsIcon className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.4" />
      <P d="M4 16l5-4 4 3 3-2 4 3" />
    </WsIcon>
  );
}
