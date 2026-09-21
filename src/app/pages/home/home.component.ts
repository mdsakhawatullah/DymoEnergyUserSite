import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { UserSiteSettingService } from '../../core/services/user-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { UserSiteSetting, UserSiteSettingImage } from '../../core/models/user-site-setting.model';
import { HomeCatalogueShowcase } from '../../core/models/catalogue.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Signals ─────────────────────────────────────────────────────────────
  settings          = signal<AdminSiteSetting | null>(null);
  userSiteSetting   = signal<UserSiteSetting | null>(null);
  showcases         = signal<HomeCatalogueShowcase[]>([]);
  loading           = signal(true);
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

  // ── Hero carousel (video slide + site images) ─────────────────────────────
  heroSlideIndex = signal(0);
  heroSlideCount = computed(() => 1 + this.siteImages().length);
  heroDots       = computed(() => Array.from({ length: this.heroSlideCount() }));
  private heroAutoplayId?: ReturnType<typeof setInterval>;

  constructor(
    private siteService:        AdminSiteSettingService,
    private userSettingService: UserSiteSettingService,
    private catalogueService:   CatalogueService,
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

    this.catalogueService.getHomeShowcase().subscribe(items => {
      this.showcases.set(items);
    });
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
  //  Hero carousel
  // ─────────────────────────────────────────────────────────────────────────
  nextHeroSlide(): void {
    this.heroSlideIndex.set((this.heroSlideIndex() + 1) % this.heroSlideCount());
    this.restartHeroAutoplay();
  }

  prevHeroSlide(): void {
    const count = this.heroSlideCount();
    this.heroSlideIndex.set((this.heroSlideIndex() - 1 + count) % count);
    this.restartHeroAutoplay();
  }

  goToHeroSlide(index: number): void {
    this.heroSlideIndex.set(index);
    this.restartHeroAutoplay();
  }

  private restartHeroAutoplay(): void {
    clearInterval(this.heroAutoplayId);
    this.startHeroAutoplay();
  }

  private startHeroAutoplay(): void {
    if (this.heroSlideCount() <= 1) return;
    this.heroAutoplayId = setInterval(() => {
      this.heroSlideIndex.set((this.heroSlideIndex() + 1) % this.heroSlideCount());
    }, 5000);
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
    this.startHeroAutoplay();
  }

  ngOnDestroy(): void {
    clearInterval(this.heroAutoplayId);
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
