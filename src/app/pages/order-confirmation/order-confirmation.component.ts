import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { OrderDto, OrderStatus } from '../../core/models/order.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
})
export class OrderConfirmationComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  order    = signal<OrderDto | null>(null);
  error    = signal('');

  navItems = DEFAULT_NAV_ITEMS;

  primaryColor = computed(() => this.settings()?.primaryColor  || '#2D3B60');

  constructor(
    private router:      Router,
    private siteService: AdminSiteSettingService,
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const order: OrderDto | undefined = nav?.extras?.state?.['order']
      ?? (history.state as { order?: OrderDto })?.order;

    if (order) {
      this.order.set(order);
    } else {
      this.error.set('Order details not available.');
    }

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });
  }

  statusLabel(status: OrderStatus): string {
    return OrderStatus[status] ?? 'Pending';
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
