import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Catalogue, HomeCatalogueShowcase, PagedResult } from '../models/catalogue.model';
import { environment } from '../../../environments/environment';

export interface CatalogueFilter {
  filter?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  portalId?: number;
  skipCount?: number;
  maxResultCount?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private http = inject(HttpClient);

  getList(filter: CatalogueFilter = {}): Observable<PagedResult<Catalogue>> {
    let params = new HttpParams();
    if (filter.filter) params = params.set('filter', filter.filter);
    if (filter.isPublished != null) params = params.set('isPublished', String(filter.isPublished));
    if (filter.isFeatured != null) params = params.set('isFeatured', String(filter.isFeatured));
    if (filter.portalId != null) params = params.set('portalId', String(filter.portalId));
    params = params.set('skipCount', String(filter.skipCount ?? 0));
    params = params.set('maxResultCount', String(filter.maxResultCount ?? 50));

    return this.http
      .get<PagedResult<Catalogue>>(`${environment.apiUrl}/api/app/catalogue/data`, { params })
      .pipe(catchError(() => of({ totalCount: 0, items: [] })));
  }

  getHomeShowcase(): Observable<HomeCatalogueShowcase[]> {
    return this.http
      .get<HomeCatalogueShowcase[]>(`${environment.apiUrl}/api/app/catalogue/home-showcase`)
      .pipe(catchError(() => of([])));
  }
}
