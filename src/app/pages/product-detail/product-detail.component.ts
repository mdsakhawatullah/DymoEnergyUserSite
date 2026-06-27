import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { ProductService } from '../../core/services/product.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Product } from '../../core/models/product.model';
import { Catalogue } from '../../core/models/catalogue.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  product    = signal<Product | null>(null);
  catalogue  = signal<Catalogue | null>(null);
  related    = signal<Product[]>([]);
  loading    = signal(true);
  error      = signal('');
  qty        = signal(1);
  addedToCart = signal(false);

  navItems = DEFAULT_NAV_ITEMS;

  effectivePrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return p.discountPrice ?? p.price;
  });

  hasDiscount = computed(() => {
    const p = this.product();
    return !!p?.discountPrice && p.discountPrice < p.price;
  });

  constructor(
    private route:            ActivatedRoute,
    private siteService:      AdminSiteSettingService,
    private productService:   ProductService,
    private catalogueService: CatalogueService,
    public  cartService:      CartService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.productService.getById(id).subscribe(product => {
      if (!product) {
        this.error.set('Product not found.');
        this.loading.set(false);
        return;
      }
      this.product.set(product);
      this.loading.set(false);

      this.productService.getList({ catalogueId: product.catalogueId, isAvailable: true, maxResultCount: 5 }).subscribe(res => {
        this.related.set(res.items.filter(p => p.id !== id).slice(0, 4));
      });

      this.catalogueService.getList({ isPublished: true, maxResultCount: 100 }).subscribe(res => {
        const cat = res.items.find(c => c.id === product.catalogueId) ?? null;
        this.catalogue.set(cat);
      });
    });
  }

  increment(): void { this.qty.update(q => q + 1); }
  decrement(): void { if (this.qty() > 1) this.qty.update(q => q - 1); }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addItem(p, this.qty());
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }
}
