import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { UserSiteSettingService } from '../../core/services/user-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

/** Shape of UserSiteSetting.aboutPageContent (edited in Admin → User Site Settings → About Page). */
export interface AboutContent {
  eyebrow?: string; heading?: string; story?: string; heroImageUrl?: string; heroCaption?: string;
  stats?:  { value: string; label: string }[];
  valuesEyebrow?: string; valuesHeading?: string;
  values?: { title: string; text: string }[];
  teamEyebrow?: string; teamHeading?: string;
  team?:   { name: string; role?: string; photoUrl?: string }[];
  certsHeading?: string;
  certs?:  { name: string; logoUrl?: string }[];
  showroomTitle?: string; showroomText?: string;
}

const DEFAULTS: Required<Pick<AboutContent, 'eyebrow' | 'heading' | 'story' | 'valuesEyebrow' | 'valuesHeading' | 'teamEyebrow' | 'teamHeading' | 'certsHeading' | 'showroomTitle' | 'showroomText'>> & { values: { title: string; text: string }[] } = {
  eyebrow: 'About Dymo Energy',
  heading: 'Clean, reliable power for every Bangladeshi home and business.',
  story: 'We started with a simple frustration: load-shedding and rising bills, while the sun shines most of the year. Today our engineers design, supply and service solar systems across the country.',
  valuesEyebrow: 'What we believe',
  valuesHeading: 'How we work',
  values: [
    { title: 'Honest sizing', text: 'We recommend the system you need — not the biggest one we can sell.' },
    { title: 'Genuine equipment', text: 'Every product is traceable by serial number and backed locally.' },
    { title: 'Safe installation', text: 'Proper earthing, breakers and cable sizing on every job.' },
    { title: 'Here for 25 years', text: 'Service and warranty for as long as your panels run.' },
  ],
  teamEyebrow: 'Our team',
  teamHeading: 'The people behind your system',
  certsHeading: 'Certifications & partners',
  showroomTitle: 'Visit our showroom',
  showroomText: 'See panels, inverters and batteries in person.',
};

const TEAM_BG = ['#E6F4EC', '#FFF6DB', '#EEF3F8', '#F0EAFE'];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {

  settings = signal<AdminSiteSetting | null>(null);
  saved    = signal<AboutContent>({});
  loaded   = signal(false);
  navItems = DEFAULT_NAV_ITEMS;

  c = computed(() => {
    const s = this.saved();
    const pick = (v: string | undefined, d: string) => (v?.trim() ? v : d);
    return {
      eyebrow: pick(s.eyebrow, DEFAULTS.eyebrow),
      heading: pick(s.heading, DEFAULTS.heading),
      paragraphs: pick(s.story, DEFAULTS.story).split(/\r?\n\s*\r?\n|\r?\n/).map(p => p.trim()).filter(Boolean),
      heroImageUrl: s.heroImageUrl?.trim() || '',
      heroCaption: s.heroCaption?.trim() || '',
      stats: (s.stats ?? []).filter(x => x.value?.trim()),
      valuesEyebrow: pick(s.valuesEyebrow, DEFAULTS.valuesEyebrow),
      valuesHeading: pick(s.valuesHeading, DEFAULTS.valuesHeading),
      values: (s.values?.length ? s.values : DEFAULTS.values).filter(v => v.title?.trim()),
      teamEyebrow: pick(s.teamEyebrow, DEFAULTS.teamEyebrow),
      teamHeading: pick(s.teamHeading, DEFAULTS.teamHeading),
      team: (s.team ?? []).filter(m => m.name?.trim()),
      certsHeading: pick(s.certsHeading, DEFAULTS.certsHeading),
      certs: (s.certs ?? []).filter(x => x.name?.trim()),
      showroomTitle: pick(s.showroomTitle, DEFAULTS.showroomTitle),
      showroomText: pick(s.showroomText, DEFAULTS.showroomText),
    };
  });

  /** Opens the showroom in Google Maps when an address is set in site settings. */
  mapsUrl = computed(() => {
    const s = this.settings();
    const q = [s?.address, s?.city, s?.zipCode].filter(Boolean).join(', ');
    return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : '';
  });

  constructor(
    private siteService: AdminSiteSettingService,
    private userSettingService: UserSiteSettingService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });

    // Never leave the page invisible if the server is slow — show the starting copy after a moment
    setTimeout(() => this.loaded.set(true), 1500);

    this.userSettingService.getActive().subscribe(us => {
      try { this.saved.set(us?.aboutPageContent ? JSON.parse(us.aboutPageContent) : {}); }
      catch { this.saved.set({}); }
      this.loaded.set(true);
    });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  teamBg(i: number): string { return TEAM_BG[i % TEAM_BG.length]; }
}
