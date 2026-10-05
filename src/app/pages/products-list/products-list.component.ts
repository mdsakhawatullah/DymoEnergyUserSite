import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {

  settings         = signal<AdminSiteSetting | null>(null);
  category         = signal<Category | null>(null);
  categories       = signal<Category[]>([]);
  products         = signal<Product[]>([]);
  productsLoading  = signal(true);

  // ── Filters / sorting / paging ─────────────────────────────────────────
  searchQuery  = signal('');
  minPrice     = signal<number | null>(null);
  maxPrice     = signal<number | null>(null);
  inStockOnly  = signal(false);
  sort         = signal<SortKey>('featured');
  page         = signal(1);

  navItems   = DEFAULT_NAV_ITEMS;
  categoryId = 0;
  skeletons  = [1, 2, 3, 4, 5, 6];

  private unitPrice = (p: Product) => p.discountPrice ?? p.price;

  filteredProducts = computed(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const min = this.minPrice();
    const max = this.maxPrice();
    const stock = this.inStockOnly();

    const list = this.products().filter(p =>
      (!q || p.name?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)) &&
      (min === null || this.unitPrice(p) >= min) &&
      (max === null || this.unitPrice(p) <= max) &&
      (!stock || p.stockQuantity > 0)
    );

    switch (this.sort()) {
      case 'price-asc':  return [...list].sort((a, b) => this.unitPrice(a) - this.unitPrice(b));
      case 'price-desc': return [...list].sort((a, b) => this.unitPrice(b) - this.unitPrice(a));
      case 'name':       return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
      default:           return [...list].sort((a, b) => a.displayOrder - b.displayOrder);
    }
  });

  pageCount = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / PAGE_SIZE)));
  pages     = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));
  pageItems = computed(() => {
    const start = (Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE;
    return this.filteredProducts().slice(start, start + PAGE_SIZE);
  });

  // ── Price slider ───────────────────────────────────────────────────────
  bounds = computed(() => {
    const prices = this.products().map(this.unitPrice);
    if (!prices.length) return { min: 0, max: 0, step: 1 };
    const step = Math.max(...prices) > 5000 ? 100 : 10;
    return { min: Math.floor(Math.min(...prices) / step) * step, max: Math.ceil(Math.max(...prices) / step) * step, step };
  });
  lo = computed(() => Math.max(this.minPrice() ?? this.bounds().min, this.bounds().min));
  hi = computed(() => Math.min(this.maxPrice() ?? this.bounds().max, this.bounds().max));
  loPct = computed(() => this.pct(this.lo()));
  hiPct = computed(() => 100 - this.pct(this.hi()));

  hasFilters = computed(() => this.minPrice() !== null || this.maxPrice() !== null || this.inStockOnly());

  constructor(
    private route:           ActivatedRoute,
    private siteService:     AdminSiteSettingService,
    private categoryService: CategoryService,
    private productService:  ProductService,
    public  cartService:     CartService,
  ) {}

  ngOnInit(): void {
    this.categoryId = Number(this.route.snapshot.paramMap.get('id'));

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s) this.applyTheme(s);
    });

    this.categoryService
      .getList({ isPublished: true, maxResultCount: 100 })
      .subscribe(result => {
        this.categories.set(result.items);
        const found = result.items.find(c => c.id === this.categoryId);
        if (found) this.category.set(found);
      });

    this.productService
      .getList({ categoryId: this.categoryId, maxResultCount: 100 })
      .subscribe(result => {
        this.products.set(result.items);
        this.productsLoading.set(false);
      });
  }

  // ── Handlers ───────────────────────────────────────────────────────────
  onSearch(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); this.page.set(1); }
  onLo(e: Event): void  { this.setLo(+(e.target as HTMLInputElement).value); }
  onHi(e: Event): void  { this.setHi(+(e.target as HTMLInputElement).value); }
  onMin(e: Event): void { this.setLo(this.parse(e)); (e.target as HTMLInputElement).value = this.fmt(this.lo()); }
  onMax(e: Event): void { this.setHi(this.parse(e)); (e.target as HTMLInputElement).value = this.fmt(this.hi()); }
  onSort(e: Event): void   { this.sort.set((e.target as HTMLSelectElement).value as SortKey); this.page.set(1); }
  toggleStock(): void      { this.inStockOnly.update(v => !v); this.page.set(1); }

  clearFilters(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.inStockOnly.set(false);
    this.page.set(1);
  }

  goTo(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.pageCount()));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Per-card quantity ──────────────────────────────────────────────────
  private quantities = signal<Record<number, number>>({});

  qty(p: Product): number { return this.quantities()[p.id] ?? 1; }

  changeQty(p: Product, delta: number): void {
    const next = Math.max(1, this.qty(p) + delta);
    this.quantities.update(q => ({ ...q, [p.id]: next }));
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product, this.qty(product));
    this.quantities.update(q => ({ ...q, [product.id]: 1 }));
  }

  formatPrice(price: number): string {
    if (!price) return '৳0';
    return '৳' + price.toLocaleString('en-IN');
  }

  fmt(n: number): string { return n.toLocaleString('en-US'); }

  private setLo(v: number): void {
    const { min, step } = this.bounds();
    const val = Math.min(Math.max(v, min), this.hi() - step);
    this.minPrice.set(val <= min ? null : val);
    this.page.set(1);
  }

  private setHi(v: number): void {
    const { max, step } = this.bounds();
    const val = Math.max(Math.min(v, max), this.lo() + step);
    this.maxPrice.set(val >= max ? null : val);
    this.page.set(1);
  }

  private pct(v: number): number {
    const { min, max } = this.bounds();
    return max > min ? ((v - min) / (max - min)) * 100 : 0;
  }

  private parse(e: Event): number {
    return Number((e.target as HTMLInputElement).value.replace(/[^\d]/g, '')) || 0;
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor)    root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily)      root.style.setProperty('--font', s.fontFamily);
  }
}
