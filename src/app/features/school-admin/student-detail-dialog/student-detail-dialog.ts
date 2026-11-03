import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiSchoolAdmin, StudentDetail } from '../services/api-school-admin';

@Component({
  selector: 'app-student-detail-dialog',
  imports: [CommonModule, MatIconModule],
  templateUrl: './student-detail-dialog.html',
  styleUrl: './student-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<StudentDetailDialog>);
  private readonly dialogData = inject<{ studentId: number }>(MAT_DIALOG_DATA);
  private readonly apiSchoolAdmin = inject(ApiSchoolAdmin);

  readonly student = signal<StudentDetail | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.fetchStudentDetail();
  }

  fetchStudentDetail(): void {
    const id = this.dialogData.studentId;
    this.isLoading.set(true);
    this.hasError.set(false);

    this.apiSchoolAdmin.getStudentDetail(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.student.set(res.data);
        } else {
          this.hasError.set(true);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
