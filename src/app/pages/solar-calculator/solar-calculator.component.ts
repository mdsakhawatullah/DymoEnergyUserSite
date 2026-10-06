import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSiteSettingService } from '../../core/services/admin-site-setting.service';
import { AdminSiteSetting } from '../../core/models/admin-site-setting.model';
import { NavbarComponent, DEFAULT_NAV_ITEMS } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

// ── Icons (24×24 line paths) ───────────────────────────────────────────────
const I = {
  bulb:   'M9 18h6M10 21h4M12 2a6 6 0 0 0-3.5 10.9c.5.4.8 1 .9 1.6l.1.5h5l.1-.5c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 2z',
  fan:    'M12 12a3 3 0 1 0 0 .01M12 9c0-4 1-7 4-7s1 6-4 7M15 12c4 0 7 1 7 4s-6 1-7-4M12 15c0 4-1 7-4 7s-1-6 4-7M9 12c-4 0-7-1-7-4s6-1 7 4',
  ac:     'M3 6h18v7H3zM6.5 16.5v1M12 16.5v1M17.5 16.5v1M6 10h12',
  fridge: 'M6 2h12v20H6zM6 10h12M9 6v2M9 13v2',
  cook:   'M4 10h16l-1.5 10h-13zM7 10V7a5 5 0 0 1 10 0v3M12 3V2',
  tv:     'M3 5h18v12H3zM8 21h8M12 17v4',
  wifi:   'M5 12.5a10 10 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M12 19.5h.01M2 9a15 15 0 0 1 20 0',
  pump:   'M7 20h10M9 20V9a3 3 0 0 1 6 0v11M5 12h4M15 12h4M12 3v3',
  laptop: 'M4 5h16v11H4zM2 19h20M9 19h6',
  iron:   'M3 17h18l-2-6H8a5 5 0 0 0-5 5zM8 11V8a3 3 0 0 1 3-3h4',
  geyser: 'M7 3h10v18H7zM12 7v4M10 15h4M9 7h.01',
  plug:   'M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5',
  panel:  'M4 5h16l-2 10H6zM4.8 10h14.4M12 5v10M8 15l-1 4M16 15l1 4M6 19h12',
  inv:    'M4 4h16v16H4zM8 8h8M8 12h4M15 15.5l2-3.5M17 12l-1 4 3-2',
  bat:    'M4 8h13v8H4zM17 11h3v2h-3M7 10v4M11 12h3',
  roof:   'M3 11l9-8 9 8M5 9.5V21h14V9.5',
};

type IconKey = keyof typeof I;
export type Kind = 'ongrid' | 'hybrid' | 'offgrid';
export type Batt = 'li' | 'tub';

/** [name, watts, icon, hasMotor] */
type LibItem = [string, number, IconKey, 0 | 1];

interface LibCat { key: string; label: string; icon: string; hours: [number, number]; items: LibItem[]; }

const LIBRARY: LibCat[] = [
  { key: 'lights', label: 'Lights & fittings', icon: I.bulb, hours: [5, 5], items: [
    ['LED bulb', 9, 'bulb', 0], ['LED tube light', 20, 'bulb', 0], ['Energy saving bulb', 15, 'bulb', 0], ['Ceiling light panel', 24, 'bulb', 0],
    ['Outdoor flood light', 50, 'bulb', 0], ['Street / gate light', 30, 'bulb', 0], ['Emergency light', 12, 'bulb', 0], ['Decorative lights', 40, 'bulb', 0] ] },
  { key: 'fans', label: 'Fans & cooling', icon: I.fan, hours: [8, 5], items: [
    ['Ceiling fan', 75, 'fan', 0], ['Table / stand fan', 50, 'fan', 0], ['Exhaust fan', 30, 'fan', 0], ['Air cooler', 180, 'fan', 1],
    ['Air conditioner 1 ton', 1200, 'ac', 1], ['Air conditioner 1.5 ton', 1800, 'ac', 1], ['Air conditioner 2 ton', 2400, 'ac', 1], ['Inverter AC 1.5 ton', 1100, 'ac', 1] ] },
  { key: 'kitchen', label: 'Kitchen', icon: I.cook, hours: [1, 0.5], items: [
    ['Refrigerator', 150, 'fridge', 1], ['Deep freezer', 200, 'fridge', 1], ['Rice cooker', 700, 'cook', 0], ['Microwave oven', 1200, 'cook', 0],
    ['Electric kettle', 1500, 'cook', 0], ['Blender / grinder', 400, 'cook', 1], ['Induction cooker', 2000, 'cook', 0], ['Toaster', 800, 'cook', 0] ] },
  { key: 'home', label: 'TV & home', icon: I.tv, hours: [5, 3], items: [
    ['LED TV 32"', 60, 'tv', 0], ['LED TV 43"', 100, 'tv', 0], ['Smart TV 55"', 150, 'tv', 0], ['Wi-Fi router', 12, 'wifi', 0],
    ['Set-top box', 15, 'tv', 0], ['Sound system', 60, 'tv', 0], ['Electric iron', 1000, 'iron', 0], ['Washing machine', 500, 'iron', 1] ] },
  { key: 'water', label: 'Water & heating', icon: I.pump, hours: [1, 0], items: [
    ['Water pump ½ HP', 400, 'pump', 1], ['Water pump 1 HP', 750, 'pump', 1], ['Submersible pump 1 HP', 750, 'pump', 1],
    ['Geyser / water heater', 2000, 'geyser', 0], ['Instant water heater', 3000, 'geyser', 0], ['Water filter / purifier', 40, 'geyser', 0] ] },
  { key: 'work', label: 'Office & shop', icon: I.laptop, hours: [6, 0], items: [
    ['Laptop', 65, 'laptop', 0], ['Desktop computer', 200, 'laptop', 0], ['Printer', 50, 'laptop', 0], ['CCTV camera', 15, 'laptop', 0],
    ['CCTV recorder (DVR)', 40, 'laptop', 0], ['POS machine', 60, 'laptop', 0], ['Shop shutter motor', 400, 'pump', 1], ['Display freezer', 350, 'fridge', 1] ] },
  { key: 'farm', label: 'Farm & irrigation', icon: I.pump, hours: [4, 0], items: [
    ['Irrigation pump 2 HP', 1500, 'pump', 1], ['Irrigation pump 3 HP', 2200, 'pump', 1], ['Poultry shed fan', 250, 'fan', 1],
    ['Incubator', 300, 'geyser', 0], ['Milking machine', 750, 'pump', 1], ['Chaff cutter', 1100, 'pump', 1] ] },
];

/** Typical hours that differ from their category default: [hours a day, of that at night] */
const HOURS_OVERRIDE: Record<string, [number, number]> = {
  'Refrigerator': [10, 5], 'Deep freezer': [10, 5], 'Display freezer': [10, 5],
  'Wi-Fi router': [24, 12], 'CCTV camera': [24, 12], 'CCTV recorder (DVR)': [24, 12],
  'Emergency light': [3, 3], 'Water filter / purifier': [4, 2],
};

const PAL: [string, string][] = [['#FEF6E4', '#A98B4A'], ['#EDF3F9', '#2B6CB0'], ['#ECF5EF', '#0E6B3F'], ['#F3EFFB', '#5B21B6'], ['#FDF0F3', '#C2185B']];

export interface Row {
  name: string; watts: number; qty: number; hours: number; night: number;
  icon: string; motor: boolean; note: string;
}

const PRESET: Row[] = ([
  ['LED bulb', 8, 6, 6, 'living room, bedrooms, kitchen'],
  ['Ceiling fan', 4, 10, 7, 'one in each room'],
  ['Refrigerator', 1, 10, 5, 'runs all day, compressor about 10 h'],
  ['LED TV 43"', 1, 5, 4, ''],
  ['Rice cooker', 1, 1, 0.5, ''],
  ['Water pump ½ HP', 1, 1, 0, 'fills the tank once a day'],
  ['Wi-Fi router', 1, 24, 12, 'never switched off'],
  ['Laptop', 1, 4, 2, ''],
] as [string, number, number, number, string][]).map(([name, qty, hours, night, note]) => {
  const [, item] = findItem(name)!;
  return { name, watts: item[1], qty, hours, night, icon: I[item[2]], motor: !!item[3], note };
});

function findItem(name: string): [LibCat, LibItem] | undefined {
  for (const c of LIBRARY) { const it = c.items.find(i => i[0] === name); if (it) return [c, it]; }
  return undefined;
}

const SIZES = [1000, 1500, 2000, 3000, 3600, 5000, 5500, 8000, 10200];
const BATT_SIZES = [2.4, 5, 7.5, 10, 15];

@Component({
  selector: 'app-solar-calculator',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './solar-calculator.component.html',
  styleUrl: './solar-calculator.component.scss',
})
export class SolarCalculatorComponent implements OnInit {
  private siteService = inject(AdminSiteSettingService);

  settings = signal<AdminSiteSetting | null>(null);
  navItems = DEFAULT_NAV_ITEMS;

  readonly library = LIBRARY;
  readonly palette = PAL;

  // ── State ────────────────────────────────────────────────────────────────
  cat        = signal('fans');
  search     = signal('');
  rows       = signal<Row[]>([]);
  addOpen    = signal(false);
  addError   = signal('');
  kind       = signal<Kind>('hybrid');
  batt       = signal<Batt>('li');
  backup     = signal(1);
  calculated = signal(false);

  kinds: { key: Kind; title: string; text: string; tag: string; tagColor: string }[] = [
    { key: 'ongrid',  title: 'On-grid',  text: 'Cheapest. Runs off the sun and the grid together, but shuts down in a power cut.', tag: 'No backup', tagColor: '#A15C00' },
    { key: 'hybrid',  title: 'Hybrid',   text: 'Sun, grid and battery. Keeps running through a cut and can sell the extra back.', tag: 'Most people pick this', tagColor: '#0B5A34' },
    { key: 'offgrid', title: 'Off-grid', text: 'No grid at all. Needs a bigger battery and more panels for cloudy days.', tag: 'Remote sites', tagColor: '#1D4ED8' },
  ];

  battTypes: { key: Batt; title: string; sub: string }[] = [
    { key: 'li',  title: 'Lithium (LiFePO4)', sub: '6,000 cycles · 90% usable' },
    { key: 'tub', title: 'Tubular lead-acid', sub: 'cheaper · 50% usable' },
  ];

  backupLabels = ['2 hours', 'the whole night', '2 days'];

  // ── Add-your-own form ─────────────────────────────────────────────────────
  addName = ''; addWatts = ''; addQty = '1'; addHours = '2'; addMotor = false;

  // ── Derived: what to show in step 1 ────────────────────────────────────────
  shownItems = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (q) return LIBRARY.flatMap(c => c.items.filter(i => i[0].toLowerCase().includes(q)));
    return LIBRARY.find(c => c.key === this.cat())?.items ?? [];
  });

  pickedNames = computed(() => new Set(this.rows().map(r => r.name)));

  empty = computed(() => this.rows().length === 0);
  showResult = computed(() => this.calculated() && !this.empty());

  stepsView = computed(() => {
    const e = this.empty();
    return [
      { n: 1, t: 'Pick appliances', s: 'from the list', done: true },
      { n: 2, t: 'Set the hours', s: 'change what differs', done: true },
      { n: 3, t: 'Get your system', s: 'panels, inverter, battery', done: !e },
    ];
  });

  // ── The sizing maths ──────────────────────────────────────────────────────
  calc = computed(() => {
    const rows = this.rows();
    const kind = this.kind();
    const PSH = 4.6, SYSEFF = 0.75, DIVERSITY = 0.7, INVEFF = 0.92, UNIT = 8;
    const DOD = this.batt() === 'li' ? 0.9 : 0.5;

    const dailyWh = rows.reduce((a, r) => a + r.watts * r.qty * r.hours, 0);
    const nightWh = rows.reduce((a, r) => a + r.watts * r.qty * Math.min(r.night, r.hours), 0);
    const dayWh   = dailyWh - nightWh;
    const connW   = rows.reduce((a, r) => a + r.watts * r.qty, 0);
    const surge   = rows.filter(r => r.motor).reduce((m, r) => Math.max(m, r.watts * 2), 0);

    const runW    = Math.round(connW * DIVERSITY);
    const invNeed = Math.max(runW * 1.25, runW + surge);
    const invW    = SIZES.find(x => x >= invNeed) ?? 12000;

    const arrayKw = dailyWh / 1000 / (PSH * SYSEFF) * (kind === 'offgrid' ? 1.2 : 1);
    const panels  = dailyWh > 0 ? Math.max(1, Math.ceil(arrayKw * 1000 / 550)) : 0;
    const arrayFinal = panels * 0.55;

    // Energy the battery must carry
    const backupWh = kind === 'ongrid' ? 0
      : kind === 'offgrid' ? dailyWh
      : [dailyWh * 2 / 24, nightWh, dailyWh * 2][this.backup()];
    const battKwh  = backupWh / 1000 / (DOD * INVEFF);
    const battPick = battKwh <= 0 ? 0 : (BATT_SIZES.find(x => x >= battKwh * 0.92) ?? Math.ceil(battKwh / 5) * 5);

    const roofM2  = Math.round(panels * 2.6);
    const gen     = arrayFinal * PSH * SYSEFF;
    const monthly = Math.round(Math.min(gen, dailyWh / 1000) * 30 * UNIT);
    const genPart = Math.round((panels * 17500 + invW / 1000 * 22000 + 45000) / 5000) * 5000;
    const battPart = battPick ? Math.round(battPick * 39000 / 5000) * 5000 : 0;
    const price   = genPart + battPart;
    const payback = monthly > 0 ? (genPart / (monthly * 12)).toFixed(1) : '—';

    return { PSH, SYSEFF, DIVERSITY, DOD, INVEFF, UNIT, dailyWh, nightWh, dayWh, connW, surge, runW, invW, arrayKw, panels, arrayFinal,
      battKwh, battPick, roofM2, gen, monthly, genPart, battPart, price, payback };
  });

  hogs = computed(() => {
    const total = this.calc().dailyWh || 1;
    const list = this.rows()
      .map(r => ({ t: r.name + (r.qty > 1 ? ' × ' + r.qty : ''), wh: r.watts * r.qty * r.hours }))
      .sort((a, b) => b.wh - a.wh).slice(0, 4);
    const top = list[0]?.wh || 1;
    return list.map((h, i) => ({ t: h.t, pct: Math.round(h.wh / total * 100), w: Math.round(h.wh / top * 100), color: ['#0E6B3F', '#2B6CB0', '#A98B4A', '#8FA0B2'][i] }));
  });

  liveRows = computed(() => {
    const c = this.calc();
    return [
      { k: 'If everything ran at once', v: this.fmtW(c.connW) },
      { k: 'Realistic running load', v: this.fmtW(c.runW) },
      { k: 'Biggest starting surge', v: c.surge ? this.fmtW(c.surge) + ' extra' : 'none' },
    ];
  });

  result = computed(() => {
    const c = this.calc();
    const kind = this.kind();
    const invKw = this.kw(c.invW);
    const kindName = { ongrid: 'on-grid', hybrid: 'hybrid', offgrid: 'off-grid' }[kind];
    const battType = this.batt() === 'li' ? 'LiFePO4' : 'tubular';

    const title = `${invKw} kW ${kindName} system`;
    const sub = {
      ongrid:  'Covers the daytime load from the sun and tops up from the grid. It switches off during a power cut — that is a safety rule.',
      hybrid:  'Covers everything on your list, keeps your chosen appliances running through a power cut, and sells the daytime extra back to the grid.',
      offgrid: 'Runs your whole list with no grid connection — sized with extra panels and a full day of battery for cloudy spells.',
    }[kind];

    const parts = [
      { k: 'Panels', v: `${c.panels} × 550 W`, s: `That is ${c.arrayFinal.toFixed(2)} kW on the roof, about ${c.roofM2} m² of clear space.`, bg: '#FEF6E4', c: '#A98B4A', d: I.panel, warn: '' },
      { k: 'Inverter', v: `${invKw} kW ${kindName}`, s: `Handles ${this.fmtW(c.runW)} running, with headroom for the starting surge.`, bg: '#EDF3F9', c: '#2B6CB0', d: I.inv,
        warn: c.surge > 0 ? `Your motors need ${this.fmtW(c.surge)} extra for a second when they kick in — this size covers it.` : '' },
      c.battPick
        ? { k: 'Battery', v: `${c.battPick} kWh ${battType}`, s: kind === 'offgrid' ? `A full day of your ${(c.dailyWh / 1000).toFixed(1)} kWh, so cloudy days are covered.` : `Enough for the ${(c.battKwh * c.DOD * c.INVEFF).toFixed(1)} kWh you need to ride through.`, bg: '#ECF5EF', c: '#0E6B3F', d: I.bat, warn: '' }
        : { k: 'Battery', v: 'None', s: 'On-grid systems stop in a power cut. Choose Hybrid above to add backup.', bg: '#ECF5EF', c: '#0E6B3F', d: I.bat, warn: '' },
      { k: 'Roof space', v: `${c.roofM2} m²`, s: 'Unshaded, facing south if you can. A flat roof works with frames.', bg: '#F3EFFB', c: '#5B21B6', d: I.roof, warn: '' },
    ];

    const backupText = kind === 'hybrid' ? ['2 hours of use', 'your night-time use', 'two days of use'][this.backup()] : kind === 'offgrid' ? 'a full day of use' : '';
    const maths = [
      { k: 'Your daily use', v: `${this.fmt(c.dailyWh)} Wh (${(c.dailyWh / 1000).toFixed(2)} kWh) added up from the list above` },
      { k: 'Sun hours here', v: `${c.PSH} useful hours a day, the Chattogram average across the year` },
      { k: 'Losses', v: `About ${Math.round((1 - c.SYSEFF) * 100)}% goes in heat, wiring, dust and the inverter` },
      { k: 'Panel array', v: `${(c.dailyWh / 1000).toFixed(2)} ÷ (${c.PSH} × ${c.SYSEFF})${kind === 'offgrid' ? ' × 1.2 for cloudy days' : ''} = ${c.arrayKw.toFixed(2)} kW → ${c.panels} panels of 550 W` },
      { k: 'Inverter', v: `${this.fmtW(c.connW)} connected, about ${Math.round(c.DIVERSITY * 100)}% on at once = ${this.fmtW(c.runW)}, plus surge → ${invKw} kW` },
      ...(c.battPick ? [{ k: 'Battery', v: `${backupText} ÷ (${c.DOD} usable × ${c.INVEFF} inverter) = ${c.battKwh.toFixed(1)} kWh → ${c.battPick} kWh` }] : []),
    ];

    const savings = [
      { k: 'Electricity you stop buying', v: `${(Math.min(c.gen, c.dailyWh / 1000) * 30).toFixed(0)} kWh a month`, c: '#16293F' },
      { k: `At ৳${c.UNIT} a unit, that is`, v: `৳${this.fmt(c.monthly)} a month`, c: '#0B5A34' },
      { k: 'Over a year', v: `৳${this.fmt(c.monthly * 12)}`, c: '#0B5A34' },
      { k: 'Panels and inverter cost', v: `৳${this.fmt(c.genPart)}`, c: '#16293F' },
      { k: 'So those pay for themselves in', v: `${c.payback} years`, c: '#0B5A34' },
      ...(c.battPick ? [{ k: `The ${c.battPick} kWh battery adds`, v: `৳${this.fmt(c.battPart)}`, c: '#A15C00' }] : []),
    ];

    const battTruth = c.battPick
      ? `A battery does not lower your bill — it buys you power during a cut. If you only want a cheaper bill and can live with the lights going out, drop the battery and the payback is ${c.payback} years. Lithium cells last about 10 years, so plan on replacing it once.`
      : 'Without a battery the system is the cheapest way to cut your bill, but the power goes off with the grid. Choose Hybrid if you want the fans, lights and fridge to keep running.';

    const pkgTitle = `Closest ready-made package: ${invKw} kW ${kindName} home kit`;
    const pkgSub = `${c.panels} panels, ${invKw} kW inverter${c.battPick ? `, ${c.battPick} kWh battery` : ''}, fitted — or buy the parts separately in the shop.`;

    const mail = 'mailto:?subject=' + encodeURIComponent('My solar system estimate') + '&body=' + encodeURIComponent(
      `${title}\n${c.panels} x 550 W panels (${c.arrayFinal.toFixed(2)} kW), ${invKw} kW ${kindName} inverter${c.battPick ? `, ${c.battPick} kWh ${battType} battery` : ''}\n` +
      `About ৳${this.fmt(c.price)} fitted. Saves about ৳${this.fmt(c.monthly)} a month; panels and inverter pay back in ${c.payback} years.\n` +
      `Daily use: ${(c.dailyWh / 1000).toFixed(2)} kWh from ${this.rows().length} appliances.\n\nThis is an estimate, not a quote.`);

    return { title, sub, parts, maths, savings, battTruth, pkgTitle, pkgSub, mail };
  });

  ngOnInit(): void {
    this.siteService.getActive().subscribe(s => {
      this.settings.set(s);
      if (s?.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    });
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  setCat(key: string): void { this.cat.set(key); this.search.set(''); }
  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  toggleItem(item: LibItem): void {
    const name = item[0];
    if (this.pickedNames().has(name)) { this.rows.update(rs => rs.filter(r => r.name !== name)); return; }
    const [cat] = findItem(name)!;
    const [hours, night] = HOURS_OVERRIDE[name] ?? cat.hours;
    this.rows.update(rs => [...rs, { name, watts: item[1], qty: 1, hours, night, icon: I[item[2]], motor: !!item[3], note: item[3] ? 'has a motor' : '' }]);
  }

  loadPreset(): void { this.rows.set(PRESET.map(r => ({ ...r }))); }
  clearAll(): void   { this.rows.set([]); this.calculated.set(false); }

  // ── Add your own ──────────────────────────────────────────────────────────
  openAdd(): void  { this.addOpen.set(true); this.addError.set(''); }
  closeAdd(): void { this.addOpen.set(false); }

  addOwn(): void {
    const name = this.addName.trim();
    const watts = this.num(this.addWatts), qty = this.num(this.addQty) || 1, hours = Math.min(this.num(this.addHours), 24);
    if (!name || watts <= 0) { this.addError.set('Give it a name and the watts from its label.'); return; }
    this.rows.update(rs => [...rs, {
      name, watts, qty, hours, night: Math.round(hours / 2 * 2) / 2, icon: I.plug, motor: this.addMotor,
      note: 'your own — check the night hours',
    }]);
    this.addName = ''; this.addWatts = ''; this.addQty = '1'; this.addHours = '2'; this.addMotor = false;
    this.addError.set('');
    this.addOpen.set(false);
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  setField(i: number, field: 'watts' | 'qty' | 'hours' | 'night', e: Event): void {
    const v = this.num((e.target as HTMLInputElement).value);
    this.rows.update(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, [field]: field === 'hours' || field === 'night' ? Math.min(v, 24) : v };
      if (next.night > next.hours) next.night = next.hours;
      return next;
    }));
  }

  removeRow(i: number): void {
    this.rows.update(rs => rs.filter((_, idx) => idx !== i));
    if (this.rows().length === 0) this.calculated.set(false);
  }

  rowWh(r: Row): number { return r.watts * r.qty * r.hours; }

  // ── Step 3 ────────────────────────────────────────────────────────────────
  setKind(k: Kind): void { this.kind.set(k); }
  setBatt(b: Batt): void { this.batt.set(b); }
  onBackup(e: Event): void { this.backup.set(+(e.target as HTMLInputElement).value); }

  work(): void {
    this.calculated.set(true);
    setTimeout(() => document.getElementById('sc-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  iconPath(k: IconKey): string { return I[k]; }

  // ── Formatting ────────────────────────────────────────────────────────────
  fmt(n: number): string { return Math.round(n).toLocaleString('en-IN'); }
  fmtW(n: number): string { return n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + ' kW' : n + ' W'; }
  kw(w: number): string { return (w / 1000).toFixed(w % 1000 ? 1 : 0); }
  private num(v: string | number): number { const n = Number(String(v).replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; }
}
