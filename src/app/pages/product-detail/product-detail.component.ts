import { Component, OnInit, signal, computed } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type Tab = 'overview' | 'specs' | 'downloads';

interface SpecRow { label: string; value: string; }

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {

  settings    = signal<AdminSiteSetting | null>(null);
  product     = signal<Product | null>(null);
  category    = signal<Category | null>(null);
  related     = signal<Product[]>([]);
  loading     = signal(true);
  error       = signal('');
  qty         = signal(1);
  addedToCart = signal(false);
  tab         = signal<Tab>('overview');
  imageIndex  = signal(0);

  navItems = DEFAULT_NAV_ITEMS;

  tabs: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Overview' },
    { key: 'specs',     label: 'Specifications' },
    { key: 'downloads', label: 'Downloads' },
  ];

  effectivePrice = computed(() => {
    const p = this.product();
    return p ? (p.discountPrice ?? p.price) : 0;
  });

  hasDiscount = computed(() => {
    const p = this.product();
    return !!p?.discountPrice && p.discountPrice < p.price;
  });

  total = computed(() => this.effectivePrice() * this.qty());

  /** Main photo first, then the gallery in its saved order (no duplicates). */
  gallery = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    const extra = [...(p.images ?? [])]
      .filter(i => i.isActive && i.imageUrl)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(i => i.imageUrl!);
    return [...new Set([...(p.primaryImage ? [p.primaryImage] : []), ...extra])];
  });

  /** Overview tab: paragraphs split on blank lines. */
  paragraphs = computed<string[]>(() => {
    const p = this.product();
    const text = (p?.description?.trim() || p?.summary?.trim() || '');
    return text ? text.split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  });

  /** Specifications tab: one `Label: Value` per line. */
  specs = computed<SpecRow[]>(() =>
    (this.product()?.specifications ?? '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const i = line.indexOf(':');
        return i > 0
          ? { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
          : { label: line, value: '' };
      })
  );

  /** The first few specs, shown as quick tiles beside the price. */
  keySpecs = computed(() => this.specs().filter(s => s.value).slice(0, 6));

  pdfUrl = computed<string | null>(() => this.product()?.download || null);

  /** Cloudinary serves the file inline; fl_attachment makes the same file download. */
  downloadHref = computed<string | null>(() => {
    const url = this.pdfUrl();
    return url ? url.replace('/upload/', '/upload/fl_attachment/') : null;
  });

  viewerUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.pdfUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private siteService:     AdminSiteSettingService,
    private productService:  ProductService,
    private categoryService: CategoryService,
    private sanitizer:       DomSanitizer,
    public  cartService:     CartService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    // The route param changes when a related product is opened from this page
    this.route.paramMap.subscribe(params => this.load(Number(params.get('id'))));
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.qty.set(1);
    this.tab.set('overview');
    this.imageIndex.set(0);

    this.productService.getById(id).subscribe(product => {
      if (!product) {
        this.error.set('Product not found.');
        this.loading.set(false);
        return;
      }
      this.product.set(product);
      this.loading.set(false);
      window.scrollTo({ top: 0 });

      this.productService.getList({ categoryId: product.categoryId, isAvailable: true, maxResultCount: 5 }).subscribe(res => {
        this.related.set(res.items.filter(p => p.id !== id).slice(0, 4));
      });

      this.categoryService.getList({ isPublished: true, maxResultCount: 100 }).subscribe(res => {
        this.category.set(res.items.find(c => c.id === product.categoryId) ?? null);
      });
    });
  }

  increment(): void { this.qty.update(q => q + 1); }
  decrement(): void { this.qty.update(q => Math.max(1, q - 1)); }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addItem(p, this.qty());
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  buyNow(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addItem(p, this.qty());
    this.router.navigate(['/checkout']);
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }
}
