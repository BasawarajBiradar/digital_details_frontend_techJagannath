import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  ApiSchoolAdmin,
  AttendanceRecord,
  AttendanceFilterPayload,
} from '../services/api-school-admin';

@Component({
  selector: 'app-attendence-details-page',
  imports: [CommonModule, MatIconModule, DatePipe],
  templateUrl: './attendence-details-page.html',
  styleUrl: './attendence-details-page.scss',
})
export class AttendenceDetailsPage implements OnInit {

  records    = signal<AttendanceRecord[]>([]);
  isLoading  = signal(true);
  hasError   = signal(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  selectedRoleId   = signal<number | null>(null);
  selectedClass    = signal<string | null>(null);
  selectedDivision = signal<string | null>(null);
  dateFrom         = signal<string | null>(null);
  dateTo           = signal<string | null>(null);
  selectedStatus   = signal<boolean | null>(null);

  readonly availableClasses   = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly availableDivisions = ['A', 'B', 'C', 'D', 'E'];

  constructor(private api: ApiSchoolAdmin, private router: Router) {
    // Pick up filters passed via router state from the dashboard
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as {
      roleId?: number | null;
      classLevel?: string | null;
      division?: string | null;
    } | undefined;

    if (state) {
      this.selectedRoleId.set(state.roleId   ?? null);
      this.selectedClass.set(state.classLevel ?? null);
      this.selectedDivision.set(state.division ?? null);
    }
  }

  ngOnInit(): void {
    this.fetchData();
  }

  // ── Filter setters ─────────────────────────────────────────────────────────

  setRole(roleId: number | null): void {
    this.selectedRoleId.set(roleId);
    this.selectedClass.set(null);
    this.selectedDivision.set(null);
    this.fetchData();
  }

  setClass(cls: string | null): void {
    this.selectedClass.set(cls);
    this.fetchData();
  }

  setDivision(div: string | null): void {
    this.selectedDivision.set(div);
    this.fetchData();
  }

  setDateFrom(val: string | null): void {
    this.dateFrom.set(val);
    this.fetchData();
  }

  setDateTo(val: string | null): void {
    this.dateTo.set(val);
    this.fetchData();
  }

  setStatus(val: boolean | null): void {
    this.selectedStatus.set(val);
    this.fetchData();
  }

  goBack(): void {
    this.router.navigate(['/school-admin/dashboard']);
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  private buildPayload(): AttendanceFilterPayload {
    const roleId = this.selectedRoleId();
    return {
      roleId,
      classLevel: roleId === 3 ? this.selectedClass()    : null,
      division:   roleId === 3 ? this.selectedDivision() : null,
      dateFrom:   this.dateFrom(),
      dateTo:     this.dateTo(),
      isPresent:  this.selectedStatus(),
    };
  }

  private fetchData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.api.getAttendanceDetails(this.buildPayload()).subscribe({
      next: (res) => {
        if (res.success) this.records.set(res.data);
        else this.hasError.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}