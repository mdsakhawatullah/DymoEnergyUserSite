import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import {
  CreateOrderDto, CreateOrderItemDto,
  OrderStatus, OrderStage, OrderPriority, OrderShipmentType, OrderCreateMethod,
} from '../../core/models/order.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule, NgTemplateOutlet, NavbarComponent, FooterComponent, TranslatePipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  submitting = signal(false);
  errorMsg   = signal('');
  step       = signal(1); // 1 = Shipping, 2 = Review, 3 = Payment

  navItems      = DEFAULT_NAV_ITEMS;
  shippingCost  = 1500;
  paymentMethod = 'cod';

  primaryColor = computed(() => this.settings()?.primaryColor  || '#2D3B60');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#A4DF38'
  );

  form = {
    firstName:     '',
    lastName:      '',
    customerEmail: '',
    customerPhone: '',
    streetAddress: '',
    city:          '',
    division:      'Dhaka',
    notes:         '',
  };

  get deliveryAddress(): string {
    return [this.form.streetAddress, this.form.city, this.form.division, 'Bangladesh']
      .filter(Boolean).join(', ');
  }

  get fullName(): string {
    return `${this.form.firstName} ${this.form.lastName}`.trim();
  }

  constructor(
    private siteService:  AdminSiteSettingService,
    public  cartService:  CartService,
    private orderService: OrderService,
    private router:       Router,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s) this.applyTheme(s);
    });
  }

  // ── Step navigation ──────────────────────────────────────────────────────
  goToReview(): void {
    if (!this.form.firstName.trim()) return;
    this.errorMsg.set('');
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToPayment(): void {
    this.step.set(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  back(): void {
    this.step.update(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Final submit ─────────────────────────────────────────────────────────
  placeOrder(): void {
    this.submitting.set(true);
    this.errorMsg.set('');

    const items    = this.cartService.items();
    const subtotal = this.cartService.subtotal();
    const grand    = subtotal + this.shippingCost;

    const orderItems: CreateOrderItemDto[] = items.map((item, idx) => ({
      productId:       item.productId,
      productName:     item.productName,
      sku:             item.sku,
      quantity:        item.quantity,
      unitPrice:       item.unitPrice,
      discountPercent: 0,
      discountAmount:  0,
      taxRate:         0,
      taxAmount:       0,
      lineTotal:       item.lineTotal,
      displayOrder:    idx + 1,
    }));

    const dto: CreateOrderDto = {
      orderDate:        new Date().toISOString(),
      customerName:     this.fullName      || undefined,
      customerEmail:    this.form.customerEmail  || undefined,
      customerPhone:    this.form.customerPhone  || undefined,
      deliveryAddress:  this.deliveryAddress     || undefined,
      billingAddress:   this.deliveryAddress     || undefined,
      notes:            this.form.notes          || undefined,
      status:       OrderStatus.Pending,
      stage:        OrderStage.New,
      priority:     OrderPriority.Normal,
      shipmentType: OrderShipmentType.Standard,
      createMethod: OrderCreateMethod.Web,
      currencyCode: 'BDT',
      subtotal,
      discountTotal: 0,
      taxRate:       0,
      taxTotal:      0,
      shippingCost:  this.shippingCost,
      grandTotal:    grand,
      amountPaid:    0,
      balanceDue:    grand,
      items:         orderItems,
    };

    this.orderService.create(dto).subscribe({
      next: order => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation'], { state: { order } });
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

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
  }
}
