import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApiStudent, StudentAttendanceRecord } from '../services/api-student';
import { DataTableColumn, DataTableComponent, DataTableRow } from '../../../shared/components/data-table/data-table';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-student-attendance-details',
  imports: [DataTableComponent, DatePickerComponent, MatIconModule],
  templateUrl: './student-attendance-details.html',
  styleUrl: './student-attendance-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttendanceDetailsComponent {
  private readonly apiStudent = inject(ApiStudent);
  private readonly router = inject(Router);

  readonly today = this.startOfDay(new Date());
  readonly earliestDate = this.addYears(this.today, -2);
  readonly fromDate = signal<Date | null>(this.earliestDate);
  readonly toDate = signal<Date | null>(this.today);
  readonly records = signal<StudentAttendanceRecord[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly tableColumns: readonly DataTableColumn[] = [
    { key: 'date', header: 'Date', format: (value) => this.formatDate(value) },
    { key: 'status', header: 'Status' },
  ];

  readonly tableRows = computed<readonly DataTableRow[]>(() =>
    this.records().map((record) => ({
      ...record,
      status: record.isPresent ? 'Present' : 'Absent',
    }))
  );

  constructor() {
    this.loadAttendance();
  }

  onFromDateChanged(date: Date | null): void {
    this.fromDate.set(date);
    this.loadAttendance();
  }

  onToDateChanged(date: Date | null): void {
    this.toDate.set(date);
    this.loadAttendance();
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard']);
  }

  private loadAttendance(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) return;

    this.isLoading.set(true);
    this.hasError.set(false);
    this.apiStudent.getAttendanceDetails(this.toApiDate(fromDate), this.toApiDate(toDate)).subscribe({
      next: (records) => {
        this.records.set(records);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(value: unknown): string {
    if (typeof value !== 'string') return '-';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return parts[0].length === 4
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : `${parts[0]}/${parts[1]}/${parts[2]}`;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addYears(date: Date, years: number): Date {
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }
}
