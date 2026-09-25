import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiTeacher, TeacherAttendanceCalendarRecord, TeacherAttendanceOverview } from '../services/api-teacher';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

interface CalendarCell {
  date: string;
  dayNumber: number;
  status: string | null;
  ariaLabel: string;
}

@Component({
  selector: 'app-teacher-attendance-details',
  imports: [DatePickerComponent, DecimalPipe, MatIconModule, DashboardFooter],
  templateUrl: './teacher-attendance-details.html',
  styleUrl: './teacher-attendance-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAttendanceDetails {
  private readonly apiTeacher = inject(ApiTeacher);
  readonly today = this.startOfDay(new Date());
  readonly fromDate = signal<Date | null>(this.addDays(this.today, -7));
  readonly toDate = signal<Date | null>(this.today);
  readonly overview = signal<TeacherAttendanceOverview | null>(null);
  readonly records = signal<TeacherAttendanceCalendarRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly calendarMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  readonly percentage = computed(() => Math.max(0, Math.min(100, this.overview()?.attendancePercentage ?? 0)));
  readonly monthLabel = computed(() => this.calendarMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  readonly calendarCells = computed<(CalendarCell | null)[]>(() => {
    const month = this.calendarMonth();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (CalendarCell | null)[] = Array.from({ length: month.getDay() }, () => null);
    const statuses = new Map(this.records().map(record => [record.date, record.status]));
    for (let day = 1; day <= count; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const key = this.toApiDate(date);
      const status = statuses.get(key) ?? null;
      cells.push({
        date: key,
        dayNumber: day,
        status,
        ariaLabel: status ? `${key}: ${status.toLowerCase()}` : key,
      });
    }
    return cells;
  });

  constructor() { this.fetchAttendance(); }

  onFromDateChanged(date: Date | null): void { this.fromDate.set(date); this.fetchAttendance(); }
  onToDateChanged(date: Date | null): void { this.toDate.set(date); this.fetchAttendance(); }
  retry(): void { this.fetchAttendance(); }

  previousMonth(): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.fetchCalendar();
  }

  nextMonth(): void {
    const month = this.calendarMonth();
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= new Date(this.today.getFullYear(), this.today.getMonth(), 1)) {
      this.calendarMonth.set(next);
      this.fetchCalendar();
    }
  }

  isCurrentMonth(): boolean {
    const month = this.calendarMonth();
    return month.getFullYear() === this.today.getFullYear() && month.getMonth() === this.today.getMonth();
  }

  private fetchAttendance(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) return;
    this.loading.set(true);
    this.error.set(false);
    this.apiTeacher.getAttendanceOverview(this.toApiDate(fromDate), this.toApiDate(toDate)).pipe(
      catchError(() => { this.error.set(true); return of(null); })
    ).subscribe(data => { this.overview.set(data); this.loading.set(false); });
    this.fetchCalendar();
  }

  private fetchCalendar(): void {
    const month = this.calendarMonth();
    this.apiTeacher.getAttendanceCalendar(
      this.toApiDate(month),
      this.toApiDate(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
    ).pipe(catchError(() => of([] as TeacherAttendanceCalendarRecord[])))
      .subscribe(records => this.records.set(records));
  }

  private startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  private addDays(date: Date, days: number): Date { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
  private toApiDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
