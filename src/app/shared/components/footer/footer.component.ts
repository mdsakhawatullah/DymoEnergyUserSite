import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AdminSiteSetting } from '../../../core/models/admin-site-setting.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  @Input() settings: AdminSiteSetting | null = null;

  get brandInitial(): string {
    const name = this.settings?.siteName || 'Dymo Energy';
    return name.charAt(0).toUpperCase();
  }

  get brandWord1(): string {
    const name = this.settings?.siteName || 'Dymo Energy';
    return name.split(' ')[0];
  }

  get brandWord2(): string {
    const name = this.settings?.siteName || 'Dymo Energy';
    const parts = name.split(' ');
    return parts.slice(1).join(' ');
  }

  currentYear = new Date().getFullYear();
}
