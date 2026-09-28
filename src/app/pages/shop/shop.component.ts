import { Component, OnInit, signal, computed } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, TranslatePipe],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  categories = signal<Category[]>([]);
  allProducts = signal<Product[]>([]);
  loading    = signal(true);

  selectedCategoryId = signal<number | null>(null);

  navItems = DEFAULT_NAV_ITEMS;

  filteredProducts = computed<Product[]>(() => {
    const id = this.selectedCategoryId();
    if (id === null) return this.allProducts();
    return this.allProducts().filter(p => p.categoryId === id);
  });

  selectedCategoryName = computed<string>(() => {
    const id = this.selectedCategoryId();
    if (id === null) return 'All Products';
    return this.categories().find(c => c.id === id)?.name ?? 'All Products';
  });

  constructor(
    private siteService:      AdminSiteSettingService,
    private categoryService: CategoryService,
    private productService:   ProductService,
    public  cartService:      CartService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    this.categoryService.getList({ isPublished: true, maxResultCount: 100 }).subscribe(res => {
      this.categories.set(res.items);
    });

    this.productService.getList({ isAvailable: true, maxResultCount: 200 }).subscribe(res => {
      this.allProducts.set(res.items);
      this.loading.set(false);
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product, 1);
  }

  categoryName(categoryId: number): string {
    return this.categories().find(c => c.id === categoryId)?.name ?? '';
  }

  formatPrice(value: number): string {
    return '৳' + (value || 0).toLocaleString('en-IN');
  }
}
