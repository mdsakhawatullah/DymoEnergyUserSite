export enum ProductStatus {
  Draft        = 1,
  Active       = 2,
  Inactive     = 3,
  OutOfStock   = 4,
  Discontinued = 5,
}

export interface Product {
  id:            number;
  catalogueId:   number;
  portalId?:     number;
  name?:         string;
  slug?:         string;
  summary?:      string;       // short description shown on cards
  description?:  string;
  sku?:          string;
  price:         number;       // regular price  (was unitPrice)
  discountPrice?: number;      // optional sale price
  weight?:       string;
  vendorId?:     number;
  vendorCode?:   string;
  vendorName?:   string;
  bundle:        boolean;
  bundleCode?:   string;
  status:        ProductStatus;
  isActive:      boolean;
  isFeatured:    boolean;
  displayOrder:  number;
  stockQuantity: number;       // was supplierStock
  primaryImage?: string;       // was imageUrl
  ribbonText?:   string;
  metaTitle?:    string;
  metaDescription?: string;
  metaKeywords?: string;
}
