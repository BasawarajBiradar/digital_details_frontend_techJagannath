import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiStudent, StudentHomeworkOverview, StudentHomeworkRecord } from '../services/api-student';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-student-homework',
  imports: [MatIconModule, DashboardFooter],
  templateUrl: './student-homework.html',
  styleUrl: './student-homework.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHomework {
  private readonly apiStudent = inject(ApiStudent);
  readonly overview = signal<StudentHomeworkOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly homework = signal<StudentHomeworkRecord[]>([]);
  readonly tableLoading = signal(true);
  readonly tableError = signal(false);
  readonly selectedHomework = signal<StudentHomeworkRecord | null>(null);

  constructor() {
    this.fetchOverview();
    this.fetchHomework();
  }

  retry(): void {
    this.fetchOverview();
    this.fetchHomework();
  }

  openDetails(homework: StudentHomeworkRecord): void {
    this.selectedHomework.set(homework);
  }

  closeDetails(): void {
    this.selectedHomework.set(null);
  }

  formatDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private fetchOverview(): void {
    this.loading.set(true);
    this.error.set(false);
    this.apiStudent.getHomeworkOverview().pipe(
      catchError(() => {
        this.error.set(true);
        return of(null);
      })
    ).subscribe(data => {
      this.overview.set(data);
      this.loading.set(false);
    });
  }

  private fetchHomework(): void {
    this.tableLoading.set(true);
    this.tableError.set(false);
    this.apiStudent.getHomeworkTable().pipe(
      catchError(() => {
        this.tableError.set(true);
        return of([] as StudentHomeworkRecord[]);
      })
    ).subscribe(records => {
      this.homework.set(records);
      this.tableLoading.set(false);
    });
  }
}
