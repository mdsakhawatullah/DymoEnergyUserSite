import { Component, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  @Input() navbarBgColor: string | undefined;
  @Input() navbarTextColor: string | undefined;
  @Input() primaryColor: string | undefined;
  @Input() navItems: NavItem[] = DEFAULT_NAV_ITEMS;

  mobileOpen = signal(false);

  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }
}
