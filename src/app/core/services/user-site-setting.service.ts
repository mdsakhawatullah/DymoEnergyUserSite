import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { UserSiteSetting } from '../models/user-site-setting.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserSiteSettingService {
  private http = inject(HttpClient);

  getActive(): Observable<UserSiteSetting | null> {
    return this.http
      .get<UserSiteSetting>(`${environment.apiUrl}/api/app/user-site-setting/active`)
      .pipe(catchError(() => of(null)));
  }
}
