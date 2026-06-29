import { Injectable, signal, computed } from '@angular/core';
import { en } from './translations/en';
import { bn } from './translations/bn';
import { zh } from './translations/zh';

export type Lang = 'en' | 'bn' | 'zh';

const TRANSLATIONS = { en, bn, zh };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'dymo_lang';

  lang = signal<Lang>(this.getSavedLang());
  translations = computed(() => TRANSLATIONS[this.lang()]);

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }

  t(key: string): string {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = this.translations();
    for (const part of parts) {
      obj = obj?.[part];
    }
    return typeof obj === 'string' ? obj : key;
  }

  private getSavedLang(): Lang {
    const s = localStorage.getItem(this.STORAGE_KEY) as Lang;
    return s && ['en', 'bn', 'zh'].includes(s) ? s : 'en';
  }
}
