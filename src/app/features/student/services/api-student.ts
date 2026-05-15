import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

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
  contactNumber:            string;
  emailId:                  string;
  birthDate:                string;
  address:                  string;
  uid:                      string;
}

export interface CardTap {
  id:       number;
  date:     string;
  time:     string;
  deviceId: string;
}


export interface VerifyUidResponse {
  userId: number | null;
}

export interface School {
  id:   number;
  name: string;
}

interface ApiResponse<T> {
  success:   boolean;
  message:   string;
  code:      string;
  data:      T;
  errors:    unknown | null;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ApiStudent {

  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getInfoCard(): Observable<InfoCardData> {
    return this.http
      .get<ApiResponse<InfoCardData>>(`${this.base}/api/student/home-page/info-card`)
      .pipe(map(res => res.data));
  }

  getTodayEntries(): Observable<CardTap[]> {
    return this.http
      .get<ApiResponse<CardTap[]>>(`${this.base}/api/student/home-page/today-entries`)
      .pipe(map(res => res.data));
  }

  getLandingPageData(uid: string, userId: number | null): Observable<InfoCardData> {
    return this.http
      .post<ApiResponse<InfoCardData>>(`${this.base}/api/student/uid/${uid}`, { userId })
      .pipe(map(res => res.data));
  }

  verifyUid(uid: string): Observable<VerifyUidResponse> {
    return this.http
      .get<ApiResponse<VerifyUidResponse>>(`${this.base}/api/student/uid/verify/${uid}`)
      .pipe(map(res => res.data));
  }

  generateQr(url: string): Observable<Blob> {
    return this.http.get(`${this.base}/api/student/qr-generate`, {
      params: { url },
      responseType: 'blob'
    });
  }

  getSchoolsList(): Observable<School[]> {
    return this.http
      .get<ApiResponse<School[]>>(`${this.base}/api/student/uid/school-list`)
      .pipe(map(res => res.data));
  }

  registerStudent(payload: unknown): Observable<VerifyUidResponse> {
    const uid = (payload as any).uid;
    return this.http
      .post<ApiResponse<VerifyUidResponse>>(`${this.base}/api/student/uid/register/${uid}`, payload)
      .pipe(map(res => res.data));
  }
}