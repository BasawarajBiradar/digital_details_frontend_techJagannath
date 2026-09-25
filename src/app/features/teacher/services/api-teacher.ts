import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface TeacherInfoCard {
  schoolName: string;
  schoolLogoUrl: string | null;
  photoUrl: string | null;
  fullName: string;
  department: string | null;
  designation: string | null;
  employeeId: string | null;
  emailId: string;
  contactNumber: string;
  bloodGroup?: string | null;
  birthDate?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;
  emergencyContactRelation?: string | null;
  alternateContactNumber?: string | null;
}

export interface TeacherUpdateCards {
  attendanceStatus: string | null;
  entryTime: string | null;
  tapPhotoCount: number | null;
  noticeCount: number | null;
  pendingTaskCount: number | null;
}

export interface TeacherAttendanceOverview {
  attendancePercentage: number;
  presentDays: number;
  absentDays: number;
  lateDays: number | null;
}

export interface TeacherAttendanceCalendarRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | string | null;
}

export interface TeacherTapPhotoRecord {
  date: string;
  time: string;
  photoUrl: string | null;
}

export interface TeacherSchool {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: string;
  data: T;
  errors: unknown | null;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ApiTeacher {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // Replace endpoint paths here when the teacher API contract is provided.
  getInfoCard(): Observable<TeacherInfoCard> {
    return this.http
      .get<ApiResponse<TeacherInfoCard>>(`${this.base}/api/teacher/home-page/info-card`)
      .pipe(map(response => response.data));
  }

  getTodayUpdates(): Observable<TeacherUpdateCards> {
    return this.http
      .get<ApiResponse<TeacherUpdateCards>>(`${this.base}/api/teacher/home-page/today-updates`)
      .pipe(map(response => response.data));
  }

  uploadPhoto(form: FormData): Observable<{ saveSuccessful: boolean }> {
    return this.http
      .post<ApiResponse<{ saveSuccessful: boolean }>>(
        `${this.base}/api/teacher/upload/profile-photo`,
        form,
      )
      .pipe(map(response => response.data));
  }

  getAttendanceOverview(fromDate: string, toDate: string): Observable<TeacherAttendanceOverview> {
    return this.http
      .post<ApiResponse<TeacherAttendanceOverview>>(
        `${this.base}/api/teacher/attendance-page/overview`,
        { fromDate, toDate },
      )
      .pipe(map(response => response.data));
  }

  getAttendanceCalendar(fromDate: string, toDate: string): Observable<TeacherAttendanceCalendarRecord[]> {
    return this.http
      .post<ApiResponse<TeacherAttendanceCalendarRecord[]>>(
        `${this.base}/api/teacher/attendance-page/calendar-view`,
        { fromDate, toDate },
      )
      .pipe(map(response => response.data));
  }

  getTapPhotos(fromDate: string, toDate: string): Observable<TeacherTapPhotoRecord[]> {
    return this.http
      .post<ApiResponse<TeacherTapPhotoRecord[]>>(
        `${this.base}/api/teacher/tap-photo-page/overview`,
        { fromDate, toDate },
      )
      .pipe(map(response => response.data));
  }

  verifyUid(uid: string): Observable<{ userId: number | null }> {
    return this.http
      .get<ApiResponse<{ userId: number | null }>>(`${this.base}/api/teacher/uid/verify/${uid}`)
      .pipe(map(response => response.data));
  }

  getLandingPageData(uid: string, userId: number | null): Observable<TeacherInfoCard> {
    return this.http
      .post<ApiResponse<TeacherInfoCard>>(`${this.base}/api/teacher/uid/${uid}`, { userId })
      .pipe(map(response => response.data));
  }

  getSchoolsList(): Observable<TeacherSchool[]> {
    return this.http
      .get<ApiResponse<TeacherSchool[]>>(`${this.base}/api/student/uid/school-list`)
      .pipe(map(response => response.data));
  }

  registerTeacher(uid: string, payload: unknown): Observable<{ userId: number | null }> {
    return this.http
      .post<ApiResponse<{ userId: number | null }>>(`${this.base}/api/teacher/uid/register/${uid}`, payload)
      .pipe(map(response => response.data));
  }
}
