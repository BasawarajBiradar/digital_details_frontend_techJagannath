import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(payload: { emailId: string; password: string }): Observable<{ data: { token: string, role: string } }> {
    return this.http.post<{ data: { token: string, role: string } }>(
      `${this.baseUrl}/auth/login`,
      payload
    );
  }

}