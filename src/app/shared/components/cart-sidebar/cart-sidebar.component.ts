import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './cart-sidebar.component.html',
  styleUrl: './cart-sidebar.component.scss',
})
export class CartSidebarComponent {

  constructor(public cartService: CartService, private router: Router) {}

  close(): void {
    this.cartService.closeSidebar();
  }

  goToCheckout(): void {
    this.cartService.closeSidebar();
    this.router.navigate(['/checkout']);
  }

  remove(productId: number): void {
    this.cartService.removeItem(productId);
  }

  changeQty(item: CartItem, delta: number): void {
    this.cartService.updateQuantity(item.productId, item.quantity + delta);
  }

  setQty(item: CartItem, value: string): void {
    const n = parseInt(value, 10);
    this.cartService.updateQuantity(item.productId, isNaN(n) ? 1 : n);
  }

  formatPrice(value: number): string {
    return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  }
}
