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

  cols = [
    { title: 'Shop', links: [
      { label: 'Solar panels', route: '/shop' }, { label: 'Inverters', route: '/shop' },
      { label: 'Batteries', route: '/shop' }, { label: 'Home packages', route: '/shop' },
      { label: 'Accessories', route: '/shop' },
    ] },
    { title: 'Company', links: [
      { label: 'About us', route: '/' }, { label: 'Services', route: '/quote' },
      { label: 'Solar for farmers', route: '/quote' }, { label: 'Projects', route: '/' },
      { label: 'Learn', route: '/' }, { label: 'Refer a neighbour', route: '/' },
      { label: 'Contact', route: '/quote' },
    ] },
    { title: 'Tools & support', links: [
      { label: 'Solar calculator', route: '/solar-calculator' }, { label: 'Backup planner', route: '/solar-calculator' },
      { label: 'Net metering', route: '/quote' }, { label: 'Solar loans & EMI', route: '/quote' },
      { label: 'Verify a product', route: '/shop' }, { label: 'Track order', route: '/cart' },
      { label: 'FAQ & warranty', route: '/quote' },
    ] },
  ];

  payments = ['bKash', 'Nagad', 'VISA', 'Mastercard', 'Cash on delivery'];

  get address(): string {
    const s = this.settings;
    return [s?.address, s?.city, s?.zipCode].filter(Boolean).join(', ');
  }

  get brandWord1(): string {
    const name = this.settings?.siteName || 'DymoEnergy';
    const idx = name.search(/(?<=.)[A-Z]/);
    return idx > 0 ? name.slice(0, idx) : name.split(' ')[0];
  }

  get brandWord2(): string {
    const name = this.settings?.siteName || 'DymoEnergy';
    const idx = name.search(/(?<=.)[A-Z]/);
    return idx > 0 ? name.slice(idx) : name.split(' ').slice(1).join(' ');
  }

  currentYear = new Date().getFullYear();
}
