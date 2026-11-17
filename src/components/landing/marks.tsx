import type { ReactNode } from "react";

export function ArrowUp({ className = "ph-arrow" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 17 7 7M7 15V7h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BadgeIcon({ tone }: { tone: "blue" | "violet" }) {
  return (
    <span className={`ph-badge ph-badge-${tone}`}>
      {tone === "blue" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3.5 13.8 9l5.7.2-4.5 3.6 1.6 5.5L12 15.2 7.4 18.3 9 12.8 4.5 9.2 10.2 9 12 3.5Z" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="8" cy="8" r="2.2" />
          <circle cx="16" cy="8" r="2.2" />
          <circle cx="8" cy="16" r="2.2" />
          <circle cx="16" cy="16" r="2.2" />
        </svg>
      )}
    </span>
  );
}

export function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {children}
    </svg>
  );
}

export function SkillGlyph({ index }: { index: number }) {
  const tone = index % 3 === 0 ? "blue" : "ink";
  return (
    <span className={`ph-skill-icon ph-skill-icon-${tone}`}>
      {index % 3 === 0 ? (
        <Glyph>
          <path d="M5 19.5 8.2 16" strokeLinecap="round" />
          <path d="M14.2 5.2a2.6 2.6 0 0 1 3.7 3.7L9.2 17.6 5 19l1.4-4.2L14.2 5.2Z" strokeLinejoin="round" />
        </Glyph>
      ) : index % 3 === 1 ? (
        <Glyph>
          <path d="M12 3.5 19 6.2v5.4c0 4.2-2.8 7.2-7 8.9-4.2-1.7-7-4.7-7-8.9V6.2L12 3.5Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
        </Glyph>
      ) : (
        <Glyph>
          <path d="m12 4 7 3.5L12 11 5 7.5 12 4Z" strokeLinejoin="round" />
          <path d="m5 12 7 3.5L19 12" strokeLinejoin="round" />
          <path d="m5 16.2 7 3.5 7-3.5" strokeLinejoin="round" />
        </Glyph>
      )}
    </span>
  );
}

export function WorkGlyph({ kind }: { kind: "blog" | "video" }) {
  return (
    <span className="ph-tile-icon">
      {kind === "video" ? (
        <Glyph>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" />
        </Glyph>
      ) : (
        <Glyph>
          <path d="M7 4.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
          <path d="M14 4.8V9h4.2M8 13h8M8 16.5h5" strokeLinecap="round" />
        </Glyph>
      )}
    </span>
  );
}
