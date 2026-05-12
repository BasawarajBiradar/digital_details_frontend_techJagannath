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
}

export interface CardTap {
  id: number;
  date: string;   
  time: string;   
  deviceId: string;
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
  private base = environment.apiUrl;

  getInfoCard(): Observable<InfoCardData> {
    return this.http
      .get<ApiResponse<InfoCardData>>(`${this.base}/api/student/home-page/info-card`)
      .pipe(map(res => res.data));
  }

  getTodayEntries(): Observable<CardTap[]> {
    return this.http
      .get<ApiResponse<CardTap[]>>(
        `${this.base}/api/student/home-page/today-entries`
      )
      .pipe(map(res => res.data));
  }
}