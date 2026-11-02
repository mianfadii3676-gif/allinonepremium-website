import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct, IProductVariant } from "@/types";

export interface CartItem {
  product: IProduct;
  variant?: IProductVariant;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: IProduct, variant?: IProductVariant, quantity?: number, openDrawer?: boolean) => void;
  updateQuantity: (productId: string, variantValue?: string, quantity?: number) => void;
  removeItem: (productId: string, variantValue?: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (product, variant, quantity = 1, openDrawer = true) => {
        const unitPrice = product.price + (variant?.priceModifier || 0);
        const variantVal = variant?.value || "";

        set((state) => {
          const existingIndex = state.items.findIndex(
            (it) => it.product._id === product._id && (it.variant?.value || "") === variantVal
          );

          if (existingIndex > -1) {
            const nextItems = [...state.items];
            const current = nextItems[existingIndex];
            const newQty = Math.min(product.stock, current.quantity + quantity);
            nextItems[existingIndex] = {
              ...current,
              quantity: newQty,
              subtotal: newQty * unitPrice,
            };
            return { items: nextItems, isOpen: openDrawer || state.isOpen };
          }

          const newQty = Math.min(product.stock, quantity);
          return {
            items: [
              ...state.items,
              {
                product,
                variant,
                quantity: newQty,
                unitPrice,
                subtotal: newQty * unitPrice,
              },
            ],
            isOpen: openDrawer || state.isOpen,
          };
        });
      },
      updateQuantity: (productId, variantValue = "", quantity = 1) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (it) => !(it.product._id === productId && (it.variant?.value || "") === variantValue)
              ),
            };
          }

          return {
            items: state.items.map((it) => {
              if (it.product._id === productId && (it.variant?.value || "") === variantValue) {
                const maxQty = it.product.stock;
                const safeQty = Math.min(maxQty, quantity);
                return {
                  ...it,
                  quantity: safeQty,
                  subtotal: safeQty * it.unitPrice,
                };
              }
              return it;
            }),
          };
        });
      },
      removeItem: (productId, variantValue = "") => {
        set((state) => ({
          items: state.items.filter(
            (it) => !(it.product._id === productId && (it.variant?.value || "") === variantValue)
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "aop_cart_store",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
