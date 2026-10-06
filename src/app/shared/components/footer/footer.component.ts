import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSetting } from '../../../core/models/admin-site-setting.model';
import { UserSiteSetting } from '../../../core/models/user-site-setting.model';
import { UserSiteSettingService } from '../../../core/services/user-site-setting.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  private userSite = signal<UserSiteSetting | null>(null);

  constructor(private userSettings: UserSiteSettingService) {}

  ngOnInit(): void {
    this.userSettings.getActive().subscribe(s => this.userSite.set(s));
  }

  /** Only the networks that have a link saved in Admin → User Site Settings → Social Media. */
  socials = computed(() => {
    const u = this.userSite();
    const wa = this.settings?.whatsApp?.replace(/[^\d]/g, '');
    return [
      { key: 'facebook',  label: 'Facebook',  url: u?.socialFacebookUrl },
      { key: 'youtube',   label: 'YouTube',   url: u?.socialYoutubeUrl },
      { key: 'linkedin',  label: 'LinkedIn',  url: u?.socialLinkedinUrl },
      { key: 'instagram', label: 'Instagram', url: u?.socialInstagramUrl },
      { key: 'x',         label: 'X / Twitter', url: u?.socialTwitterUrl },
      { key: 'whatsapp',  label: 'WhatsApp',  url: wa ? 'https://wa.me/' + wa : '' },
    ].filter(s => !!s.url?.trim());
  });

  @Input() settings: AdminSiteSetting | null = null;

  cols = [
    { title: 'Shop', links: [
      { label: 'Solar panels', route: '/shop' }, { label: 'Inverters', route: '/shop' },
      { label: 'Batteries', route: '/shop' }, { label: 'Home packages', route: '/shop' },
      { label: 'Accessories', route: '/shop' },
    ] },
    { title: 'Company', links: [
      { label: 'About us', route: '/about' }, { label: 'Services', route: '/quote' },
      { label: 'Solar for farmers', route: '/quote' }, { label: 'Projects', route: '/' },
      { label: 'Learn', route: '/' }, { label: 'Refer a neighbour', route: '/' },
      { label: 'Contact', route: '/quote' },
    ] },
    { title: 'Tools & support', links: [
      { label: 'Solar calculator', route: '/solar-calculator' }, { label: 'Backup planner', route: '/solar-calculator' },
      { label: 'Net metering', route: '/quote' }, { label: 'Solar loans & EMI', route: '/quote' },
      { label: 'Verify a product', route: '/shop' }, { label: 'Track order', route: '/track' },
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
