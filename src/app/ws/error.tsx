"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        <h1 className="text-[length:var(--ws-type-lg)] font-semibold">Could not open this view</h1>
        <p className="mt-2 max-w-sm text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">Try again, or pick another space from the navigator.</p>
        <button type="button" onClick={reset} className="ws-btn ws-btn-primary mt-4">
          Retry
        </button>
      </div>
    </div>
  );
}
