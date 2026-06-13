import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { UserSiteSettingService } from '../../core/services/user-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { UserSiteSetting, UserSiteSettingImage } from '../../core/models/user-site-setting.model';
import { Catalogue } from '../../core/models/catalogue.model';
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
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Signals ─────────────────────────────────────────────────────────────
  settings          = signal<AdminSiteSetting | null>(null);
  userSiteSetting   = signal<UserSiteSetting | null>(null);
  catalogues        = signal<Catalogue[]>([]);
  searchQuery       = signal('');
  loading           = signal(true);
  cataloguesLoading = signal(true);

  navItems = DEFAULT_NAV_ITEMS;

  // ── Global theme colours ─────────────────────────────────────────────────
  primaryColor = computed(() => this.settings()?.primaryColor  || '#1a3a6b');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#f5a623'
  );

  // ── Active images for sticky card stack (sorted by DisplayOrder) ─────────
  siteImages = computed<UserSiteSettingImage[]>(() =>
    (this.userSiteSetting()?.images ?? [])
      .filter(img => img.isActive && img.imageUrl)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  );

  // ── Filtered catalogue list ──────────────────────────────────────────────
  filteredCatalogues = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.catalogues();
    return this.catalogues().filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.heroTitle?.toLowerCase().includes(q)
    );
  });

  // ── Active catalogue (selected via filter buttons) ───────────────────────
  selectedCatalogueId = signal<number | null>(null);

  activeCatalogue = computed(() => {
    const cats = this.filteredCatalogues();
    if (!cats.length) return null;
    const id = this.selectedCatalogueId();
    return cats.find(c => c.id === id) ?? cats[0];
  });

  selectCatalogue(id: number): void {
    this.selectedCatalogueId.set(id);
  }

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
    private siteService:         AdminSiteSettingService,
    private userSettingService:  UserSiteSettingService,
    private catalogueService:    CatalogueService,
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
        this.cataloguesLoading.set(false);
      });
  }

  ngAfterViewInit(): void {
    const v = this.heroVideoRef?.nativeElement;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Card helpers
  // ─────────────────────────────────────────────────────────────────────────
  getCardThumb(cat: Catalogue): string | null {
    return cat.thumbnailImageUrl || cat.primaryBackgroundImageUrl || null;
  }

  isBgImage(cat: Catalogue): boolean {
    return !cat.thumbnailImageUrl && !!cat.primaryBackgroundImageUrl;
  }

  getCardAccent(cat: Catalogue): string {
    return cat.accentColor || this.accentColor();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Search
  // ─────────────────────────────────────────────────────────────────────────
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Theme
  // ─────────────────────────────────────────────────────────────────────────
  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor)    root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    // Font is handled globally by App via UserSiteSettings — do not override --font here
  }
}
