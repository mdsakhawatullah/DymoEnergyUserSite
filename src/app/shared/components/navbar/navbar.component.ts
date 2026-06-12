import { Component, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

export interface NavItem {
  label: string;
  route: string;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Catalogues', route: '/catalogues' },
  { label: 'Quotes', route: '/quotes' },
  { label: 'Orders', route: '/orders' },
  { label: 'Projects', route: '/projects' },
  { label: 'Logistics', route: '/logistics' },
  { label: 'Setup', route: '/setup' },
];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  @Input() siteName = 'Org Name';
  @Input() logoUrl: string | undefined;
  @Input() navbarTextColor: string | undefined;
  @Input() primaryColor: string | undefined;
  @Input() navItems: NavItem[] = DEFAULT_NAV_ITEMS;

  mobileOpen = signal(false);

  constructor(public cartService: CartService) {}

  toggleMobile(): void { this.mobileOpen.update(v => !v); }
  openCart(): void     { this.cartService.openSidebar(); }

  /** First letter of siteName for the icon square */
  get brandInitial(): string {
    return (this.siteName || 'D')[0].toUpperCase();
  }

  /**
   * Split "DymoEnergy" → ["Dymo", "Energy"]
   * Splits at the second uppercase letter; falls back to half-length split.
   */
  get brandPart1(): string {
    const s = this.siteName || 'DymoEnergy';
    const idx = s.search(/(?<=.)[A-Z]/);
    return idx > 0 ? s.slice(0, idx) : s.slice(0, Math.ceil(s.length / 2));
  }

  get brandPart2(): string {
    const s = this.siteName || 'DymoEnergy';
    const idx = s.search(/(?<=.)[A-Z]/);
    return idx > 0 ? s.slice(idx) : s.slice(Math.ceil(s.length / 2));
  }
}
