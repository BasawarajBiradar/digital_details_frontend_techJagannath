import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface School {
  id: number;
  name: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  code: string;
  data: T;
  errors: null | string;
  timestamp: string;
}

export interface AddSchoolPayload {
  schoolName: string;
  schoolContact: string;
  schoolEmailId: string;
  addressLineOne: string;
  addressLineTwo: string | null;
  city: string;
  pinCode: string;
  state: string;
  country: string;
}

export interface AddSchoolAdminPayload {
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobileNo: string;
  emailId: string;
  password: string;
  schoolId: number;
}

@Injectable({ providedIn: 'root' })
export class ApiTapaxeAdmin {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  addSchool(payload: AddSchoolPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.base}/api/tapaxe-admin/add/school`, payload);
  }

  addSchoolAdmin(payload: AddSchoolAdminPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.base}/api/tapaxe-admin/add/school-admin`, payload);
  }

  getSchools(): Observable<ApiResponse<School[]>> {
    return this.http.get<ApiResponse<School[]>>(`${this.base}/api/student/uid/school-list`);
  }
}