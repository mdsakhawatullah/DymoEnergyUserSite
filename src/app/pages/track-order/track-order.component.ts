import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { OrderService } from '../../core/services/order.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { OrderStatus, OrderShipmentType, OrderPaymentType, OrderTracking } from '../../core/models/order.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type StepState = 'done' | 'now';
interface Step { label: string; when: string; state: StepState; tone: 'ok' | 'warn' | 'bad'; }

/** The normal journey, in order. Each entry is the order status that completes it. */
const PATH: OrderStatus[] = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered];

const PAYMENT_LABEL: Partial<Record<OrderPaymentType, string>> = {
  [OrderPaymentType.Cash]: 'Cash', [OrderPaymentType.CreditCard]: 'Credit card', [OrderPaymentType.DebitCard]: 'Debit card',
  [OrderPaymentType.BankTransfer]: 'Bank transfer', [OrderPaymentType.MobileBanking]: 'Mobile banking', [OrderPaymentType.Cheque]: 'Cheque',
  [OrderPaymentType.Online]: 'Online payment', [OrderPaymentType.CashOnDelivery]: 'Cash on delivery', [OrderPaymentType.Other]: 'Other',
  [OrderPaymentType.BKash]: 'bKash', [OrderPaymentType.Nagad]: 'Nagad', [OrderPaymentType.CardEmi]: 'Card EMI',
};

const SHIPMENT_LABEL: Partial<Record<OrderShipmentType, string>> = {
  [OrderShipmentType.Standard]: 'Home delivery', [OrderShipmentType.Express]: 'Express delivery', [OrderShipmentType.Overnight]: 'Overnight delivery',
  [OrderShipmentType.Pickup]: 'Showroom pickup', [OrderShipmentType.LocalDelivery]: 'Local delivery', [OrderShipmentType.Freight]: 'Freight',
  [OrderShipmentType.DeliveryAndInstall]: 'Delivery + installation',
};

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.scss',
})
export class TrackOrderComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;

  orderNumber = '';
  phone       = '';

  loading = signal(false);
  error   = signal('');
  order   = signal<OrderTracking | null>(null);

  isPickup = computed(() => this.order()?.shipmentType === OrderShipmentType.Pickup);

  /** Where the order is on the normal path, or how it left it. */
  private position = computed(() => {
    switch (this.order()?.status) {
      case OrderStatus.Pending:    return { idx: 0, extra: null as null | { label: string; tone: 'warn' | 'bad' } };
      case OrderStatus.Confirmed:  return { idx: 1, extra: null };
      case OrderStatus.Processing: return { idx: 2, extra: null };
      case OrderStatus.Shipped:    return { idx: 3, extra: null };
      case OrderStatus.Delivered:  return { idx: 4, extra: null };
      case OrderStatus.OnHold:     return { idx: 1, extra: { label: 'On hold', tone: 'warn' as const } };
      case OrderStatus.Cancelled:  return { idx: 0, extra: { label: 'Cancelled', tone: 'bad' as const } };
      case OrderStatus.Refunded:   return { idx: 4, extra: { label: 'Refunded', tone: 'warn' as const } };
      case OrderStatus.Returned:   return { idx: 4, extra: { label: 'Returned', tone: 'warn' as const } };
      default:                     return { idx: 0, extra: null };
    }
  });

  private stepLabel(status: OrderStatus): string {
    const pickup = this.isPickup();
    switch (status) {
      case OrderStatus.Pending:    return 'Placed';
      case OrderStatus.Confirmed:  return 'Confirmed';
      case OrderStatus.Processing: return 'Preparing';
      case OrderStatus.Shipped:    return pickup ? 'Ready for pickup' : 'Shipped';
      default:                     return pickup ? 'Collected' : 'Delivered';
    }
  }

  /** Only the stages the order has actually reached — nothing in the future. */
  steps = computed<Step[]>(() => {
    const o = this.order();
    if (!o) return [];
    const { idx, extra } = this.position();
    const steps: Step[] = PATH.slice(0, idx + 1).map((status, i) => {
      const last = i === idx && !extra;
      let when = '';
      if (i === 0) when = this.formatDateTime(o.orderDate);
      else if (status === OrderStatus.Delivered && o.actualDeliveryDate) when = this.formatDateTime(o.actualDeliveryDate);
      else if (last && o.lastUpdated) when = 'Updated ' + this.formatDateTime(o.lastUpdated);
      return { label: this.stepLabel(status), when, state: last ? 'now' : 'done', tone: 'ok' };
    });
    if (extra) steps.push({ label: extra.label, when: o.lastUpdated ? 'Updated ' + this.formatDateTime(o.lastUpdated) : '', state: 'now', tone: extra.tone });
    return steps;
  });

  /** A single line about what comes after the current stage. */
  nextHint = computed(() => {
    const o = this.order();
    const { idx, extra } = this.position();
    if (!o || extra || idx >= PATH.length - 1) return '';
    const next = this.stepLabel(PATH[idx + 1]);
    const eta = o.estimatedDeliveryDate && PATH[idx + 1] === OrderStatus.Delivered && !this.isPickup()
      ? ` — expected ${this.formatDate(o.estimatedDeliveryDate)}` : '';
    return `Next: ${next}${eta}`;
  });

  headline = computed(() => {
    const o = this.order();
    if (!o) return '';
    const pickup = this.isPickup();
    switch (o.status) {
      case OrderStatus.Pending:    return 'Order received — waiting for confirmation';
      case OrderStatus.Confirmed:  return 'Order confirmed';
      case OrderStatus.Processing: return 'We are getting your order ready';
      case OrderStatus.Shipped:    return pickup ? 'Ready for pickup' : 'On its way to you';
      case OrderStatus.Delivered:  return pickup ? 'Collected — thank you!' : 'Delivered — thank you!';
      case OrderStatus.OnHold:     return 'Your order is on hold';
      case OrderStatus.Cancelled:  return 'This order was cancelled';
      case OrderStatus.Refunded:   return 'This order was refunded';
      case OrderStatus.Returned:   return 'This order was returned';
      default:                     return 'Order status';
    }
  });

  subline = computed(() => {
    const o = this.order();
    if (!o) return '';
    switch (o.status) {
      case OrderStatus.Pending:    return 'Our team will call you to confirm the details.';
      case OrderStatus.Confirmed:  return 'We have confirmed your order and will start preparing it.';
      case OrderStatus.Processing: return 'Your items are being checked and packed.';
      case OrderStatus.Shipped:    return this.isPickup()
        ? 'Bring your order number and mobile number to the showroom.'
        : (o.estimatedDeliveryDate ? `Expected around ${this.formatDate(o.estimatedDeliveryDate)}.` : 'The courier will call you before delivery.');
      case OrderStatus.Delivered:  return o.actualDeliveryDate ? `On ${this.formatDate(o.actualDeliveryDate)}.` : 'We hope everything is working well.';
      case OrderStatus.OnHold:     return 'We need something from you or are waiting on stock. Our team will be in touch.';
      case OrderStatus.Cancelled:  return 'If this is a surprise, call us and quote your order number.';
      default:                     return 'Call us if you have any questions about this.';
    }
  });

  statusText = computed(() => {
    const s = this.order()?.status;
    return s ? ({ [OrderStatus.Pending]: 'Pending', [OrderStatus.Confirmed]: 'Confirmed', [OrderStatus.Processing]: 'Processing',
      [OrderStatus.OnHold]: 'On hold', [OrderStatus.Shipped]: this.isPickup() ? 'Ready for pickup' : 'Shipped',
      [OrderStatus.Delivered]: this.isPickup() ? 'Collected' : 'Delivered', [OrderStatus.Cancelled]: 'Cancelled',
      [OrderStatus.Refunded]: 'Refunded', [OrderStatus.Returned]: 'Returned' } as Record<number, string>)[s] ?? '' : '';
  });

  pillTone = computed<'ok' | 'warn' | 'bad'>(() => {
    const s = this.order()?.status;
    if (s === OrderStatus.Cancelled) return 'bad';
    if (s === OrderStatus.OnHold || s === OrderStatus.Refunded || s === OrderStatus.Returned) return 'warn';
    return 'ok';
  });

  paymentLabel  = computed(() => (this.order()?.paymentType != null ? PAYMENT_LABEL[this.order()!.paymentType!] : '') ?? '');
  shipmentLabel = computed(() => SHIPMENT_LABEL[this.order()?.shipmentType as OrderShipmentType] ?? '');

  constructor(
    private route:       ActivatedRoute,
    private siteService: AdminSiteSettingService,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    // A link from the confirmation page can pre-fill the order number (never the phone)
    const q = this.route.snapshot.queryParamMap.get('order');
    if (q) this.orderNumber = q;
  }

  submit(): void {
    const number = this.orderNumber.trim();
    const phone  = this.phone.trim();
    if (!number || !phone) { this.error.set('Enter both your order number and the mobile number you used.'); return; }

    this.loading.set(true);
    this.error.set('');
    this.orderService.track(number, phone).subscribe({
      next: o => { this.order.set(o); this.loading.set(false); },
      error: (e: HttpErrorResponse) => {
        this.order.set(null);
        this.loading.set(false);
        this.error.set(e.error?.error?.message || 'We could not look that up right now. Please try again.');
      },
    });
  }

  formatPrice(v: number): string { return '৳' + (v || 0).toLocaleString('en-IN'); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
      d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase();
  }
}
