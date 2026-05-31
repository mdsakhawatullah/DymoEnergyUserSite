import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem {
  productId:   number;
  productName: string;
  sku?:        string;
  imageUrl?:   string;
  unitPrice:   number;
  quantity:    number;
  lineTotal:   number;
}

const CART_KEY = 'dymo_cart';

@Injectable({ providedIn: 'root' })
export class CartService {

  // ── State ──────────────────────────────────────────────────────────────
  items       = signal<CartItem[]>(this.loadFromStorage());
  sidebarOpen = signal(false);

  // ── Derived ────────────────────────────────────────────────────────────
  totalCount = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  subtotal   = computed(() => this.items().reduce((s, i) => s + i.lineTotal, 0));

  // ── Mutations ──────────────────────────────────────────────────────────
  addItem(product: Product, qty: number): void {
    this.items.update(items => {
      const idx = items.findIndex(i => i.productId === product.id);
      let updated: CartItem[];

      if (idx >= 0) {
        updated = items.map((item, i) =>
          i === idx
            ? { ...item, quantity: item.quantity + qty, lineTotal: (item.quantity + qty) * item.unitPrice  }
            : item
        );
      } else {
        updated = [
          ...items,
          {
            productId:   product.id,
            productName: product.name        ?? '',
            sku:         product.sku,
            imageUrl:    product.primaryImage,
            unitPrice:   product.discountPrice ?? product.price,
            quantity:    qty,
            lineTotal:   qty * (product.discountPrice ?? product.price),
          },
        ];
      }

      this.saveToStorage(updated);
      return updated;
    });

    this.sidebarOpen.set(true);
  }

  removeItem(productId: number): void {
    this.items.update(items => {
      const updated = items.filter(i => i.productId !== productId);
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateQuantity(productId: number, qty: number): void {
    if (qty < 1) { this.removeItem(productId); return; }
    this.items.update(items => {
      const updated = items.map(i =>
        i.productId === productId
          ? { ...i, quantity: qty, lineTotal: qty * i.unitPrice }
          : i
      );
      this.saveToStorage(updated);
      return updated;
    });
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem(CART_KEY);
  }

  openSidebar():  void { this.sidebarOpen.set(true);  }
  closeSidebar(): void { this.sidebarOpen.set(false); }

  // ── Storage ────────────────────────────────────────────────────────────
  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}
