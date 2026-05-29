import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSetting } from '../../../core/models/admin-site-setting.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  @Input() settings: AdminSiteSetting | null = null;

  get fullAddress(): string {
    const s = this.settings;
    if (!s) return '';
    return [s.address, s.city, s.state, s.zipCode, s.country]
      .filter(Boolean)
      .join(', ');
  }

  currentYear = new Date().getFullYear();
}
