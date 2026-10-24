import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { BrandPortfolio, BrandPortfolioListItem } from '../models/brand-portfolio.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BrandPortfolioService {
  private http = inject(HttpClient);

  /**
   * One brand page by its web address. The server only serves pages that are
   * published and active, and answers 404 otherwise — a draft, a retired brand
   * and a typo all look the same from here, which is deliberate.
   * Returns null when there is nothing to show.
   */
  getBySlug(slug: string): Observable<BrandPortfolio | null> {
    const params = new HttpParams().set('slug', slug);
    return this.http
      .get<BrandPortfolio>(`${environment.apiUrl}/api/app/brand-portfolio/by-slug`, { params })
      .pipe(catchError(() => of(null)));
  }

  /** The brands index — published pages only, in the order the admin set. */
  getPublished(): Observable<BrandPortfolioListItem[]> {
    return this.http
      .get<{ items: BrandPortfolioListItem[] }>(`${environment.apiUrl}/api/app/brand-portfolio/published`)
      .pipe(
        map(r => r?.items ?? []),
        catchError(() => of([])),
      );
  }
}
