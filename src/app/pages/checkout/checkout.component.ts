import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import {
  CreateOrderDto, CreateOrderItemDto,
  OrderStatus, OrderStage, OrderPriority, OrderShipmentType, OrderPaymentType, OrderCreateMethod,
} from '../../core/models/order.model';

type ShipKey = 'home' | 'pickup' | 'install';
type PayKey  = 'cod' | 'bank' | 'bkash' | 'nagad';

interface ShipOption { key: ShipKey; title: string; text: string; cost: number; }
interface PayOption  { key: PayKey; title: string; text: string; mark: string; markColor: string; }

const SHIPPING_COST = 1500;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  submitting = signal(false);
  errorMsg   = signal('');
  submitted  = signal(false);

  ship = signal<ShipKey>('home');
  pay  = signal<PayKey>('cod');

  divisions = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];

  shipOptions: ShipOption[] = [
    { key: 'home',    title: 'Home delivery',          text: 'Courier to your door, 1–3 days in Chattogram & Dhaka.', cost: SHIPPING_COST },
    { key: 'pickup',  title: 'Showroom pickup',        text: 'Collect it from our showroom once we confirm it is ready.', cost: 0 },
    { key: 'install', title: 'Delivery + installation', text: 'We deliver, then book the installation date with you after a site survey.', cost: SHIPPING_COST },
  ];

  payOptions: PayOption[] = [
    { key: 'cod',   title: 'Cash on delivery', text: 'Pay with cash when your order arrives',  mark: '৳',  markColor: '#0E6B3F' },
    { key: 'bank',  title: 'Bank transfer',    text: 'Transfer directly to our bank account',  mark: '🏦', markColor: '#2B6CB0' },
    { key: 'bkash', title: 'bKash',            text: 'Pay via bKash mobile banking',          mark: 'bK', markColor: '#E2136E' },
    { key: 'nagad', title: 'Nagad',            text: 'Pay via Nagad mobile banking',          mark: 'Ng', markColor: '#F15A24' },
  ];

  navItems = [];

  form = {
    name:     '',
    phone:    '',
    email:    '',
    division: 'Chattogram',
    district: '',
    area:     '',
    street:   '',
    landmark: '',
    notes:    '',
  };

  shippingCost = computed(() => this.shipOptions.find(s => s.key === this.ship())?.cost ?? 0);
  total        = computed(() => this.cartService.subtotal() + this.shippingCost());
  isPickup     = computed(() => this.ship() === 'pickup');

  payNote = computed(() => {
    switch (this.pay()) {
      case 'bkash': return 'After you place the order we will message you the bKash number and the amount to send. Keep your phone nearby.';
      case 'nagad': return 'After you place the order we will message you the Nagad number and the amount to send. Keep your phone nearby.';
      case 'bank':  return 'After you place the order we will send you our bank account details to transfer the amount to.';
      default:      return 'You pay in cash when the order is delivered. We will call you to confirm it first.';
    }
  });

  constructor(
    private siteService:  AdminSiteSettingService,
    public  cartService:  CartService,
    private orderService: OrderService,
    private router:       Router,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });
  }

  // ── Validation ───────────────────────────────────────────────────────────
  get nameOk():   boolean { return !!this.form.name.trim(); }
  get phoneOk():  boolean { return /^[+\d][\d\s-]{6,}$/.test(this.form.phone.trim()); }
  get emailOk():  boolean { return !this.form.email.trim() || /^\S+@\S+\.\S+$/.test(this.form.email.trim()); }
  get streetOk(): boolean { return this.isPickup() || !!this.form.street.trim(); }
  get valid():    boolean { return this.nameOk && this.phoneOk && this.emailOk && this.streetOk; }

  get deliveryAddress(): string {
    if (this.isPickup()) return 'Showroom pickup';
    const f = this.form;
    return [f.street, f.area, f.district, f.division, 'Bangladesh', f.landmark ? `(Landmark: ${f.landmark})` : '']
      .map(s => s.trim()).filter(Boolean).join(', ');
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  placeOrder(): void {
    this.submitted.set(true);
    if (!this.valid) {
      this.errorMsg.set('Please fill in the highlighted fields.');
      document.querySelector('.field--err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (this.cartService.items().length === 0) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const items    = this.cartService.items();
    const subtotal = this.cartService.subtotal();
    const shipping = this.shippingCost();
    const grand    = subtotal + shipping;
    const shipOpt  = this.shipOptions.find(s => s.key === this.ship())!;
    const payOpt   = this.payOptions.find(p => p.key === this.pay())!;

    const orderItems: CreateOrderItemDto[] = items.map((item, idx) => ({
      productId: item.productId, productName: item.productName, sku: item.sku,
      quantity: item.quantity, unitPrice: item.unitPrice,
      discountPercent: 0, discountAmount: 0, taxRate: 0, taxAmount: 0,
      lineTotal: item.lineTotal, displayOrder: idx + 1,
    }));

    const notes = [`Delivery: ${shipOpt.title}`, `Payment: ${payOpt.title}`, this.form.notes.trim()].filter(Boolean).join('\n');

    const dto: CreateOrderDto = {
      orderDate:       new Date().toISOString(),
      customerName:    this.form.name.trim(),
      customerEmail:   this.form.email.trim() || undefined,
      customerPhone:   this.form.phone.trim(),
      deliveryAddress: this.deliveryAddress,
      billingAddress:  this.deliveryAddress,
      deliveryContact: this.form.name.trim(),
      deliveryPhone:   this.form.phone.trim(),
      notes,
      status:       OrderStatus.Pending,
      stage:        OrderStage.New,
      priority:     OrderPriority.Normal,
      shipmentType: this.ship() === 'pickup' ? OrderShipmentType.Pickup : this.ship() === 'install' ? OrderShipmentType.DeliveryAndInstall : OrderShipmentType.Standard,
      paymentType:  { cod: OrderPaymentType.CashOnDelivery, bank: OrderPaymentType.BankTransfer, bkash: OrderPaymentType.BKash, nagad: OrderPaymentType.Nagad }[this.pay()],
      createMethod: OrderCreateMethod.Web,
      currencyCode: 'BDT',
      subtotal,
      discountTotal: 0,
      taxRate:       0,
      taxTotal:      0,
      shippingCost:  shipping,
      grandTotal:    grand,
      amountPaid:    0,
      balanceDue:    grand,
      items:         orderItems,
    };

    const placed = [...items];
    this.orderService.create(dto).subscribe({
      next: order => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation'], { state: { order, items: placed } });
      },
      error: err => {
        console.error(err);
        this.errorMsg.set('Failed to place order. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }
}
