import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { OrderService } from '../../core/services/order.service';
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
  loading  = signal(true);
  error    = signal('');

  navItems = DEFAULT_NAV_ITEMS;

  primaryColor = computed(() => this.settings()?.primaryColor  || '#1a3a6b');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#f5a623'
  );

  constructor(
    private route:        ActivatedRoute,
    private siteService:  AdminSiteSettingService,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s) this.applyTheme(s);
    });

    this.orderService.getById(id).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load order details.');
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: OrderStatus): string {
    return OrderStatus[status] ?? 'Pending';
  }

  formatPrice(value: number): string {
    return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-AU', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor)    root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily)      root.style.setProperty('--font', s.fontFamily);
  }
}
