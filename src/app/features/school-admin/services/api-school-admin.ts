import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PieChartApiResponse } from '../../../shared/components/pie-chart/pie-chart'

export interface AttendanceRecord {
  id: number;
  studentName: string;
  classLevel: string;
  division: string;
  date: string;
  isPresent: boolean;
  roleId: number;
}

export interface AttendanceFilterPayload {
  roleId:     number | null;
  classLevel: string | null;
  division:   string | null;
  dateFrom:   string | null;   // ISO date string e.g. "2025-01-15"
  dateTo:     string | null;
  isPresent:  boolean | null;
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  code: string;
  data: AttendanceRecord[];
  errors: null | string;
  timestamp: string;
}

export interface StudentSummary {
  id: number;
  studentName: string;
  classLevel: string;
  division: string;
  registrationDate: string;
  roleId: number;
  isPresent: boolean; // ← add this
}

export interface DashboardFilterPayload {
  roleId: number | null;
  classLevel:  string | null;
  division:    string | null;
}

export interface StudentsResponse {
  success: boolean;
  message: string;
  code: string;
  data: StudentSummary[];
  errors: null | string;
  timestamp: string;
}

  export interface SchoolLogoResponse {
    success: boolean;
    message: string;
    code: string;
    data: {
      fileName: string;
      fileUrl: string;
      schoolName: string;
    };
    errors: null | string;
    timestamp: string;
  }

  export interface PieChartApiResponseActual {
    success: boolean;
    message: string;
    code: string;
    data: PieChartApiResponse;
    errors: null | string;
    timestamp: string;
  }

@Injectable({
  providedIn: 'root',
})
export class ApiSchoolAdmin {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTopStudents(filter: DashboardFilterPayload): Observable<StudentsResponse> {
    return this.http.post<StudentsResponse>(`${this.base}/api/school-admin/dashboard/students`, filter);
  }

  getSchoolLogoName(): Observable<SchoolLogoResponse> {
    return this.http.get<SchoolLogoResponse>(`${this.base}/api/school-admin/retrieve/school-logo-name`);
  }

  uploadSchoolLogo(blob: Blob, fileName: string): Observable<SchoolLogoResponse> {
    const form = new FormData();
    form.append('file', blob, fileName);
    return this.http.post<SchoolLogoResponse>(
      `${this.base}/api/school-admin/upload/school-logo`,
      form
    );
  }

  getStudentAttendancePieChartData(filters: DashboardFilterPayload): Observable<PieChartApiResponseActual> {
    return this.http.post<PieChartApiResponseActual>(
      `${this.base}/api/school-admin/retrieve/pie-chart/student-attendance`,
      filters
    );
  }

  getAttendanceDetails(filter: AttendanceFilterPayload): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(
      `${this.base}/api/school-admin/retrieve/attendance-details`,
      filter
    );
  }

}