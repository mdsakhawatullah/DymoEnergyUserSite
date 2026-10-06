import { Component, OnInit, effect, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { UserSiteSettingService } from '../../core/services/user-site-setting.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { UserSiteSetting, UserSiteSettingImage } from '../../core/models/user-site-setting.model';
import { HomeCategoryShowcase } from '../../core/models/category.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

// Line-icon paths (24×24 viewBox) shared by the static sections below
const ICON = {
  shield:  'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  sun:     'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  pin:     'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 8a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  star:    'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z',
  wrench:  'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  clip:    'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M9 12h6M9 16h4',
  card:    'M3 7h18v13H3zM3 7l3-3h12l3 3M16 13.5h2',
  calc:    'M9 7h6M9 11h6M9 15h3M7 3h10v18H7z',
  meter:   'M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5',
  verify:  'M9 3h6v3H9zM12 16a4 4 0 1 0 8 0a4 4 0 1 0-8 0M19 19l2.5 2.5M7 4.5H5V21h6',
  truck:   'M2 7h11v9H2zM13 10h4l3 3v3h-7M4.5 18.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 18.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Signals ─────────────────────────────────────────────────────────────
  settings          = signal<AdminSiteSetting | null>(null);
  userSiteSetting   = signal<UserSiteSetting | null>(null);
  showcases         = signal<HomeCategoryShowcase[]>([]);
  loading           = signal(true);
  showcasesLoading  = signal(true);
  bestSellers       = signal<Product[]>([]);
  openFaq           = signal(0);

  navItems = DEFAULT_NAV_ITEMS;

  // ── Active images for the hero (sorted by DisplayOrder) ──────────────────
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

  /** Short intro for the About page, taken from what the owner wrote in Admin → About Page. */
  aboutTeaser = computed(() => {
    let a: { eyebrow?: string; heading?: string; story?: string } = {};
    try { a = JSON.parse(this.userSiteSetting()?.aboutPageContent || '{}'); } catch { /* fall back to the defaults */ }
    const story = (a.story ?? '').split(/\r?\n/).map(p => p.trim()).find(Boolean);
    return {
      eyebrow: a.eyebrow?.trim() || 'About Dymo Energy',
      heading: a.heading?.trim() || 'Clean, reliable power for every Bangladeshi home and business.',
      text: story || 'Our own engineers design, supply and service solar systems across the country — the same team that sold it comes back to look after it.',
    };
  });

  // ── Static page content ──────────────────────────────────────────────────
  stats = [
    { v: '2,400+',  t: 'systems running',     d: ICON.shield },
    { v: '9.6 MW',  t: 'installed since 2019', d: ICON.sun },
    { v: '41',      t: 'districts covered',   d: ICON.pin },
    { v: '4.8 / 5', t: 'from 1,180 buyers',   d: ICON.star },
  ];

  whyItems = [
    { bg: '#EEF3F8', c: '#2B6CB0', d: ICON.shield, t: 'Everything is BSTI and IEC marked', s: 'Certificates sit on each product page — no grey-market panels, no re-branded seconds.' },
    { bg: '#EFF4EC', c: '#5E8B2A', d: ICON.wrench, t: 'Our own team fits it',              s: 'Not a subcontractor you have never met. The same crew comes back for service.' },
    { bg: '#FEF6E4', c: '#A98B4A', d: ICON.clip,   t: 'Warranty we actually honour',       s: '25 years on panels, 5 on inverters, 6,000 cycles on lithium — claimed through us, not the factory.' },
    { bg: '#F0EAFE', c: '#5B21B6', d: ICON.card,   t: 'Pay over 12 months',                s: 'Card EMI with most banks, or our own instalment plan after a 30% advance.' },
  ];

  steps = [
    { t: 'Tell us your bill',         s: 'Send a photo of last month’s bill, or use the calculator. We size the system from what you actually use.', when: 'Same day' },
    { t: 'Free roof survey',          s: 'Someone comes out, measures the roof, checks the shade and the meter position.',                           when: '2–3 days' },
    { t: 'Quote and net metering',    s: 'A fixed written price. If you want net metering, we file the papers with the utility.',                     when: '1 week' },
    { t: 'Installed and switched on', s: 'One or two days on site, then we show you the app and leave the warranty pack.',                            when: '2 weeks' },
  ];

  calcRows = [
    { k: 'Monthly bill',         v: '৳4,500' },
    { k: 'System that suits it', v: '3 kW hybrid' },
    { k: 'Installed price',      v: '৳3,25,000' },
    { k: 'Pays for itself in',   v: 'about 6 years' },
  ];

  tools = [
    { t: 'Solar calculator',   s: 'Size a system from your bill', route: '/solar-calculator', bg: '#EFF4EC', c: '#5E8B2A', d: ICON.calc },
    { t: 'Net metering guide', s: 'Sell what you do not use',     route: '/quote',            bg: '#EEF3F8', c: '#2B6CB0', d: ICON.meter },
    { t: 'Check a warranty',   s: 'Type a serial number',         route: '/shop',             bg: '#FEF6E4', c: '#A98B4A', d: ICON.verify },
    { t: 'Track your order',   s: 'See where the parcel is',      route: '/track',            bg: '#F0EAFE', c: '#5B21B6', d: ICON.truck },
  ];

  faqs = [
    { q: 'Will solar cover my whole house?',   a: 'Usually not all of it on day one. Most homes start with a system that covers the fans, lights and fridge, and add panels later. The calculator shows what each size covers.' },
    { q: 'What happens when the power cuts?',  a: 'Only a system with a battery keeps running. A plain on-grid system shuts off during a cut — that is a safety rule, not a fault.' },
    { q: 'Do you handle net metering papers?', a: 'Yes, for systems over 1 kW we file with the utility and follow it up. Approval usually takes three to six weeks.' },
    { q: 'How long does installation take?',   a: 'One day for a small home system, two for anything with a battery wall. We book the date when the quote is accepted.' },
    { q: 'Can I pay in instalments?',          a: 'Card EMI with most banks, or our own plan after a 30% advance. Ask before you order so we can set it up.' },
  ];

  constructor(
    private siteService:        AdminSiteSettingService,
    private userSettingService: UserSiteSettingService,
    private categoryService:    CategoryService,
    private productService:     ProductService,
  ) {
    effect(() => { this.heroSlideIndex(); this.syncHeroVideo(); });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      this.loading.set(false);
      if (s) this.applyTheme(s);
    });

    this.userSettingService.getActive().subscribe(us => this.userSiteSetting.set(us));

    this.categoryService.getHomeShowcase().subscribe(items => {
      this.showcases.set(items);
      this.showcasesLoading.set(false);
    });

    this.productService.getList({ isAvailable: true, maxResultCount: 4 })
      .subscribe(r => this.bestSellers.set(r.items));
  }

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? -1 : i);
  }

  formatPrice(price: number): string {
    if (!price) return '৳0';
    return '৳' + price.toLocaleString('en-IN');
  }

  discountPct(p: Product): number {
    return p.discountPrice ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;
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
  syncHeroVideo(): void {
    const v = this.heroVideoRef?.nativeElement;
    if (!v) return;
    if (this.heroSlideIndex() === 0) { v.muted = true; v.play().catch(() => {}); }
    else v.pause();
  }

  ngAfterViewInit(): void {
    this.syncHeroVideo();
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
