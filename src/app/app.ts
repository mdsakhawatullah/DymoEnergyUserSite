import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserSiteSettingService } from './core/services/user-site-setting.service';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent],
  template: `<router-outlet /><app-chatbot />`,
})
export class App implements OnInit {

  constructor(private userSettingService: UserSiteSettingService) {}

  ngOnInit(): void {
    this.userSettingService.getActive().subscribe(us => {
      if (us?.fontFamily) {
        console.log('Applying site font:', us.fontFamily);
        this.applyFont(us.fontFamily);
      }
    });
  }

  /**
   * 1. Injects a Google Fonts <link> for the primary font name.
   * 2. Sets --font CSS variable so every component inherits it.
   *
   * fontFamily value examples stored in DB:
   *   "Inter"
   *   "'Roboto', sans-serif"
   *   "Poppins, sans-serif"
   */
  private applyFont(fontFamily: string): void {
    // Extract the first font name, strip quotes/spaces
    const primaryFont = fontFamily
      .split(',')[0]
      .trim()
      .replace(/['"]/g, '')
      .trim();

    // Hellix is bundled locally — skip Google Fonts, just reset to the default stack
    if (primaryFont.toLowerCase().startsWith('hellix')) {
      document.documentElement.style.setProperty(
        '--font',
        "'Hellix', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      );
      return;
    }

    // For any other font name, inject (or update) a Google Fonts <link>
    const linkId = 'site-google-font';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id  = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const encoded = primaryFont.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700;800&display=swap`;

    document.documentElement.style.setProperty('--font', `'${primaryFont}', sans-serif`);
  }
}
