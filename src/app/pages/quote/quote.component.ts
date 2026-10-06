import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { QuoteRequestService } from '../../core/services/quote-request.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './quote.component.html',
  styleUrl: './quote.component.scss',
})
export class QuoteComponent implements OnInit {

  settings   = signal<AdminSiteSetting | null>(null);
  navItems   = DEFAULT_NAV_ITEMS;
  submitted  = signal(false);
  submitting = signal(false);
  sendError  = signal(false);
  tried      = signal(false);

  interests = [
    'Home solar system',
    'Shop or factory rooftop',
    'Farm / irrigation pump',
    'Battery backup (IPS)',
    'Net metering & paperwork',
    'Something else',
  ];

  steps = [
    { t: 'We call you', s: 'Within one working day, to understand what you run and what you want to save.' },
    { t: 'Free site survey', s: 'An engineer checks your roof, shade and wiring. No charge, no obligation.' },
    { t: 'A fixed written price', s: 'Panels, inverter, battery and fitting on one quote — the price you see is the price you pay.' },
  ];

  form = { name: '', phone: '', email: '', interest: this.interests[0], message: '' };

  get nameOk():  boolean { return !!this.form.name.trim(); }
  get phoneOk(): boolean { return /^[+\d][\d\s-]{6,}$/.test(this.form.phone.trim()); }
  get emailOk(): boolean { return !this.form.email.trim() || /^\S+@\S+\.\S+$/.test(this.form.email.trim()); }
  get valid():   boolean { return this.nameOk && this.phoneOk && this.emailOk; }

  constructor(
    private siteService: AdminSiteSettingService,
    private quoteRequestService: QuoteRequestService,
  ) {}

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });
  }

  get address(): string {
    const s = this.settings();
    return [s?.address, s?.city, s?.zipCode].filter(Boolean).join(', ');
  }

  sendMessage(): void {
    this.tried.set(true);
    if (!this.valid) {
      document.querySelector('.field--err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.submitting.set(true);
    this.sendError.set(false);

    this.quoteRequestService.create({
      name:     this.form.name.trim(),
      phone:    this.form.phone.trim(),
      email:    this.form.email.trim()   || undefined,
      interest: this.form.interest,
      message:  this.form.message.trim() || undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.tried.set(false);
        this.form = { name: '', phone: '', email: '', interest: this.interests[0], message: '' };
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.submitting.set(false);
        this.sendError.set(true);
      },
    });
  }

  focusForm(): void {
    document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('q-name')?.focus(), 400);
  }
}
