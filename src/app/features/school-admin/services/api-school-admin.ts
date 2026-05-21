import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface StudentSummary {
  id: number;
  studentName: string;
  classLevel: string;
  division: string;
  registrationDate: string;
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

@Injectable({
  providedIn: 'root',
})
export class ApiSchoolAdmin {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTopStudents(size: number | null): Observable<StudentsResponse> {
    return this.http.post<StudentsResponse>(`${this.base}/api/school-admin/dashboard/students`, { size });
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

}