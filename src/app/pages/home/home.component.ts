import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { UserSiteSettingService } from '../../core/services/user-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { UserSiteSetting, UserSiteSettingImage } from '../../core/models/user-site-setting.model';
import { Catalogue } from '../../core/models/catalogue.model';
import { Product } from '../../core/models/product.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

interface Review {
  author: string;
  role: string;
  rating: number;
  comment: string;
  initials: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Signals ─────────────────────────────────────────────────────────────
  settings          = signal<AdminSiteSetting | null>(null);
  userSiteSetting   = signal<UserSiteSetting | null>(null);
  catalogues        = signal<Catalogue[]>([]);
  allProducts       = signal<Product[]>([]);
  loading           = signal(true);
  productsLoading   = signal(true);
  newsletterEmail   = '';

  navItems = DEFAULT_NAV_ITEMS;

  // ── Global theme colours ─────────────────────────────────────────────────
  primaryColor = computed(() => this.settings()?.primaryColor  || '#2D3B60');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#A4DF38'
  );

  // ── Active images for the hero strip (sorted by DisplayOrder) ────────────
  siteImages = computed<UserSiteSettingImage[]>(() =>
    (this.userSiteSetting()?.images ?? [])
      .filter(img => img.isActive && img.imageUrl)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  );

  // ── Featured products: isFeatured first, else first 4 active ─────────────
  featuredProducts = computed<Product[]>(() => {
    const all = this.allProducts();
    const featured = all.filter(p => p.isFeatured);
    const source = featured.length ? featured : all;
    return source.slice(0, 4);
  });

  // ── Static review data ───────────────────────────────────────────────────
  reviews: Review[] = [
    {
      author: 'Sarah Mitchell',
      role: 'Procurement Manager',
      rating: 5,
      comment: 'This purchasing portal has completely streamlined our procurement process. The catalogue browsing is intuitive and order tracking is excellent.',
      initials: 'SM',
    },
    {
      author: 'James Okoye',
      role: 'Operations Director',
      rating: 5,
      comment: 'Outstanding platform. We reduced our sourcing time by 40% after switching. The product range and pricing transparency are second to none.',
      initials: 'JO',
    },
    {
      author: 'Linda Fernandez',
      role: 'Supply Chain Lead',
      rating: 4,
      comment: 'Very reliable and easy to navigate. Our team adopted it with minimal training. Great customer support team as well.',
      initials: 'LF',
    },
  ];

  constructor(
    private siteService:        AdminSiteSettingService,
    private userSettingService: UserSiteSettingService,
    private catalogueService:   CatalogueService,
    private productService:     ProductService,
    public  cartService:        CartService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      this.loading.set(false);
      if (s) this.applyTheme(s);
    });

    this.userSettingService.getActive().subscribe(us => {
      this.userSiteSetting.set(us);
    });

    this.catalogueService
      .getList({ isPublished: true, maxResultCount: 50 })
      .subscribe(result => {
        this.catalogues.set(result.items);
      });

    this.productService
      .getList({ isAvailable: true, maxResultCount: 50 })
      .subscribe(result => {
        this.allProducts.set(result.items);
        this.productsLoading.set(false);
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Products
  // ─────────────────────────────────────────────────────────────────────────
  addToCart(product: Product): void {
    this.cartService.addItem(product, 1);
  }

  cartQty(productId: number): number {
    return this.cartService.items().find(i => i.productId === productId)?.quantity ?? 0;
  }

  increaseQty(product: Product): void {
    this.cartService.addItem(product, 1);
  }

  decreaseQty(product: Product): void {
    const qty = this.cartQty(product.id);
    this.cartService.updateQuantity(product.id, qty - 1);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeItem(productId);
  }

  subscribeNewsletter(): void {
    if (!this.newsletterEmail.trim()) return;
    this.newsletterEmail = '';
  }

  formatPrice(price: number): string {
    if (!price) return '৳0';
    return '৳' + price.toLocaleString('en-IN');
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Catalogue helpers (kept for siteImages)
  // ─────────────────────────────────────────────────────────────────────────
  getCardAccent(cat: Catalogue): string {
    return cat.accentColor || this.accentColor();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Lifecycle: video
  // ─────────────────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    const v = this.heroVideoRef?.nativeElement;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Theme
  // ─────────────────────────────────────────────────────────────────────────
  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
    // Font is handled globally by App via UserSiteSettings — do not override --font here
  }
}
