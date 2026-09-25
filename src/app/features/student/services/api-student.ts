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

  /***
   api : http://localhost:8080/api/student/attendance-page/calendar-view
   request body : {
    "fromDate": "2026-08-01", // start of month
    "toDate": "2026-08-31" // end of the month
    }
    response
    {
    "success": true,
    "message": "Success",
    "code": "SUCCESS",
    "data": [
        {
            "date": "2026-08-01",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-02",
            "status": "HOLIDAY"
        },
        {
            "date": "2026-08-03",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-04",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-05",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-06",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-07",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-08",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-09",
            "status": "HOLIDAY"
        },
        {
            "date": "2026-08-10",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-11",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-12",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-13",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-14",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-15",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-16",
            "status": null
        },
        {
            "date": "2026-08-17",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-18",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-19",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-20",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-21",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-22",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-23",
            "status": "HOLIDAY"
        },
        {
            "date": "2026-08-24",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-25",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-26",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-27",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-28",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-29",
            "status": "ABSENT"
        },
        {
            "date": "2026-08-30",
            "status": null
        },
        {
            "date": "2026-08-31",
            "status": null
        }
    ],
    "errors": null,
    "timestamp": "2026-09-25T09:51:44.089624"
}

   */
}