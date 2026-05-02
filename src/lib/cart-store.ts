// Cart state with localStorage persistence (zustand-free, lightweight)
import { useEffect, useState, useSyncExternalStore } from "react";

export type SelectedOption = {
  group_id: string;
  group_name_ar: string;
  group_name_en: string;
  option_id: string;
  option_name_ar: string;
  option_name_en: string;
  extra_price: number;
};

export type CartLine = {
  lineId: string;
  item_id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  options: SelectedOption[];
  notes?: string;
};

const STORAGE_KEY = "indianbhar_cart_v1";

let cart: CartLine[] = [];
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cart = JSON.parse(raw);
  } catch {}
}
function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  listeners.forEach((l) => l());
}

load();

export const cartStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get() {
    return cart;
  },
  add(line: Omit<CartLine, "lineId">) {
    const lineId = `${line.item_id}-${line.options.map((o) => o.option_id).sort().join("-")}`;
    const existing = cart.find((c) => c.lineId === lineId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      cart = [...cart, { ...line, lineId }];
    }
    persist();
  },
  update(lineId: string, quantity: number) {
    if (quantity <= 0) {
      cart = cart.filter((c) => c.lineId !== lineId);
    } else {
      cart = cart.map((c) => (c.lineId === lineId ? { ...c, quantity } : c));
    }
    persist();
  },
  remove(lineId: string) {
    cart = cart.filter((c) => c.lineId !== lineId);
    persist();
  },
  clear() {
    cart = [];
    persist();
  },
};

export function lineTotal(line: CartLine) {
  const optionsSum = line.options.reduce((s, o) => s + Number(o.extra_price), 0);
  return (Number(line.unit_price) + optionsSum) * line.quantity;
}

export function useCart() {
  const snapshot = useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.get(),
    () => cartStore.get(),
  );
  // hydration guard for SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? snapshot : [];
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}
export function cartCount(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0);
}
