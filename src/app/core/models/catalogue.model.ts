export interface Catalogue {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
  primaryBackgroundImageUrl?: string;
  thumbnailImageUrl?: string;
  overlayColor?: string;
  overlayOpacity: number;
  primaryTextColor?: string;
  accentColor?: string;
  sectionBackgroundColor?: string;
  layoutType: number;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  images: CatalogueImage[];
}

export interface CatalogueImage {
  id: number;
  imageUrl?: string;
  imageType: number;
  title?: string;
  altText?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
