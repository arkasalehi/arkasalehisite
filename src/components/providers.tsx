"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import { CART_KEY, type CartItem } from "@/lib/cart";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider, useToast } from "@/components/ui/Toaster";
import { isWorkspaceHost } from "@/lib/runtime";

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

function CartProvider({ children, user }: { children: React.ReactNode; user: SessionUser | null }) {
  const raw = useSyncExternalStore(subscribe, getCartSnapshot, getServerCartSnapshot);
  const items = parseCart(raw);
  const synced = useRef(false);
  const { push } = useToast();

  useEffect(() => {
    synced.current = Boolean(user);
  }, [user]);

  const persist = useCallback((next: CartItem[]) => {
    writeCart(next);
  }, []);

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
  initialTheme = "dark",
  workspaceDoc = false,
}: {
  children: React.ReactNode;
  initialTheme?: "dark" | "light";
  workspaceDoc?: boolean;
}) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ToastProvider>
        <SessionGate skip={workspaceDoc}>{children}</SessionGate>
      </ToastProvider>
    </ThemeProvider>
  );
}

function SessionGate({ children, skip = false }: { children: React.ReactNode; skip?: boolean }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (skip || pathname.startsWith("/ws") || isWorkspaceHost(window.location.host)) return;
    let dead = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user?: SessionUser | null }) => {
        if (!dead) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!dead) setUser(null);
      });
    return () => {
      dead = true;
    };
  }, [pathname, skip]);

  return <CartProvider user={user}>{children}</CartProvider>;
}
