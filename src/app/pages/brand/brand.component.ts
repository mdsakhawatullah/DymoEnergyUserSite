import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { BrandPortfolioService } from '../../core/services/brand-portfolio.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import {
  BrandCertificate,
  BrandContent,
  BrandHeroKind,
  BrandPortfolio,
  BrandPortfolioListItem,
  BrandProjectConsentStatus,
  parseBrandContent,
} from '../../core/models/brand-portfolio.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

/** How a certificate reads on the page, from its file and expiry. */
type CertState = { label: string; tone: 'ok' | 'soon' | 'todo' };

/** Tints behind a product line's icon, cycled so a row of lines stays legible. */
const LINE_TINTS = ['#FDF0F3', '#FDF4EE', '#ECF5EF', '#EDF3F9', '#F3EFFB', '#FEF6E4'];
const LINE_INKS  = ['#D94F6A', '#B4553A', '#0E6B3F', '#2B6CB0', '#5B21B6', '#A98B4A'];

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss',
})
export class BrandComponent implements OnInit {

  readonly heroKinds = BrandHeroKind;

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;

  brand   = signal<BrandPortfolio | null>(null);
  others  = signal<BrandPortfolioListItem[]>([]);
  loading = signal(true);
  /** True once we know there is no published page at this address. */
  missing = signal(false);

  /** The narrative blocks, already stripped of blank rows by parseBrandContent. */
  content = computed<BrandContent>(() => parseBrandContent(this.brand()?.contentJson));

  // ── What the page actually shows ──────────────────────────────────────
  // Each of these drops rows the admin switched off, so a section that comes
  // back empty is left out of the template entirely rather than rendered blank.

  certificates = computed(() =>
    (this.brand()?.certificates ?? [])
      .filter(c => c.isVisible && (c.mark ?? '').trim())
      .sort((a, b) => a.displayOrder - b.displayOrder));

  downloads = computed(() =>
    (this.brand()?.downloads ?? [])
      .filter(d => d.isActive && (d.title ?? '').trim())
      .sort((a, b) => a.displayOrder - b.displayOrder));

  productLines = computed(() =>
    (this.brand()?.productLines ?? [])
      .filter(l => l.isVisible && (l.name ?? '').trim())
      .sort((a, b) => a.displayOrder - b.displayOrder));

  /** Only jobs cleared for publication — a photo and the customer's permission. */
  projects = computed(() =>
    (this.brand()?.projects ?? [])
      .filter(p => (p.title ?? '').trim() && p.consentStatus === BrandProjectConsentStatus.PhotoAndConsent)
      .sort((a, b) => a.displayOrder - b.displayOrder));

  gallery = computed(() =>
    (this.brand()?.media ?? [])
      .filter(m => m.isActive && (m.imageUrl ?? '').trim())
      .sort((a, b) => a.displayOrder - b.displayOrder));

  /** The first two photos sit beside the story. */
  storyPhotos = computed(() => this.gallery().slice(0, 2));
  /** Everything after those opens in the gallery strip. */
  restPhotos  = computed(() => this.gallery().slice(2));

  /** Total products across the lines that are tied to a category. */
  productTotal = computed(() =>
    this.productLines().reduce((sum, l) => sum + (l.productCount ?? 0), 0));

  hasCatalogue = computed(() => this.downloads().some(d => !d.dealersOnly && d.fileUrl));

  catalogueUrl = computed(() =>
    this.downloads().find(d => !d.dealersOnly && d.fileUrl)?.fileUrl ?? '');

  /** The brand strip under the nav — this brand first, then the rest. */
  brandStrip = computed(() => this.others());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private siteService: AdminSiteSettingService,
    private svc: BrandPortfolioService,
    private title: Title,
    private meta: Meta,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    this.svc.getPublished().subscribe(rows => this.others.set(rows));

    // Re-reads on every slug change so moving between brands does not need a reload.
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.load(slug);
    });
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.missing.set(false);
    this.brand.set(null);

    this.svc.getBySlug(slug).subscribe(brand => {
      this.loading.set(false);
      if (!brand) { this.missing.set(true); return; }

      this.brand.set(brand);
      this.applyMeta(brand);
      if (brand.brandColor) {
        document.documentElement.style.setProperty('--brand', brand.brandColor);
      }
    });
  }

  /** Page title, description and the picture used when the page is shared. */
  private applyMeta(b: BrandPortfolio): void {
    const name = b.name ?? 'Brand';
    this.title.setTitle(b.metaTitle?.trim() || `${name} | DymoEnergy`);

    const description = b.metaDescription?.trim() || b.shortIntro?.trim() || '';
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }
    this.meta.updateTag({ property: 'og:title', content: b.metaTitle?.trim() || name });

    // Only use the hero picture for sharing when the admin asked for it, and
    // never a video file — a share card cannot play one.
    const shareImage = b.heroUsedForSharing && b.heroKind === BrandHeroKind.Photo
      ? b.heroMediaUrl
      : b.logoUrl;
    if (shareImage) this.meta.updateTag({ property: 'og:image', content: shareImage });
  }

  // ── Display helpers ───────────────────────────────────────────────────

  /**
   * What to print beside a certificate. A mark with no file is still listed —
   * it says "To confirm" rather than pretending the paperwork is on hand.
   */
  certState(c: BrandCertificate): CertState {
    if (!c.fileUrl) return { label: 'To confirm', tone: 'todo' };
    if (c.noExpiry) return { label: 'On file', tone: 'ok' };
    if (!c.expiresOn) return { label: 'On file', tone: 'ok' };

    const when = new Date(c.expiresOn);
    const days = Math.ceil((when.getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: 'To confirm', tone: 'todo' };
    if (days <= 90) return { label: `Renews ${when.getFullYear()}`, tone: 'soon' };
    return { label: 'On file', tone: 'ok' };
  }

  /** "PDF · 12 MB" style line under a download. */
  fileLine(kind: number, size?: string): string {
    const name = ['PDF', 'ZIP', 'File'][kind] ?? 'File';
    return size?.trim() ? (size.includes(name) ? size : `${name} · ${size}`) : name;
  }

  lineTint(i: number): string { return LINE_TINTS[i % LINE_TINTS.length]; }
  lineInk(i: number): string  { return LINE_INKS[i % LINE_INKS.length]; }

  money(n?: number): string {
    return n == null ? '' : '৳' + Math.round(n).toLocaleString('en-IN');
  }

  initials(name?: string): string {
    return (name ?? '?').trim().slice(0, 6).toUpperCase();
  }

  /** Dealer-only files go through sign-in rather than being linked straight out. */
  openDownload(url?: string, dealersOnly?: boolean): void {
    if (!url) return;
    if (dealersOnly) {
      this.router.navigate(['/quote'], { queryParams: { need: 'dealer-access' } });
      return;
    }
    window.open(url, '_blank', 'noopener');
  }
}
