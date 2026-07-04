import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatApiResponse {
  reply: string;
  error?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);
  private readonly API = 'https://localhost:44371/api/chat';

  open = signal(false);
  loading = signal(false);
  serviceUnavailable = signal(false);
  inputText = '';
  history: ChatMessage[] = [
    {
      role: 'assistant',
      content: "Hi! I'm Dymo's solar assistant. Ask me anything about solar panels, battery storage, inverters, sizing, or savings! ☀️",
    },
  ];

  private shouldScroll = false;

  toggle(): void { this.open.update(v => !v); }
  close(): void { this.open.set(false); }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading() || this.serviceUnavailable()) return;

    this.history.push({ role: 'user', content: text });
    this.inputText = '';
    this.loading.set(true);
    this.shouldScroll = true;

    this.http.post<ChatApiResponse>(this.API, { messages: this.history }).subscribe({
      next: (res) => {
        if (res.error === 'quota_exceeded' || res.error === 'unauthorized') {
          this.serviceUnavailable.set(true);
        }
        this.history.push({ role: 'assistant', content: res.reply });
        this.loading.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.history.push({ role: 'assistant', content: 'Could not connect to the server. Please check your connection and try again.' });
        this.loading.set(false);
        this.shouldScroll = true;
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messagesEl) {
      const el = this.messagesEl.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}
