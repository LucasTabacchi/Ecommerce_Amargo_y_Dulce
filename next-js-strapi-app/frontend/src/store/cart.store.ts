import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const existing = s.items.find((x) => x.id === item.id);
      if (existing) {
        return {
          items: s.items.map((x) => (x.id === item.id ? { ...x, qty: x.qty + qty } : x)),
        };
      }
      return { items: [...s.items, { ...item, qty }] };
    }),
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  setQty: (id, qty) =>
    set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, qty } : x)) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((acc, x) => acc + x.price * x.qty, 0),
}));
