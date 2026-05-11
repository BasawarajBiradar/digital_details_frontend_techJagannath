import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ─── API shapes ───────────────────────────────────────────────────────────────
export interface InfoCardData {
  schoolName:               string;
  schoolLogoUrl:            string | null;
  photoUrl:                 string | null;
  fullName:                 string;
  classLevel:               string;
  div:                      string;
  bloodGroup:               string;
  emergencyContactName:     string;
  emergencyContactNumber:   string;
  emergencyContactRelation: string;
  alternateContactNumber:   string;
}

interface ApiResponse<T> {
  success:   boolean;
  message:   string;
  code:      string;
  data:      T;
  errors:    unknown | null;
  timestamp: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApiStudent {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080';

  getInfoCard(): Observable<InfoCardData> {
    return this.http
      .get<ApiResponse<InfoCardData>>(`${this.base}/api/student/home-page/info-card`)
      .pipe(map(res => res.data));
  }
}