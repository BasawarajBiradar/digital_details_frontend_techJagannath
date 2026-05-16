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

@Injectable({
  providedIn: 'root',
})
export class ApiSchoolAdmin {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTopStudents(size: number | null = 10): Observable<StudentsResponse> {
    return this.http.post<StudentsResponse>(`${this.base}/api/school-admin/dashboard/students`, { size });
  }
}