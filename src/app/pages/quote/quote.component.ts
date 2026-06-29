import { Component, OnInit, signal, computed } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent, FooterComponent, TranslatePipe],
  templateUrl: './quote.component.html',
  styleUrl: './quote.component.scss',
})
export class QuoteComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;
  submitted = signal(false);
  submitting = signal(false);

  primaryColor = computed(() => this.settings()?.primaryColor || '#2D3B60');
  accentColor  = computed(() =>
    this.settings()?.buttonColor ||
    this.settings()?.secondaryColor ||
    '#A4DF38'
  );

  form = {
    name: '',
    phone: '',
    email: '',
    interest: 'Residential solar system',
    message: '',
  };

  constructor(private siteService: AdminSiteSettingService) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s) this.applyTheme(s);
    });
  }

  sendMessage(): void {
    if (!this.form.name.trim()) return;
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
      this.form = { name: '', phone: '', email: '', interest: 'Residential solar system', message: '' };
    }, 800);
  }

  private applyTheme(s: AdminSiteSetting): void {
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
    if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
  }
}
