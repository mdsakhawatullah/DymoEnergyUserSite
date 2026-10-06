import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Product } from '../../core/models/product.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  catalog  = signal<Product[]>([]);
  navItems = DEFAULT_NAV_ITEMS;

  /** A few in-stock products that are not already in the cart. */
  suggestions = computed(() => {
    const inCart = new Set(this.cartService.items().map(i => i.productId));
    return this.catalog().filter(p => !inCart.has(p.id) && p.price > 0).slice(0, 4);
  });

  constructor(
    private siteService:    AdminSiteSettingService,
    private productService: ProductService,
    public  cartService:    CartService,
    private router:         Router,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    this.productService.getList({ isAvailable: true, maxResultCount: 12 })
      .subscribe(r => this.catalog.set(r.items));
  }

  changeQty(productId: number, value: string): void {
    const n = parseInt(value, 10);
    this.cartService.updateQuantity(productId, isNaN(n) || n < 1 ? 1 : n);
  }

  increment(productId: number, current: number): void {
    this.cartService.updateQuantity(productId, current + 1);
  }

  decrement(productId: number, current: number): void {
    if (current > 1) this.cartService.updateQuantity(productId, current - 1);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
  }

  addSuggestion(p: Product): void {
    this.cartService.addItem(p, 1);
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
