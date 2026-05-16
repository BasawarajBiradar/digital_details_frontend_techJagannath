import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

export interface StudentDetail {
  photoUrl: string | null;
  fullName: string;
  classLevel: string;
  div: string;
  bloodGroup: string;
  contactNumber: string;
  emailId: string;
  birthDate: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  alternateContactNumber: string;
}

interface StudentDetailResponse {
  success: boolean;
  data: StudentDetail;
}

@Component({
  selector: 'app-student-detail-dialog',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './student-detail-dialog.html',
  styleUrl: './student-detail-dialog.scss',
})
export class StudentDetailDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<StudentDetailDialog>);
  private dialogData = inject<{ studentId: number }>(MAT_DIALOG_DATA);
  private http = inject(HttpClient);

  student = signal<StudentDetail | null>(null);
  isLoading = signal(true);
  hasError = signal(false);

  ngOnInit(): void {
    const id = this.dialogData.studentId;
    this.http
      .get<StudentDetailResponse>(
        `${environment.apiUrl}/api/school-admin/dashboard/student/${id}`
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
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