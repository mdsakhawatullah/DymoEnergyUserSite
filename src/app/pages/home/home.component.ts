import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Catalogue, CatalogueLayoutType, CatalogueLayoutTypeLabel } from '../../core/models/catalogue.model';
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
export class HomeComponent implements OnInit {
  private siteService      = inject(AdminSiteSettingService);
  private catalogueService = inject(CatalogueService);

  // ── Signals ─────────────────────────────────────────────────────────────
  settings          = signal<AdminSiteSetting | null>(null);
  catalogues        = signal<Catalogue[]>([]);
  searchQuery       = signal('');
  loading           = signal(true);
  cataloguesLoading = signal(true);

  navItems = DEFAULT_NAV_ITEMS;

  // ── Global theme colours (fallbacks when a catalogue has none) ───────────
  primaryColor = computed(() => this.settings()?.primaryColor  || '#1a3a6b');
  accentColor  = computed(() =>
    this.settings()?.buttonColor    ||
    this.settings()?.secondaryColor ||
    '#f5a623'
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

  // ─────────────────────────────────────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      this.loading.set(false);
      if (s) this.applyTheme(s);
    });

    // Fetch published catalogues ordered by DisplayOrder (server-side)
    this.catalogueService
      .getList({ isPublished: true, maxResultCount: 50 })
      .subscribe(result => {
        this.catalogues.set(result.items);
        this.cataloguesLoading.set(false);
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Card helpers — per-catalogue theming driven by admin
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Best image for the card thumbnail:
   * 1. thumbnailImageUrl (admin-set dedicated thumbnail)
   * 2. primaryBackgroundImageUrl (background used as card image)
   * Both are direct URL fields on the Catalogue — no images[] join needed.
   */
  getCardThumb(cat: Catalogue): string | null {
    return cat.thumbnailImageUrl || cat.primaryBackgroundImageUrl || null;
  }

  /**
   * Whether the card image is a background image (needs an overlay).
   * True when there is no dedicated thumbnail but there is a bg image.
   */
  isBgImage(cat: Catalogue): boolean {
    return !cat.thumbnailImageUrl && !!cat.primaryBackgroundImageUrl;
  }

  /**
   * Per-catalogue accent colour (featured badge, CTA link, hover underline).
   * Falls back to the global accent from AdminSiteSettings.
   */
  getCardAccent(cat: Catalogue): string {
    return cat.accentColor || this.accentColor();
  }

  /**
   * Per-catalogue primary text colour for title.
   * Falls back to solid dark — never undefined.
   */
  getCardTextColor(cat: Catalogue): string {
    return cat.primaryTextColor || '#1a1a1a';
  }

  /**
   * CTA button label — admin can customise per catalogue via heroCtaText.
   */
  getCardCtaText(cat: Catalogue): string {
    return cat.heroCtaText || 'View Catalogue';
  }

  /**
   * Human-readable layout type label shown as a subtle chip.
   */
  getLayoutLabel(cat: Catalogue): string {
    return CatalogueLayoutTypeLabel[cat.layoutType] ?? '';
  }

  /**
   * Whether to show the heroTitle as a sub-heading on the card.
   * Only shown when it differs from the catalogue name.
   */
  showHeroTitle(cat: Catalogue): boolean {
    return !!cat.heroTitle && cat.heroTitle !== cat.name;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Search
  // ─────────────────────────────────────────────────────────────────────────
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Theme application
  // ─────────────────────────────────────────────────────────────────────────
  private applyTheme(s: AdminSiteSetting) {
    const root = document.documentElement;
    if (s.primaryColor)   root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily)     root.style.setProperty('--font', s.fontFamily);
  }
}
