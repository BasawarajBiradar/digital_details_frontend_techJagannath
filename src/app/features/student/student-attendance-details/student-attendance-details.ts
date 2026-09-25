import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  ApiStudent,
  AttendanceStatus,
  StudentAttendanceCalendarRecord,
  StudentAttendanceOverview,
} from '../services/api-student';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

interface CalendarCell {
  date: string;
  dayNumber: number;
  status: AttendanceStatus | null;
  ariaLabel: string;
}

@Component({
  selector: 'app-student-attendance-details',
  imports: [
    DecimalPipe,
    MatIconModule,
    DashboardFooter,
  ],
  templateUrl: './student-attendance-details.html',
  styleUrl: './student-attendance-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttendanceDetailsComponent {

  private readonly apiStudent = inject(ApiStudent);
  private readonly router = inject(Router);

  readonly today = this.startOfDay(new Date());
  readonly overview = signal<StudentAttendanceOverview | null>(null);
  readonly overviewLoading = signal(true);
  readonly overviewError = signal(false);
  readonly calendarMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly calendarRecords = signal<StudentAttendanceCalendarRecord[]>([]);
  readonly calendarLoading = signal(true);
  readonly calendarError = signal(false);

  readonly calendarMonthLabel = computed(() => this.calendarMonth().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }));

  readonly calendarCells = computed<(CalendarCell | null)[]>(() => {
    const month = this.calendarMonth();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDay = month.getDay();
    const statusByDate = new Map(this.calendarRecords().map(record => [record.date, record.status]));
    const cells: (CalendarCell | null)[] = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const dateKey = this.toApiDate(date);
      const status = statusByDate.get(dateKey) ?? null;
      cells.push({
        date: dateKey,
        dayNumber: day,
        status,
        ariaLabel: status ? `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}: ${status.toLowerCase()}` : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      });
    }

    return cells;
  });

  readonly attendancePercentage = computed(() =>
    Math.max(0, Math.min(100, this.overview()?.attendancePercentage ?? 0))
  );

  constructor() {
    this.fetchCalendar();
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard']);
  }

  retryOverview(): void {
    const range = this.calendarRange();
    this.fetchOverview(range.fromDate, range.toDate);
  }

  previousMonth(): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.fetchCalendar();
  }

  nextMonth(): void {
    const month = this.calendarMonth();
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (nextMonth <= new Date(this.today.getFullYear(), this.today.getMonth(), 1)) {
      this.calendarMonth.set(nextMonth);
      this.fetchCalendar();
    }
  }

  isCurrentMonth(): boolean {
    const month = this.calendarMonth();
    return month.getFullYear() === this.today.getFullYear() && month.getMonth() === this.today.getMonth();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private fetchOverview(fromDate: string, toDate: string): void {
    this.overviewLoading.set(true);
    this.overviewError.set(false);
    this.apiStudent.getAttendancePageOverview(
      fromDate,
      toDate,
    ).pipe(
      catchError(() => {
        this.overviewError.set(true);
        return of(null);
      })
    ).subscribe(data => {
      this.overview.set(data);
      this.overviewLoading.set(false);
    });
  }

  private fetchCalendar(): void {
    const { fromDate, toDate } = this.calendarRange();
    this.calendarLoading.set(true);
    this.calendarError.set(false);
    this.fetchOverview(fromDate, toDate);
    this.apiStudent.getAttendancePageCalendar(fromDate, toDate).pipe(
      catchError(() => {
        this.calendarError.set(true);
        return of([] as StudentAttendanceCalendarRecord[]);
      })
    ).subscribe(records => {
      this.calendarRecords.set(records);
      this.calendarLoading.set(false);
    });
  }

  private calendarRange(): { fromDate: string; toDate: string } {
    const month = this.calendarMonth();
    return {
      fromDate: this.toApiDate(month),
      toDate: this.toApiDate(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
    };
  }

  private toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}