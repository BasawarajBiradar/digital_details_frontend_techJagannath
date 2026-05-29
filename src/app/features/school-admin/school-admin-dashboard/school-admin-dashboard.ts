import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiSchoolAdmin, StudentSummary } from '../services/api-school-admin';
import { StudentDetailDialog } from '../student-detail-dialog/student-detail-dialog';
import { ImageCropModal, CropResult } from '../../../shared/components/image-crop-modal/image-crop-modal';
import { PieChart, PieChartApiResponse } from '../../../shared/components/pie-chart/pie-chart';
import { Router } from '@angular/router';



@Component({
  selector: 'app-school-admin-dashboard',
  imports: [CommonModule, MatIconModule, MatDialogModule, DatePipe, ImageCropModal, PieChart],
  templateUrl: './school-admin-dashboard.html',
  styleUrl: './school-admin-dashboard.scss',
})
export class SchoolAdminDashboard implements OnInit {
  students       = signal<StudentSummary[]>([]);
  isLoading      = signal(true);
  hasError       = signal(false);
  schoolName     = signal<string>('');
  schoolLogoUrl  = signal<string>('');
  attendanceData = signal<PieChartApiResponse | null>(null);

  // Logo upload state
  pendingLogoFile = signal<File | null>(null);
  isUploadingLogo = signal(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  selectedRoleId   = signal<number | null>(null);
  selectedClass    = signal<string | null>(null);
  selectedDivision = signal<string | null>(null);

  // ── Static filter options ───────────────────────────────────────────────────
  readonly availableClasses  = Array.from({ length: 12 }, (_, i) => i + 1);   // [1..12]
  readonly availableDivisions = ['A', 'B', 'C', 'D', 'E'];

  constructor(private api: ApiSchoolAdmin, private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    this.api.getSchoolLogoName().subscribe({
      next: (res) => {
        if (res.success) {
          this.schoolName.set(res.data.schoolName);
          this.schoolLogoUrl.set(res.data.fileUrl);
        }
      },
      error: () => {},
    });

    this.fetchTableData();
    this.fetchChartData();
  }

  // ── Filter actions ───────────────────────────────────────────────────────────

  setRole(roleId: number | null): void {
    this.selectedRoleId.set(roleId);
    // Clear sub-filters when role changes; they're only relevant for students
    this.selectedClass.set(null);
    this.selectedDivision.set(null);
    this.fetchTableData();
    this.fetchChartData();
  }

  setClass(cls: string | null): void {
    this.selectedClass.set(cls);
    this.fetchTableData();
    this.fetchChartData();
  }

  setDivision(div: string | null): void {
    this.selectedDivision.set(div);
    this.fetchTableData();
    this.fetchChartData();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private buildFilterPayload() {
    const roleId   = this.selectedRoleId();
    const classVal = roleId === 3 ? this.selectedClass()    : null;
    const divVal   = roleId === 3 ? this.selectedDivision() : null;

    return {
      roleId,
      classLevel: classVal,
      division:   divVal,
    };
  }

  goToAttendanceDetails(): void {
  this.router.navigate(['/school-admin/attendance-details']);
}

  private fetchTableData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.api.getTopStudents(this.buildFilterPayload()).subscribe({
      next: (res) => {
        if (res.success) this.students.set(res.data);
        else this.hasError.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private fetchChartData(): void {
    this.api.getStudentAttendancePieChartData(this.buildFilterPayload()).subscribe({
      next: (res) => this.attendanceData.set(res.data),
      error: () => {},
    });
  }

  // ── Logo upload ──────────────────────────────────────────────────────────────

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = '';
    if (file) this.pendingLogoFile.set(file);
  }

  onLogoCropped(result: CropResult): void {
    this.pendingLogoFile.set(null);
    this.isUploadingLogo.set(true);

    this.api.uploadSchoolLogo(result.blob, 'school-logo.jpg').subscribe({
      next: (res) => {
        if (res.success) {
          this.schoolLogoUrl.set(res.data.fileUrl);
          this.schoolName.set(res.data.schoolName);
          window.location.reload();
        }
        this.isUploadingLogo.set(false);
      },
      error: () => {
        this.isUploadingLogo.set(false);
      },
    });
  }

  onLogoCropCancelled(): void {
    this.pendingLogoFile.set(null);
  }

  // ── Student detail ───────────────────────────────────────────────────────────

  openStudentDetail(studentId: number): void {
    this.dialog.open(StudentDetailDialog, {
      data: { studentId },
      width: '480px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'student-detail-dialog-panel',
    });
  }
}