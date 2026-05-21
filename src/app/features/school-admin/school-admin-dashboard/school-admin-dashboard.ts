import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiSchoolAdmin, StudentSummary } from '../services/api-school-admin';
import { StudentDetailDialog } from '../student-detail-dialog/student-detail-dialog';
import { ImageCropModal, CropResult } from '../../../shared/components/image-crop-modal/image-crop-modal';

@Component({
  selector: 'app-school-admin-dashboard',
  imports: [CommonModule, MatIconModule, MatDialogModule, DatePipe, ImageCropModal],
  templateUrl: './school-admin-dashboard.html',
  styleUrl: './school-admin-dashboard.scss',
})
export class SchoolAdminDashboard implements OnInit {
  students      = signal<StudentSummary[]>([]);
  isLoading     = signal(true);
  hasError      = signal(false);
  schoolName    = signal<string>('');
  schoolLogoUrl = signal<string>('');

  // Logo upload state
  pendingLogoFile  = signal<File | null>(null);
  isUploadingLogo  = signal(false);

  constructor(private api: ApiSchoolAdmin, private dialog: MatDialog) {}

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

    this.api.getTopStudents(null).subscribe({
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

  // ── Logo upload ─────────────────────────────────────────────────────────────

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = ''; // reset so same file can be re-selected
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

  // ── Student detail ──────────────────────────────────────────────────────────

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