import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import {
  CreateOrderDto, CreateOrderItemDto,
  OrderStatus, OrderStage, OrderPriority, OrderShipmentType, OrderCreateMethod,
} from '../../core/models/order.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  submitting = signal(false);
  errorMsg   = signal('');

  navItems = DEFAULT_NAV_ITEMS;

  primaryColor = computed(() => this.settings()?.primaryColor  || '#1a3a6b');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#f5a623'
  );

  // ── Form model ────────────────────────────────────────────────────────
  form = {
    customerName:      '',
    customerEmail:     '',
    customerPhone:     '',
    customerReference: '',
    deliveryAddress:   '',
    sameAsBilling:     true,
    billingAddress:    '',
    deliveryContact:   '',
    deliveryPhone:     '',
    notes:             '',
  };

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

  changeItemQty(productId: number, value: string): void {
    const n = parseInt(value, 10);
    this.cartService.updateQuantity(productId, isNaN(n) ? 1 : n);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
  }

  get canSubmit(): boolean {
    return this.cartService.items().length > 0 && !!this.form.customerName.trim() && !this.submitting();
  }

  formatPrice(value: number): string {
    return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  }

  placeOrder(): void {
    if (!this.canSubmit) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const items = this.cartService.items();
    const subtotal = this.cartService.subtotal();

    const orderItems: CreateOrderItemDto[] = items.map((item, idx) => ({
      productId:      item.productId,
      productName:    item.productName,
      sku:            item.sku,
      quantity:       item.quantity,
      unitPrice:      item.unitPrice,
      discountPercent: 0,
      discountAmount:  0,
      taxRate:         0,
      taxAmount:       0,
      lineTotal:       item.lineTotal,
      displayOrder:    idx + 1,
    }));

    const dto: CreateOrderDto = {
      orderDate:          new Date().toISOString(),
      customerName:       this.form.customerName      || undefined,
      customerEmail:      this.form.customerEmail     || undefined,
      customerPhone:      this.form.customerPhone     || undefined,
      customerReference:  this.form.customerReference || undefined,
      deliveryAddress:    this.form.deliveryAddress   || undefined,
      billingAddress:     this.form.sameAsBilling
                            ? (this.form.deliveryAddress  || undefined)
                            : (this.form.billingAddress   || undefined),
      deliveryContact:    this.form.deliveryContact   || undefined,
      deliveryPhone:      this.form.deliveryPhone     || undefined,
      notes:              this.form.notes             || undefined,
      status:       OrderStatus.Pending,
      stage:        OrderStage.New,
      priority:     OrderPriority.Normal,
      shipmentType: OrderShipmentType.Standard,
      createMethod: OrderCreateMethod.Web,
      currencyCode: 'AUD',
      subtotal,
      discountTotal: 0,
      taxRate:       0,
      taxTotal:      0,
      shippingCost:  0,
      grandTotal:    subtotal,
      amountPaid:    0,
      balanceDue:    subtotal,
      items:         orderItems,
    };

    this.orderService.create(dto).subscribe({
      next: order => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation', order.id]);
      },
      error: err => {
        console.error(err);
        this.errorMsg.set('Failed to place order. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor)    root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily)      root.style.setProperty('--font', s.fontFamily);
  }
}
