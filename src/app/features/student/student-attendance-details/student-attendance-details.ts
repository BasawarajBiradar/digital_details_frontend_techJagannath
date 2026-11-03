import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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

export interface CalendarCell {
  date: string;
  dayNumber: number;
  status: AttendanceStatus | null;
  ariaLabel: string;
  isToday: boolean;
}

export interface FormattedDayRecord {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  formattedDate: string;
  status: AttendanceStatus | 'NOT_RECORDED';
  statusLabel: string;
  isPastOrToday: boolean;
}

export interface SelectedDayDetails {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  fullDate: string;
  monthShort: string;
  monthYear: string;
  status: AttendanceStatus | null;
  statusLabel: string;
  isToday: boolean;
  isPastOrToday: boolean;
  dayType: string;
  entryTime: string | null;
  exitTime: string | null;
  verificationNote: string;
}

export type StatusFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'HOLIDAY';

@Component({
  selector: 'app-student-attendance-details',
  imports: [
    CommonModule,
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

  // Enhanced UI Signals
  readonly activeTab = signal<'calendar' | 'records'>('calendar');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedDay = signal<CalendarCell | null>(null);

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

    const todayKey = this.toApiDate(this.today);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const dateKey = this.toApiDate(date);
      const status = statusByDate.get(dateKey) ?? null;
      const statusLabel = status ? status.toLowerCase() : 'not recorded';
      const todaySuffix = dateKey === todayKey ? ' (today)' : '';
      cells.push({
        date: dateKey,
        dayNumber: day,
        status,
        isToday: dateKey === todayKey,
        ariaLabel: `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}: ${statusLabel}${todaySuffix}`,
      });
    }

    return cells;
  });

  readonly attendancePercentage = computed(() =>
    Math.max(0, Math.min(100, this.overview()?.attendancePercentage ?? 0))
  );

  readonly attendanceHealth = computed(() => {
    const pct = this.attendancePercentage();
    if (pct >= 85) {
      return { label: 'Good Standing', color: 'success', icon: 'check_circle', desc: 'Above required 85% attendance' };
    }
    if (pct >= 75) {
      return { label: 'Satisfactory', color: 'warning', icon: 'info', desc: 'Acceptable but near threshold' };
    }
    return { label: 'Needs Attention', color: 'danger', icon: 'error_outline', desc: 'Below recommended threshold' };
  });

  readonly selectedDayDetails = computed<SelectedDayDetails | null>(() => {
    const sel = this.selectedDay();
    if (!sel) return null;

    const [y, m, d] = sel.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isPastOrToday = dateObj <= this.today;

    const calRec = this.calendarRecords().find(r => r.date === sel.date);
    const rawRec = calRec as Record<string, any> | undefined;

    let statusLabel = 'Not Recorded';
    let dayType = isWeekend ? 'Weekend Off' : 'Academic School Day';
    let verificationNote = 'No attendance recorded';

    if (sel.status === 'PRESENT') {
      statusLabel = 'Present';
      verificationNote = 'Verified NFC campus tap';
    } else if (sel.status === 'ABSENT') {
      statusLabel = 'Absent';
      verificationNote = 'Marked absent for session';
    } else if (sel.status === 'HOLIDAY') {
      statusLabel = 'Holiday / Weekend';
      dayType = isWeekend ? 'Weekend Off' : 'School Holiday';
      verificationNote = 'Scheduled academic holiday';
    } else if (isPastOrToday && !isWeekend) {
      statusLabel = 'Not Marked';
      verificationNote = 'Pending or unrecorded tap';
    }

    return {
      date: sel.date,
      dayNumber: sel.dayNumber,
      dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      fullDate: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      monthShort: dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      monthYear: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      status: sel.status,
      statusLabel,
      isToday: sel.isToday,
      isPastOrToday,
      dayType: rawRec?.['type'] ?? dayType,
      entryTime: rawRec?.['entryTime'] ?? null,
      exitTime: rawRec?.['exitTime'] ?? null,
      verificationNote,
    };
  });

  readonly monthRecords = computed<FormattedDayRecord[]>(() => {
    const month = this.calendarMonth();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const statusByDate = new Map(this.calendarRecords().map(record => [record.date, record.status]));
    const records: FormattedDayRecord[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const dateKey = this.toApiDate(date);
      const status = statusByDate.get(dateKey) ?? 'NOT_RECORDED';
      const isPastOrToday = date <= this.today;

      let statusLabel = 'Not Marked';
      if (status === 'PRESENT') statusLabel = 'Present';
      else if (status === 'ABSENT') statusLabel = 'Absent';
      else if (status === 'HOLIDAY') statusLabel = 'Holiday';

      records.push({
        date: dateKey,
        dayNumber: day,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status,
        statusLabel,
        isPastOrToday,
      });
    }

    return records;
  });

  readonly filteredRecords = computed<FormattedDayRecord[]>(() => {
    const all = this.monthRecords();
    const filter = this.statusFilter();

    if (filter === 'ALL') {
      // Show days with marked statuses or past school days
      return all.filter(r => r.status !== 'NOT_RECORDED' || r.isPastOrToday);
    }
    return all.filter(r => r.status === filter);
  });

  readonly statusCounts = computed(() => {
    const recs = this.monthRecords();
    return {
      all: recs.filter(r => r.status !== 'NOT_RECORDED' || r.isPastOrToday).length,
      present: recs.filter(r => r.status === 'PRESENT').length,
      absent: recs.filter(r => r.status === 'ABSENT').length,
      holiday: recs.filter(r => r.status === 'HOLIDAY').length,
    };
  });

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

  retry(): void {
    this.fetchCalendar();
  }

  retryCalendar(): void {
    this.retry();
  }

  previousMonth(): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.selectedDay.set(null);
    this.fetchCalendar();
  }

  nextMonth(): void {
    const month = this.calendarMonth();
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (nextMonth <= new Date(this.today.getFullYear(), this.today.getMonth(), 1)) {
      this.calendarMonth.set(nextMonth);
      this.selectedDay.set(null);
      this.fetchCalendar();
    }
  }

  jumpToCurrentMonth(): void {
    const current = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.calendarMonth.set(current);
    this.selectedDay.set(null);
    this.fetchCalendar();
  }

  isCurrentMonth(): boolean {
    const month = this.calendarMonth();
    return month.getFullYear() === this.today.getFullYear() && month.getMonth() === this.today.getMonth();
  }

  selectDay(cell: CalendarCell | null): void {
    if (!cell) return;
    if (this.selectedDay()?.date === cell.date) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set(cell);
    }
  }

  clearSelectedDay(): void {
    this.selectedDay.set(null);
  }

  selectToday(): void {
    const todayKey = this.toApiDate(this.today);
    const cell = this.calendarCells().find(c => c?.date === todayKey);
    if (cell) {
      this.selectedDay.set(cell);
    }
  }

  setActiveTab(tab: 'calendar' | 'records'): void {
    this.activeTab.set(tab);
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
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