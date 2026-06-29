import { Injectable, inject } from '@angular/core';
import { I18nService, Lang } from '../i18n/i18n.service';

export type { Lang };

export interface LangOption {
  code: Lang;
  label: string;
  flag: string;
}

export const LANG_OPTIONS: LangOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private i18n = inject(I18nService);

  get currentLang() {
    return this.i18n.lang;
  }

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
  }

  get options(): LangOption[] {
    return LANG_OPTIONS;
  }
}
