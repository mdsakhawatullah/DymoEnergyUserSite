import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { BrandPortfolioService } from '../../core/services/brand-portfolio.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { BrandPortfolioListItem } from '../../core/models/brand-portfolio.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss',
})
export class BrandsComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;

  brands  = signal<BrandPortfolioListItem[]>([]);
  loading = signal(true);

  constructor(
    private siteService: AdminSiteSettingService,
    private svc: BrandPortfolioService,
    private title: Title,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Brands we carry | DymoEnergy');

    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    this.svc.getPublished().subscribe(rows => {
      this.brands.set(rows);
      this.loading.set(false);
    });
  }

  initials(name?: string): string {
    return (name ?? '?').trim().slice(0, 6).toUpperCase();
  }
}
