import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  ApiSchoolAdmin,
  StudentAttendanceHistoryRecord,
  AttendanceFilterPayload,
} from '../services/api-school-admin';

@Component({
  selector: 'app-attendence-details-page',
  imports: [CommonModule, MatIconModule],
  templateUrl: './attendence-details-page.html',
  styleUrl: './attendence-details-page.scss',
})
export class AttendenceDetailsPage implements OnInit {

  records    = signal<StudentAttendanceHistoryRecord[]>([]);
  isLoading  = signal(true);
  hasError   = signal(false);

  // ── Month filter ──────────────────────────────────────────────────────────
  readonly today         = this.startOfDay(new Date());
  readonly earliestDate  = this.addYears(this.today, -2);
  readonly earliestMonth = this.toMonthInputValue(this.earliestDate);
  readonly latestMonth   = this.toMonthInputValue(
    this.today.getDate() === 1
      ? new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1)
      : this.today
  );
  readonly selectedMonth = signal(this.latestMonth);
  readonly fromDate      = signal<Date | null>(this.getMonthRange(this.latestMonth)!.fromDate);
  readonly toDate        = signal<Date | null>(this.getMonthRange(this.latestMonth)!.toDate);

  readonly roleId = signal<number | null>(null);
  readonly classLevel = signal<string | null>(null);
  readonly division = signal<string | null>(null);
  private readonly isPresent  = signal<boolean | null>(null);
  readonly availableClasses = Array.from({ length: 12 }, (_, index) => String(index + 1));
  readonly availableDivisions = ['A', 'B', 'C', 'D', 'E'];

  readonly attendanceDates = computed(() => {
    const dates = new Set(
      this.records().flatMap((record) =>
        (record.childResult ?? []).map((dayResult) => dayResult.date)
      )
    );

    return [...dates].sort((left, right) =>
      (this.parseAttendanceDate(left)?.getTime() ?? 0) -
      (this.parseAttendanceDate(right)?.getTime() ?? 0)
    );
  });

  readonly tableRows = computed(() => {
    const dates = this.attendanceDates();
    return this.records().map((record) => {
      const resultsByDate = new Map(
        (record.childResult ?? []).map((dayResult) => [
          dayResult.date,
          this.formatStatus(dayResult.status),
        ])
      );

      return {
        fullName: record.fullName,
        classLevel: record.classLevel,
        division: record.division,
        attendance: dates.map((date) => ({
          date,
          status: resultsByDate.get(date) ?? '',
        })),
      };
    });
  });

  constructor(private api: ApiSchoolAdmin, private router: Router) {}

  ngOnInit(): void {
    this.fetchData();
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onMonthChanged(value: string): void {
    if (value < this.earliestMonth || value > this.latestMonth) return;
    const range = this.getMonthRange(value);
    if (!range) return;

    this.selectedMonth.set(value);
    this.fromDate.set(range.fromDate);
    this.toDate.set(range.toDate);
    this.fetchData();
  }

  onRoleChanged(value: string): void {
    const roleId = value === '' ? null : Number(value);
    this.roleId.set(roleId);
    this.fetchData();
  }

  onClassChanged(value: string): void {
    this.classLevel.set(value || null);
    this.fetchData();
  }

  onDivisionChanged(value: string): void {
    this.division.set(value || null);
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

  formatDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '-';
    const d = this.parseAttendanceDate(value);
    if (!d) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  private parseAttendanceDate(value: string): Date | null {
    const dayFirstDate = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (dayFirstDate) {
      const day = Number(dayFirstDate[1]);
      const month = Number(dayFirstDate[2]);
      const year = Number(dayFirstDate[3]);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        ? date
        : null;
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  formatStatus(status: string): string {
    const normalized = status.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private toMonthInputValue(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  private getMonthRange(value: string): { fromDate: Date; toDate: Date } | null {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;

    const fromDate = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const yesterday = new Date(this.today);
    yesterday.setDate(yesterday.getDate() - 1);
    const toDate = monthEnd > this.today ? yesterday : monthEnd;

    return fromDate <= toDate ? { fromDate, toDate } : null;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addYears(date: Date, years: number): Date {
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }
}