import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiStudent, StudentHomeworkOverview } from '../services/api-student';
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

  constructor() {
    this.fetchOverview();
  }

  retry(): void {
    this.fetchOverview();
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
}
