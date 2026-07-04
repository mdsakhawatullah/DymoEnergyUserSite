import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface LoadRow {
  appliance: string;
  watts: number;
  hours: number;
  qty: number;
}

export type CalcTab = 'load' | 'battery' | 'inverter' | 'ac' | 'roof';

@Component({
  selector: 'app-solar-calculator',
  standalone: true,
  imports: [FormsModule, TranslatePipe, NavbarComponent, FooterComponent],
  templateUrl: './solar-calculator.component.html',
  styleUrl: './solar-calculator.component.scss',
})
export class SolarCalculatorComponent {
  private siteService = inject(AdminSiteSettingService);

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;
  activeTab = signal<CalcTab>('load');

  // ── Load Calculator ────────────────────────────────────────────────────
  loadRows = signal<LoadRow[]>([
    { appliance: '', watts: 0, hours: 0, qty: 1 },
  ]);
  loadResult = signal<{ totalKwh: number; panelKw: number; batteryKwh: number } | null>(null);

  // ── Battery Calculator ─────────────────────────────────────────────────
  battDailyLoad = 1000;
  battBackupHours = 4;
  battDod = 80;
  battVoltage = 48;
  battEfficiency = 90;
  battResult = signal<{ capacityKwh: number; ampHours: number } | null>(null);

  // ── Inverter Calculator ────────────────────────────────────────────────
  invTotalWatts = 1000;
  invSurgeFactor = 1.25;
  invEfficiency = 90;
  invResult = signal<{ kva: number; kw: number } | null>(null);

  // ── AC Calculator ──────────────────────────────────────────────────────
  acCapacity = 1.5;
  acPanelWatt = 550;
  acSunHours = 5;
  acResult = signal<{ panels: number; totalKw: number } | null>(null);

  // ── Roof Calculator ────────────────────────────────────────────────────
  roofLength = 40;
  roofWidth = 30;
  roofUsablePct = 75;
  roofPanelLength = 6.56;
  roofPanelWidth = 3.28;
  roofResult = signal<{ usableArea: number; panels: number } | null>(null);

  constructor() {
    this.siteService.getActive().subscribe(s => this.settings.set(s));
  }

  setTab(tab: CalcTab): void {
    this.activeTab.set(tab);
  }

  // ── Load ────────────────────────────────────────────────────────────────
  addLoadRow(): void {
    this.loadRows.update(rows => [...rows, { appliance: '', watts: 0, hours: 0, qty: 1 }]);
  }

  removeLoadRow(index: number): void {
    this.loadRows.update(rows => rows.filter((_, i) => i !== index));
  }

  updateLoadRow(index: number, field: keyof LoadRow, value: string | number): void {
    this.loadRows.update(rows =>
      rows.map((r, i) => i === index ? { ...r, [field]: field === 'appliance' ? value : Number(value) } : r)
    );
  }

  calculateLoad(): void {
    const rows = this.loadRows();
    const totalWh = rows.reduce((s, r) => s + (r.watts * r.hours * r.qty), 0);
    const totalKwh = totalWh / 1000;
    const panelKw = +(totalKwh / 4).toFixed(2);       // assume 4 peak sun hours
    const batteryKwh = +(totalKwh * 1.2).toFixed(2);  // 20% buffer
    this.loadResult.set({ totalKwh: +totalKwh.toFixed(2), panelKw, batteryKwh });
  }

  resetLoad(): void {
    this.loadRows.set([{ appliance: '', watts: 0, hours: 0, qty: 1 }]);
    this.loadResult.set(null);
  }

  // ── Battery ─────────────────────────────────────────────────────────────
  calculateBattery(): void {
    const energyNeeded = (this.battDailyLoad * this.battBackupHours) / 24;
    const capacityWh = (energyNeeded / (this.battDod / 100)) / (this.battEfficiency / 100);
    const capacityKwh = +(capacityWh / 1000).toFixed(2);
    const ampHours = +(capacityWh / this.battVoltage).toFixed(1);
    this.battResult.set({ capacityKwh, ampHours });
  }

  resetBattery(): void { this.battResult.set(null); }

  // ── Inverter ────────────────────────────────────────────────────────────
  calculateInverter(): void {
    const apparent = (this.invTotalWatts * this.invSurgeFactor) / (this.invEfficiency / 100);
    const kva = +(apparent / 1000).toFixed(2);
    const kw = +(this.invTotalWatts * this.invSurgeFactor / 1000).toFixed(2);
    this.invResult.set({ kva, kw });
  }

  resetInverter(): void { this.invResult.set(null); }

  // ── AC ──────────────────────────────────────────────────────────────────
  calculateAc(): void {
    const acWatts = this.acCapacity * 1200; // ~1200W per ton
    const energyPerDay = acWatts / 1000;    // kWh
    const panels = Math.ceil((energyPerDay / this.acSunHours) / (this.acPanelWatt / 1000));
    const totalKw = +((panels * this.acPanelWatt) / 1000).toFixed(2);
    this.acResult.set({ panels, totalKw });
  }

  resetAc(): void { this.acResult.set(null); }

  // ── Roof ────────────────────────────────────────────────────────────────
  calculateRoof(): void {
    const totalArea = this.roofLength * this.roofWidth;
    const usableArea = +(totalArea * (this.roofUsablePct / 100)).toFixed(1);
    const panelArea = this.roofPanelLength * this.roofPanelWidth;
    const panels = Math.floor(usableArea / panelArea);
    this.roofResult.set({ usableArea, panels });
  }

  resetRoof(): void { this.roofResult.set(null); }
}
