import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { Catalogue } from '../../core/models/catalogue.model';
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
  private siteService = inject(AdminSiteSettingService);
  private catalogueService = inject(CatalogueService);

  settings = signal<AdminSiteSetting | null>(null);
  catalogues = signal<Catalogue[]>([]);
  searchQuery = signal('');
  loading = signal(true);
  cataloguesLoading = signal(true);

  navItems = DEFAULT_NAV_ITEMS;

  reviews: Review[] = [
    {
      author: 'Sarah Mitchell',
      role: 'Procurement Manager',
      rating: 5,
      comment: 'This purchasing portal has completely streamlined our procurement process. The catalogue browsing is intuitive and the order tracking is excellent.',
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
      comment: 'Very reliable and easy to navigate. Our team quickly adopted it with minimal training. Great customer support team as well.',
      initials: 'LF',
    },
  ];

  filteredCatalogues = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.catalogues();
    return this.catalogues().filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  });

  primaryColor = computed(() => this.settings()?.primaryColor || '#1677ff');

  ngOnInit() {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      this.loading.set(false);
      if (s) this.applyTheme(s);
    });

    this.catalogueService.getList({ isPublished: true, maxResultCount: 50 }).subscribe(result => {
      this.catalogues.set(result.items);
      this.cataloguesLoading.set(false);
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getThumbnail(catalogue: Catalogue): string | null {
    if (catalogue.thumbnailImageUrl) return catalogue.thumbnailImageUrl;
    if (catalogue.primaryBackgroundImageUrl) return catalogue.primaryBackgroundImageUrl;
    const active = catalogue.images?.find(i => i.isActive && i.imageUrl);
    return active?.imageUrl ?? null;
  }

  private applyTheme(s: AdminSiteSetting) {
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
    if (s.fontFamily) root.style.setProperty('--font', s.fontFamily);
  }
}
