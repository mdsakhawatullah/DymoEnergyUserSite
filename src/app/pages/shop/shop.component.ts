import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Catalogue } from '../../core/models/catalogue.model';
import { Product } from '../../core/models/product.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  catalogues = signal<Catalogue[]>([]);
  allProducts = signal<Product[]>([]);
  loading    = signal(true);

  selectedCatalogueId = signal<number | null>(null);

  navItems = DEFAULT_NAV_ITEMS;

  filteredProducts = computed<Product[]>(() => {
    const id = this.selectedCatalogueId();
    if (id === null) return this.allProducts();
    return this.allProducts().filter(p => p.catalogueId === id);
  });

  selectedCatalogueName = computed<string>(() => {
    const id = this.selectedCatalogueId();
    if (id === null) return 'All Products';
    return this.catalogues().find(c => c.id === id)?.name ?? 'All Products';
  });

  constructor(
    private siteService:      AdminSiteSettingService,
    private catalogueService: CatalogueService,
    private productService:   ProductService,
    public  cartService:      CartService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    this.catalogueService.getList({ isPublished: true, maxResultCount: 100 }).subscribe(res => {
      this.catalogues.set(res.items);
    });

    this.productService.getList({ isAvailable: true, maxResultCount: 200 }).subscribe(res => {
      this.allProducts.set(res.items);
      this.loading.set(false);
    });
  }

  selectCatalogue(id: number | null): void {
    this.selectedCatalogueId.set(id);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product, 1);
  }

  catalogueName(catalogueId: number): string {
    return this.catalogues().find(c => c.id === catalogueId)?.name ?? '';
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }
}
