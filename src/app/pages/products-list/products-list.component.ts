import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Catalogue } from '../../core/models/catalogue.model';
import { Product } from '../../core/models/product.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, NgStyle, NavbarComponent, FooterComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {

  settings         = signal<AdminSiteSetting | null>(null);
  catalogue        = signal<Catalogue | null>(null);
  products         = signal<Product[]>([]);
  searchQuery      = signal('');
  loading          = signal(true);
  productsLoading  = signal(true);

  navItems   = DEFAULT_NAV_ITEMS;
  quantities: Record<number, number> = {};
  catalogueId = 0;

  primaryColor = computed(() => this.settings()?.primaryColor  || '#2D3B60');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#A4DF38'
  );

  /** Background style for the page header — uses catalogue's primary image when available */
  headerBgStyle = computed(() => {
    const img = this.catalogue()?.primaryBackgroundImageUrl;
    if (!img) return {};
    return {
      'background-image':    `url(${img})`,
      'background-size':     'cover',
      'background-position': 'center',
    };
  });

  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(
      p =>
        p.name?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  });

  constructor(
    private route:            ActivatedRoute,
    private siteService:      AdminSiteSettingService,
    private catalogueService: CatalogueService,
    private productService:   ProductService,
    public  cartService:      CartService,
  ) {}

  ngOnInit(): void {
    this.catalogueId = Number(this.route.snapshot.paramMap.get('id'));

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      this.loading.set(false);
      if (s) this.applyTheme(s);
    });

    this.catalogueService
      .getList({ isPublished: true, maxResultCount: 100 })
      .subscribe(result => {
        const found = result.items.find(c => c.id === this.catalogueId);
        if (found) this.catalogue.set(found);
      });

    this.productService
      .getList({ catalogueId: this.catalogueId, maxResultCount: 100 })
      .subscribe(result => {
        this.products.set(result.items);
        result.items.forEach(p => (this.quantities[p.id] = 1));
        this.productsLoading.set(false);
      });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getQuantity(productId: number): number {
    return this.quantities[productId] ?? 1;
  }

  setQuantity(productId: number, value: string): void {
    const n = parseInt(value, 10);
    this.quantities[productId] = isNaN(n) || n < 1 ? 1 : n;
  }

  addToCart(product: Product): void {
    const qty = this.quantities[product.id] ?? 1;
    this.cartService.addItem(product, qty);
  }

  formatPrice(price: number): string {
    if (!price) return '৳0';
    return '৳' + price.toLocaleString('en-IN');
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor)    root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily)      root.style.setProperty('--font', s.fontFamily);
  }
}
