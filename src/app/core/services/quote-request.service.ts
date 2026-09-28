import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateQuoteRequest {
  name: string;
  phone?: string;
  email?: string;
  interest?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class QuoteRequestService {
  private http = inject(HttpClient);

  create(request: CreateQuoteRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/app/quote-request`, request);
  }
}
