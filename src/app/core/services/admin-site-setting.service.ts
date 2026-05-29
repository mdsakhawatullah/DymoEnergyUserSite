import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AdminSiteSetting } from '../models/admin-site-setting.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminSiteSettingService {
  private http = inject(HttpClient);

  getActive(): Observable<AdminSiteSetting | null> {
    return this.http
      .get<AdminSiteSetting>(`${environment.apiUrl}/api/app/admin-site-setting/active`)
      .pipe(catchError(() => of(null)));
  }
}
