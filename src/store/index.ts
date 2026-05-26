import { create } from "zustand";
import { Product, PublishTask, Platform } from "../types/product";

interface State {
  products: Product[];
  tasks: PublishTask[];
  credentials: Partial<Record<Platform, { appKey: string; appSecret: string; accessToken: string }>>;

  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addTask: (t: PublishTask) => void;
  updateTask: (id: string, patch: Partial<PublishTask>) => void;
  setCredential: (p: Platform, c: { appKey: string; appSecret: string; accessToken: string }) => void;
}

export const useStore = create<State>(set => ({
  products: [],
  tasks: [],
  credentials: {},

  addProduct: p => set(s => ({ products: [p, ...s.products] })),
  updateProduct: (id, patch) =>
    set(s => ({ products: s.products.map(p => (p.id === id ? { ...p, ...patch } : p)) })),
  removeProduct: id => set(s => ({ products: s.products.filter(p => p.id !== id) })),

  addTask: t => set(s => ({ tasks: [t, ...s.tasks] })),
  updateTask: (id, patch) =>
    set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) })),

  setCredential: (p, c) => set(s => ({ credentials: { ...s.credentials, [p]: c } }))
}));
