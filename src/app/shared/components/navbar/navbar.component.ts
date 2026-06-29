import { Component, Input, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CartService } from '../../../core/services/cart.service';
import { LanguageService, LangOption } from '../../../core/services/language.service';

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
  imports: [RouterLink, RouterLinkActive, TranslatePipe, UpperCasePipe],
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
  langMenuOpen = signal(false);

  constructor(
    public cartService: CartService,
    public langService: LanguageService,
    private router: Router,
  ) {}

  toggleMobile(): void { this.mobileOpen.update(v => !v); }
  toggleLangMenu(): void { this.langMenuOpen.update(v => !v); }
  closeLangMenu(): void { this.langMenuOpen.set(false); }
  openCart(): void { this.router.navigate(['/cart']); }

  selectLang(option: LangOption): void {
    this.langService.setLang(option.code);
    this.langMenuOpen.set(false);
  }

  get currentLangOption(): LangOption {
    return this.langService.options.find(o => o.code === this.langService.currentLang()) ?? this.langService.options[0];
  }

  get brandInitial(): string {
    return (this.siteName || 'D')[0].toUpperCase();
  }

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
