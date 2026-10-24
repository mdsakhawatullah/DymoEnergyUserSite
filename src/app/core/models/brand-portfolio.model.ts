// Must match DymoEnergy.BrandPortfolios on the backend.
// The admin editor's own copy lives in DymoEnergy/angular/src/app/proxy/brand-portfolios/models.ts.

// ─── Enums ───────────────────────────────────────────────────────────────────
export enum BrandHeroKind {
  Photo = 0,
  Video = 1,
}

export enum BrandDownloadKind {
  Pdf = 0,
  Zip = 1,
  Other = 2,
}

export enum BrandProjectConsentStatus {
  PhotoAndConsent = 0,
  WaitingOnConsent = 1,
  NoPhoto = 2,
}

// ─── Child rows ──────────────────────────────────────────────────────────────
export interface BrandCertificate {
  id: number;
  brandPortfolioId: number;
  mark?: string;
  covers?: string;
  certificateNumber?: string;
  noExpiry: boolean;
  expiresOn?: string;
  fileUrl?: string;
  fileSize?: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface BrandDownload {
  id: number;
  brandPortfolioId: number;
  title?: string;
  kind: BrandDownloadKind;
  fileUrl?: string;
  fileSize?: string;
  dealersOnly: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface BrandProductLine {
  id: number;
  brandPortfolioId: number;
  name?: string;
  blurb?: string;
  categoryId?: number;
  iconKey?: string;
  isVisible: boolean;
  displayOrder: number;
  /** Worked out by the server from the linked category. */
  productCount: number;
  /** Cheapest live product in the linked category. */
  fromPrice?: number;
}

export interface BrandProject {
  id: number;
  brandPortfolioId: number;
  projectId?: number;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  consentStatus: BrandProjectConsentStatus;
  displayOrder: number;
}

export interface BrandMedia {
  id: number;
  brandPortfolioId: number;
  imageUrl?: string;
  caption?: string;
  altText?: string;
  isActive: boolean;
  displayOrder: number;
}

// ─── The page ────────────────────────────────────────────────────────────────
export interface BrandPortfolio {
  id: number;
  creationTime?: string;
  lastModificationTime?: string;
  portalId?: number;

  name?: string;
  slug?: string;
  tagline?: string;
  logoUrl?: string;
  shortIntro?: string;
  distributorSince?: string;
  brandColor?: string;

  storyHeadline?: string;

  heroKind: BrandHeroKind;
  heroMediaUrl?: string;
  heroCaption?: string;
  heroAutoplayMuted: boolean;
  heroUsedForSharing: boolean;

  ctaHeadline?: string;
  ctaSubline?: string;

  metaTitle?: string;
  metaDescription?: string;

  /** The narrative blocks, as one JSON string — parse with parseBrandContent(). */
  contentJson?: string;

  isPublished: boolean;
  isActive: boolean;
  displayOrder: number;

  certificates: BrandCertificate[];
  downloads: BrandDownload[];
  productLines: BrandProductLine[];
  projects: BrandProject[];
  media: BrandMedia[];
}

/** Row shape of the brands index. */
export interface BrandPortfolioListItem {
  id: number;
  name?: string;
  slug?: string;
  tagline?: string;
  logoUrl?: string;
  brandColor?: string;
  isPublished: boolean;
  isActive: boolean;
  displayOrder: number;
  certificateCount: number;
  productLineCount: number;
  completenessPercent: number;
}

// ─── The narrative blocks kept inside contentJson ────────────────────────────
export interface BrandQuickStat { iconKey: string; value: string; label: string; }
export interface BrandFact { key: string; value: string; }
export interface BrandParagraph { text: string; }
export interface BrandReason { title: string; text: string; }
export interface BrandWarrantyTerm { category: string; term: string; }
export interface BrandWarrantyNote { text: string; }

export interface BrandContent {
  quickStats: BrandQuickStat[];
  facts: BrandFact[];
  paragraphs: BrandParagraph[];
  reasons: BrandReason[];
  warrantyTerms: BrandWarrantyTerm[];
  warrantyNotes: BrandWarrantyNote[];
}

const EMPTY_CONTENT: BrandContent = {
  quickStats: [], facts: [], paragraphs: [], reasons: [], warrantyTerms: [], warrantyNotes: [],
};

/**
 * Reads the contentJson the admin saved. The admin already drops blank rows, so
 * whatever survives here is meant to be shown; a malformed string yields nothing
 * rather than breaking the page.
 */
export function parseBrandContent(json?: string | null): BrandContent {
  if (!json) return { ...EMPTY_CONTENT };

  let raw: any;
  try { raw = JSON.parse(json); } catch { return { ...EMPTY_CONTENT }; }
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CONTENT };

  const rows = <T,>(v: any, keep: (r: any) => boolean): T[] =>
    Array.isArray(v) ? v.filter(r => r && keep(r)) : [];

  const has = (s: any) => typeof s === 'string' && s.trim().length > 0;

  return {
    quickStats:    rows(raw.quickStats,    r => has(r.value)),
    facts:         rows(raw.facts,         r => has(r.value)),
    paragraphs:    rows(raw.paragraphs,    r => has(r.text)),
    reasons:       rows(raw.reasons,       r => has(r.title)),
    warrantyTerms: rows(raw.warrantyTerms, r => has(r.term)),
    warrantyNotes: rows(raw.warrantyNotes, r => has(r.text)),
  };
}
