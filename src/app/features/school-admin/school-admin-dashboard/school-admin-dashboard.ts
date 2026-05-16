import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiSchoolAdmin, StudentSummary } from '../services/api-school-admin';
import { StudentDetailDialog } from '../student-detail-dialog/student-detail-dialog';

@Component({
  selector: 'app-school-admin-dashboard',
  imports: [CommonModule, MatIconModule, MatDialogModule, DatePipe],
  templateUrl: './school-admin-dashboard.html',
  styleUrl: './school-admin-dashboard.scss',
})
export class SchoolAdminDashboard implements OnInit {
  students = signal<StudentSummary[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  constructor(private api: ApiSchoolAdmin, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.api.getTopStudents(10).subscribe({
      next: (res) => {
        if (res.success) {
          this.students.set(res.data);
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