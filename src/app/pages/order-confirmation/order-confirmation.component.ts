import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { OrderDto, OrderShipmentType } from '../../core/models/order.model';
import { CartItem } from '../../core/services/cart.service';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

interface Line { name: string; qty: number; total: number; imageUrl?: string; }
interface Step { title: string; text: string; state: 'done' | 'now' | 'todo'; }

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
  placed   = signal<CartItem[]>([]);
  error    = signal('');

  navItems = DEFAULT_NAV_ITEMS;

  firstName = computed(() => (this.order()?.customerName ?? '').trim().split(/\s+/)[0] || '');
  isPickup  = computed(() => this.order()?.shipmentType === OrderShipmentType.Pickup);

  /** Lines to show: the server's items when it sends them, otherwise what was in the cart. */
  lines = computed<Line[]>(() => {
    const o = this.order();
    if (o?.items?.length) return o.items.map(i => ({ name: i.productName ?? 'Item', qty: i.quantity, total: i.lineTotal }));
    return this.placed().map(i => ({ name: i.productName, qty: i.quantity, total: i.lineTotal, imageUrl: i.imageUrl }));
  });

  /** "Payment: bKash" is written into the order notes at checkout. */
  paymentLabel = computed(() => this.noteValue('Payment') ?? 'Cash on delivery');
  deliveryLabel = computed(() => this.noteValue('Delivery') ?? (this.isPickup() ? 'Showroom pickup' : 'Home delivery'));
  customerNotes = computed(() =>
    (this.order()?.notes ?? '').split('\n').filter(l => !/^(Payment|Delivery):/.test(l)).join('\n').trim());

  steps = computed<Step[]>(() => {
    const o = this.order();
    if (!o) return [];
    const pay = this.paymentLabel();
    const payText = /bkash|nagad/i.test(pay)
      ? `We will message you the ${pay} number and the amount to send (${this.formatPrice(o.grandTotal)}).`
      : /bank/i.test(pay)
        ? 'We will send you our bank account details to transfer the amount to.'
        : `You pay ${this.formatPrice(o.grandTotal)} in cash when the order is delivered.`;
    return [
      { title: 'Order placed', text: `Just now — ${this.formatPrice(o.grandTotal)} for ${this.lines().length} ${this.lines().length === 1 ? 'product' : 'products'}.`, state: 'done' },
      { title: 'Confirmation call', text: `Our team will call ${o.customerPhone ? 'you on ' + o.customerPhone : 'you'} to confirm the details.`, state: 'now' },
      { title: 'Payment', text: payText, state: 'todo' },
      this.isPickup()
        ? { title: 'Pickup', text: 'We will let you know when your order is ready to collect from the showroom.', state: 'todo' }
        : { title: 'Delivery', text: 'Your order is packed and sent by courier, usually within 1–3 days of confirmation.', state: 'todo' },
    ];
  });

  constructor(
    private router:      Router,
    private siteService: AdminSiteSettingService,
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state ?? history.state) as { order?: OrderDto; items?: CartItem[] } | undefined;

    if (state?.order) {
      this.order.set(state.order);
      this.placed.set(state.items ?? []);
    } else {
      this.error.set('Order details not available.');
    }

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });
  }

  print(): void { window.print(); }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }

  private noteValue(key: string): string | null {
    const m = (this.order()?.notes ?? '').match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  }
}
