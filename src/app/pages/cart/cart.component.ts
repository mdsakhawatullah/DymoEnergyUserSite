import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, TranslatePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;

  primaryColor = computed(() => this.settings()?.primaryColor  || '#2D3B60');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#A4DF38'
  );

  constructor(
    private siteService: AdminSiteSettingService,
    public  cartService: CartService,
    private router:      Router,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s) this.applyTheme(s);
    });
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

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
  }
}
