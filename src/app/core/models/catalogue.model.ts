// ─── Image Type Enum ─────────────────────────────────────────────────────────
// Must match DymoEnergy.Catalogues.CatalogueImageType on the backend
export enum CatalogueImageType {
  PrimaryBackground  = 1,
  SecondaryBackground = 2,
  Banner             = 3,
  Gallery            = 4,
  Thumbnail          = 5,
  Icon               = 6,
  FeatureImage       = 7,
}

// ─── Layout Type Enum ────────────────────────────────────────────────────────
export enum CatalogueLayoutType {
  FullWidthHero   = 1,
  SplitHero       = 2,
  MinimalistHero  = 3,
  VideoHero       = 4,
  SliderHero      = 5,
}

export const CatalogueLayoutTypeLabel: Record<number, string> = {
  1: 'Full Width',
  2: 'Split Hero',
  3: 'Minimalist',
  4: 'Video',
  5: 'Slider',
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface CatalogueImage {
  id: number;
  catalogueId: number;
  imageUrl?: string;
  imageType: CatalogueImageType;
  title?: string;
  altText?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Catalogue {
  id: number;
  portalId?: number;
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
  // ── Image URLs (direct fields — present in list response) ─────────────────
  thumbnailImageUrl?: string;          // ImageType=5 equivalent
  primaryBackgroundImageUrl?: string;  // ImageType=1 equivalent
  // ── Per-catalogue theming ────────────────────────────────────────────────
  overlayColor?: string;
  overlayOpacity: number;              // 0–1 float
  primaryTextColor?: string;
  accentColor?: string;
  sectionBackgroundColor?: string;
  // ── Meta ─────────────────────────────────────────────────────────────────
  layoutType: CatalogueLayoutType;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  creationTime?: string;
  lastModificationTime?: string;
  // ── Images (only present when fetched by id/slug — NOT in list) ──────────
  images: CatalogueImage[];
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
