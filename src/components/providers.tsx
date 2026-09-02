"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { CART_KEY, type CartItem } from "@/lib/cart";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider, useToast } from "@/components/ui/Toast";

type AuthCtx = { user: SessionUser | null };
const AuthContext = createContext<AuthCtx>({ user: null });
export function useAuth() {
  return useContext(AuthContext);
}

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within Providers");
  return ctx;
}

function subscribe(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("as-cart", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("as-cart", handler);
  };
}

function getCartSnapshot() {
  return localStorage.getItem(CART_KEY) ?? "[]";
}

function getServerCartSnapshot() {
  return "[]";
}

function parseCart(raw: string): CartItem[] {
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("as-cart"));
}

function mergeCart(a: CartItem[], b: CartItem[]) {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const prev = map.get(item.productId);
    map.set(item.productId, prev ? { ...item, quantity: Math.max(prev.quantity, item.quantity) } : item);
  }
  return [...map.values()];
}

function CartProvider({ children, user }: { children: React.ReactNode; user: SessionUser | null }) {
  const raw = useSyncExternalStore(subscribe, getCartSnapshot, getServerCartSnapshot);
  const items = parseCart(raw);
  const synced = useRef(false);
  const { push } = useToast();

  useEffect(() => {
    if (!user || synced.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items: CartItem[] };
        const merged = mergeCart(parseCart(getCartSnapshot()), data.items ?? []);
        writeCart(merged);
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: merged.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          }),
        });
        synced.current = true;
      } catch {
        /* guest fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    (next: CartItem[]) => {
      writeCart(next);
      if (!user) return;
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: next.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      }).catch(() => {});
    },
    [user],
  );

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const current = parseCart(getCartSnapshot());
      const found = current.find((p) => p.productId === item.productId);
      persist(
        found
          ? current.map((p) =>
              p.productId === item.productId ? { ...p, quantity: p.quantity + quantity } : p,
            )
          : [...current, { ...item, quantity }],
      );
      push("به سبد اضافه شد");
    },
    [persist, push],
  );

  const remove = useCallback(
    (productId: string) => persist(parseCart(getCartSnapshot()).filter((p) => p.productId !== productId)),
    [persist],
  );

  const setQty = useCallback(
    (productId: string, quantity: number) => {
      persist(
        parseCart(getCartSnapshot())
          .map((p) => (p.productId === productId ? { ...p, quantity } : p))
          .filter((p) => p.quantity > 0),
      );
    },
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const cart = useMemo<CartCtx>(
    () => ({
      items,
      add,
      remove,
      setQty,
      clear,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items, add, remove, setQty, clear],
  );

  return (
    <AuthContext.Provider value={{ user }}>
      <CartContext.Provider value={cart}>{children}</CartContext.Provider>
    </AuthContext.Provider>
  );
}

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CartProvider user={user}>{children}</CartProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
