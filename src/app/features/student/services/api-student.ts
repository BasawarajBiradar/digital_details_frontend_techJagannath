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
  id?:       number;
  date:     string;
  time:     string;
  deviceId: string;
  imageUrl: string | null;
}

export interface StudentAttendanceRecord {
  id: number;
  date: string;
  isPresent: boolean;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HOLIDAY' | string;

export interface StudentAttendanceHistoryRecord {
  date:      string;
  status:    AttendanceStatus;
  entryTime: string | null;
  exitTime:  string | null;
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

export interface TodaysUpdateCards {
  attendanceStatus: string | null;
  entryTime: string | null;
  tapPhotoCount: number | null;
  pendingHomeWorkCount: number | null;
  noticeCount: number | null;
  teacherFeedBack: string | null;
  weeklyPerformanceGrade: string | null;
  percentage: number | null;
}

export interface StudentAttendanceOverview {
  attendancePercentage: number;
  presentDays: number;
  absentDays: number;
  lateDays: number | null;
}

export interface StudentAttendanceCalendarRecord {
  date: string;
  status: AttendanceStatus | null;
}

export interface StudentTapPhotoRecord {
  date: string;
  time: string;
  photoUrl: string | null;
}

export interface StudentHomeworkOverview {
  pendingHomework: number | null;
  completedHomework: number | null;
}

export interface StudentHomeworkRecord {
  homeworkId: number;
  homeworkTitle: string;
  dateOfAssignment: string;
  deadlineDate: string;
  status: string | null;
  subjectName: string;
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
      .pipe(
        map(res => res.data.map(tap => ({
          ...tap,
          date: this.parseDdMmYyyy(tap.date)  
        })))
      );
  }

  getAttendanceDetails(dateFrom: string, dateTo: string): Observable<StudentAttendanceRecord[]> {
    return this.http
      .post<ApiResponse<StudentAttendanceRecord[]>>(`${this.base}/api/student/attendance-details`, {
        dateFrom,
        dateTo,
      })
      .pipe(map(res => res.data));
  }

  getAttendanceHistory(fromDate: string, toDate: string): Observable<StudentAttendanceHistoryRecord[]> {
    return this.http
      .post<ApiResponse<StudentAttendanceHistoryRecord[]>>(`${this.base}/api/student/attendance-history`, {
        fromDate,
        toDate,
      })
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

  uploadPhoto(form: FormData): Observable<{ saveSuccessful: boolean }> {
    return this.http
      .post<ApiResponse<{ saveSuccessful: boolean }>>(
        `${this.base}/api/student/upload/profile-photo`,
        form
      )
      .pipe(map(res => res.data));
  }

  private parseDdMmYyyy(dateStr: string): string {
    const [dd, mm, yyyy] = dateStr.split('-');
    return `${yyyy}-${mm}-${dd}`;             
  }

  getTodaysUpdateCards(): Observable<TodaysUpdateCards> {
    return this.http
      .get<ApiResponse<TodaysUpdateCards>>(`${this.base}/api/student/home-page/today-updates`)
      .pipe(map(res => res.data));
  }

  getAttendancePageOverview(
    fromDate: string,
    toDate: string,
  ): Observable<StudentAttendanceOverview> {
    return this.http
      .post<ApiResponse<StudentAttendanceOverview>>(
        `${this.base}/api/student/attendance-page/overview`,
        { fromDate, toDate },
      )
      .pipe(map(res => res.data));
  }

  getAttendancePageCalendar(
    fromDate: string,
    toDate: string,
  ): Observable<StudentAttendanceCalendarRecord[]> {
    return this.http
      .post<ApiResponse<StudentAttendanceCalendarRecord[]>>(
        `${this.base}/api/student/attendance-page/calendar-view`,
        { fromDate, toDate },
      )
      .pipe(map(res => res.data));
  }

  getTapPhotoOverview(
    fromDate: string,
    toDate: string,
  ): Observable<StudentTapPhotoRecord[]> {
    return this.http
      .post<ApiResponse<StudentTapPhotoRecord[]>>(
        `${this.base}/api/student/tap-photo-page/overview`,
        { fromDate, toDate },
      )
      .pipe(map(res => res.data));
  }

  getHomeworkOverview(): Observable<StudentHomeworkOverview> {
    return this.http
      .get<ApiResponse<StudentHomeworkOverview>>(
        `${this.base}/api/student/homework-page/overview`,
      )
      .pipe(map(res => res.data));
  }

  getHomeworkTable(): Observable<StudentHomeworkRecord[]> {
    return this.http
      .get<ApiResponse<StudentHomeworkRecord[]>>(
        `${this.base}/api/student/homework-page/table`,
      )
      .pipe(map(res => res.data));
  }
}