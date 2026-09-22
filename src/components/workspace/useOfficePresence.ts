"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function useOfficePresence(room: string, displayName: string) {
  const [peers, setPeers] = useState<string[]>([]);

  useEffect(() => {
    if (!room || !displayName) return;
    const supabase = createBrowserSupabase();
    const channel = supabase.channel(`office:${room}`, { config: { presence: { key: `${displayName}-${crypto.randomUUID().slice(0, 6)}` } } });
    const sync = () => {
      const state = channel.presenceState() as Record<string, Array<{ name?: string }>>;
      const names = Object.values(state)
        .flat()
        .map((p) => p.name)
        .filter(Boolean) as string[];
      setPeers([...new Set(names)]);
    };
    channel.on("presence", { event: "sync" }, sync);
    void channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await channel.track({ name: displayName });
    });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room, displayName]);

  return peers;
}
