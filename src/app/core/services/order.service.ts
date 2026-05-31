import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderDto, OrderDto } from '../models/order.model';
import { PagedResult } from '../models/catalogue.model';
import { environment } from '../../../environments/environment';

export interface OrderFilter {
  filter?:       string;
  customerId?:   number;
  skipCount?:    number;
  maxResultCount?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {

  constructor(private http: HttpClient) {}

  create(dto: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(
      `${environment.apiUrl}/api/app/order/order-data`,
      dto
    );
  }

  getById(id: number): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${environment.apiUrl}/api/app/order/${id}`);
  }

  getList(filter: OrderFilter = {}): Observable<PagedResult<OrderDto>> {
    let params = new HttpParams();
    if (filter.filter)     params = params.set('filter',          filter.filter);
    if (filter.customerId) params = params.set('customerId',      String(filter.customerId));
    params = params.set('skipCount',      String(filter.skipCount      ?? 0));
    params = params.set('maxResultCount', String(filter.maxResultCount ?? 50));

    return this.http.get<PagedResult<OrderDto>>(
      `${environment.apiUrl}/api/app/order/data`,
      { params }
    );
  }
}
