import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiSchoolAdmin, StudentSummary } from '../services/api-school-admin';

@Component({
  selector: 'app-school-admin-dashboard',
  imports: [CommonModule, MatIconModule, DatePipe],
  templateUrl: './school-admin-dashboard.html',
  styleUrl: './school-admin-dashboard.scss',
})
export class SchoolAdminDashboard implements OnInit {
  students = signal<StudentSummary[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  constructor(private api: ApiSchoolAdmin) {}

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
}