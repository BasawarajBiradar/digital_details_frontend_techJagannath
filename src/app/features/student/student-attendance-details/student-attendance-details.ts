import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApiStudent, StudentAttendanceHistoryRecord } from '../services/api-student';
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
  readonly showFilters = input(false);
  private readonly router = inject(Router);

  readonly today = this.startOfDay(new Date());
  readonly earliestDate = this.addYears(this.today, -2);
  readonly fromDate = signal<Date | null>(this.earliestDate);
  readonly toDate = signal<Date | null>(this.today);
  readonly records = signal<StudentAttendanceHistoryRecord[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly tableColumns: readonly DataTableColumn[] = [
    { key: 'date', header: 'Date', format: (value) => this.formatDate(value) },
    { key: 'status', header: 'Status', format: (value) => this.formatStatus(value) },
    { key: 'entryTime', header: 'Entry Time', format: (value) => this.formatTime(value) },
    { key: 'exitTime', header: 'Exit Time', format: (value) => this.formatTime(value) },
  ];

  readonly tableRows = computed<readonly DataTableRow[]>(() =>
    this.records().map((record) => ({ ...record }))
  );

  readonly rowClassName = (row: DataTableRow): string | undefined => {
    const status = typeof row['status'] === 'string' ? row['status'].toUpperCase() : '';
    switch (status) {
      case 'PRESENT': return 'data-table__row--present';
      case 'ABSENT':  return 'data-table__row--absent';
      case 'HOLIDAY': return 'data-table__row--holiday';
      default:        return undefined;
    }
  };

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
    this.apiStudent.getAttendanceHistory(this.toApiDate(fromDate), this.toApiDate(toDate)).subscribe({
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

  private formatStatus(value: unknown): string {
    if (typeof value !== 'string' || !value) return '-';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private formatTime(value: unknown): string {
    if (typeof value !== 'string' || !value) return '-';
    return value;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addYears(date: Date, years: number): Date {
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }
}