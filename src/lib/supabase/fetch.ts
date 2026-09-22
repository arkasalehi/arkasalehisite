const DEFAULT_MS = 8000;

/** Prevents hung Supabase HTTP from stalling Next.js forever. */
export function fetchWithTimeout(timeoutMs = DEFAULT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (init?.signal) {
      if (init.signal.aborted) controller.abort();
      else init.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };
}

export function hasSupabaseAuthCookie(cookies: Array<{ name: string }>) {
  return cookies.some((c) => c.name.includes("-auth-token"));
}
