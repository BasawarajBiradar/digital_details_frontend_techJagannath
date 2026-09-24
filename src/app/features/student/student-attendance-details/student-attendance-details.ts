import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiStudent, StudentAttendanceOverview } from '../services/api-student';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-student-attendance-details',
  imports: [
    DatePickerComponent,
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
  readonly fromDate = signal<Date | null>(this.addDays(this.today, -7));
  readonly toDate = signal<Date | null>(this.today);
  readonly overview = signal<StudentAttendanceOverview | null>(null);
  readonly overviewLoading = signal(true);
  readonly overviewError = signal(false);

  readonly attendancePercentage = computed(() =>
    Math.max(0, Math.min(100, this.overview()?.attendancePercentage ?? 0))
  );

  constructor() {
    this.fetchOverview();
  }

  onFromDateChanged(date: Date | null): void {
    this.fromDate.set(date);
    this.fetchOverview();
  }

  onToDateChanged(date: Date | null): void {
    this.toDate.set(date);
    this.fetchOverview();
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard']);
  }

  retryOverview(): void {
    this.fetchOverview();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private fetchOverview(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) return;

    this.overviewLoading.set(true);
    this.overviewError.set(false);
    this.apiStudent.getAttendancePageOverview(
      this.toApiDate(fromDate),
      this.toApiDate(toDate),
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

  private toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}