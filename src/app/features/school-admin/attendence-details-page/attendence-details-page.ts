import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  ApiSchoolAdmin,
  StudentAttendanceHistoryRecord,
  AttendanceFilterPayload,
} from '../services/api-school-admin';
import {
  DataTableColumn,
  DataTableComponent,
  DataTableRow,
} from '../../../shared/components/data-table/data-table';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-attendence-details-page',
  imports: [CommonModule, MatIconModule, DataTableComponent, DatePickerComponent],
  templateUrl: './attendence-details-page.html',
  styleUrl: './attendence-details-page.scss',
})
export class AttendenceDetailsPage implements OnInit {

  records    = signal<StudentAttendanceHistoryRecord[]>([]);
  isLoading  = signal(true);
  hasError   = signal(false);

  // ── Date filters ───────────────────────────────────────────────────────────
  readonly today         = this.startOfDay(new Date());
  readonly earliestDate  = this.addYears(this.today, -2);
  readonly fromDate      = signal<Date | null>(this.earliestDate);
  readonly toDate        = signal<Date | null>(this.today);

  // Role/class/division filters kept fixed to "no filter" now that the
  // filter UI has been removed. If those toggles come back, restore the
  // signals and setters that used to drive them.
  private readonly roleId     = signal<number | null>(null);
  private readonly classLevel = signal<string | null>(null);
  private readonly division   = signal<string | null>(null);
  private readonly isPresent  = signal<boolean | null>(null);

  // ── Table setup ────────────────────────────────────────────────────────────
  readonly tableColumns: readonly DataTableColumn[] = [
    { key: 'index', header: '#', sortable: false },
    { key: 'fullName', header: 'Name' },
    { key: 'classLevel', header: 'Class', format: (value) => `Class ${value}` },
    { key: 'division', header: 'Division' },
    { key: 'date', header: 'Date', format: (value) => this.formatDate(value) },
    { key: 'status', header: 'Status' },
  ];

  readonly tableRows = computed<readonly DataTableRow[]>(() =>
    this.records().map((record, index) => ({
      ...record,
      index: index + 1,
      status: record.status,
    }))
  );

  readonly rowClassName = (row: DataTableRow): string | undefined =>
    row['status'] === 'Present'
      ? 'data-table__row--present'
      : row['status'] === 'Absent'
        ? 'data-table__row--absent'
        : undefined;

  constructor(private api: ApiSchoolAdmin, private router: Router) {}

  ngOnInit(): void {
    this.fetchData();
  }

  // ── Date filter handlers ─────────────────────────────────────────────────────

  onFromDateChanged(date: Date | null): void {
    this.fromDate.set(date);
    this.fetchData();
  }

  onToDateChanged(date: Date | null): void {
    this.toDate.set(date);
    this.fetchData();
  }

  goBack(): void {
    this.router.navigate(['/school-admin/dashboard']);
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  private buildPayload(): AttendanceFilterPayload {
    return {
      roleId: this.roleId(),
      classLevel: this.classLevel(),
      division: this.division(),
      fromDate: this.fromDate() ? this.toApiDate(this.fromDate()!) : null,
      toDate: this.toDate() ? this.toApiDate(this.toDate()!) : null,
      isPresent: this.isPresent(),
    };
  }

  private fetchData(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    this.api.getAttendanceHistory(this.buildPayload()).subscribe({
      next: (res) => {
        if (res) this.records.set(res.data);
        else this.hasError.set(true);
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
    if (typeof value !== 'string' || !value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addYears(date: Date, years: number): Date {
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }
}