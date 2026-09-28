import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Category, HomeCategoryShowcase, PagedResult } from '../models/category.model';
import { environment } from '../../../environments/environment';

export interface CategoryFilter {
  filter?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  portalId?: number;
  skipCount?: number;
  maxResultCount?: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getList(filter: CategoryFilter = {}): Observable<PagedResult<Category>> {
    let params = new HttpParams();
    if (filter.filter) params = params.set('filter', filter.filter);
    if (filter.isPublished != null) params = params.set('isPublished', String(filter.isPublished));
    if (filter.isFeatured != null) params = params.set('isFeatured', String(filter.isFeatured));
    if (filter.portalId != null) params = params.set('portalId', String(filter.portalId));
    params = params.set('skipCount', String(filter.skipCount ?? 0));
    params = params.set('maxResultCount', String(filter.maxResultCount ?? 50));

    return this.http
      .get<PagedResult<Category>>(`${environment.apiUrl}/api/app/category/data`, { params })
      .pipe(catchError(() => of({ totalCount: 0, items: [] })));
  }

  getHomeShowcase(): Observable<HomeCategoryShowcase[]> {
    return this.http
      .get<HomeCategoryShowcase[]>(`${environment.apiUrl}/api/app/category/home-showcase`)
      .pipe(catchError(() => of([])));
  }
}
