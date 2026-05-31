import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { PagedResult } from '../models/catalogue.model';
import { environment } from '../../../environments/environment';

export interface ProductFilter {
  catalogueId?: number;
  filter?: string;
  isAvailable?: boolean;
  skipCount?: number;
  maxResultCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getList(filter: ProductFilter = {}): Observable<PagedResult<Product>> {
    let params = new HttpParams();
    if (filter.catalogueId != null) params = params.set('catalogueId', String(filter.catalogueId));
    if (filter.filter)              params = params.set('filter', filter.filter);
    if (filter.isAvailable != null) params = params.set('isAvailable', String(filter.isAvailable));
    params = params.set('skipCount',        String(filter.skipCount       ?? 0));
    params = params.set('maxResultCount',   String(filter.maxResultCount  ?? 50));

    return this.http
      .get<PagedResult<Product>>(`${environment.apiUrl}/api/app/product/data`, { params })
      .pipe(catchError(() => of({ totalCount: 0, items: [] })));
  }
}
