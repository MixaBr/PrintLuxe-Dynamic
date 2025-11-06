import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/definitions';
import { useToast } from './use-toast';

export type CartItem = {
  quantity: number;
} & Product;

interface CartStore {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          // Если товар уже есть, увеличиваем количество
          set({
            items: currentItems.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          // Если товара нет, добавляем его
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeFromCart: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage', // ключ в localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
