import { Component, Input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CartService } from '../../../core/services/cart.service';
import { LanguageService, LangOption } from '../../../core/services/language.service';

export interface NavItem {
  label: string;
  route: string;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Shop', route: '/shop' },
  { label: 'Solar Calculator', route: '/solar-calculator' },
  { label: 'Quote', route: '/quote' },
];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  @Input() siteName = 'Org Name';
  @Input() logoUrl: string | undefined;
  @Input() navbarTextColor: string | undefined;
  @Input() primaryColor: string | undefined;
  @Input() navItems: NavItem[] = DEFAULT_NAV_ITEMS;
  @Input() phone: string | undefined;

  mainNav = [
    { label: 'Shop',     route: '/shop',             menu: true,  active: true },
    { label: 'Packages', route: '/shop',             menu: false, active: false },
    { label: 'Tools',    route: '/solar-calculator', menu: true,  active: true },
    { label: 'Services', route: '/quote',            menu: false, active: false },
    { label: 'Projects', route: '/',                 menu: false, active: false },
    { label: 'Learn',    route: '/',                 menu: false, active: false },
  ];

  mobileOpen = signal(false);
  cartOpen   = signal(false);

  constructor(
    public cartService: CartService,
    public langService: LanguageService,
    private router: Router,
  ) {}

  toggleMobile(): void { this.mobileOpen.update(v => !v); }
  toggleCart(): void { this.cartOpen.update(v => !v); }
  closeCart(): void  { this.cartOpen.set(false); }
  fmtPrice(n: number): string { return '৳' + n.toLocaleString('en-IN'); }

  onSearch(term: string): void {
    this.router.navigate(['/shop'], term ? { queryParams: { q: term } } : undefined);
  }

  langShort(code: string): string {
    return code === 'bn' ? 'বাং' : code.toUpperCase();
  }

  selectLang(option: LangOption): void {
    this.langService.setLang(option.code);
  }


}
