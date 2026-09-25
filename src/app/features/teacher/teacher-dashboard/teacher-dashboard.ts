import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiTeacher, TeacherUpdateCards } from '../services/api-teacher';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [MatIconModule, RouterLink, DashboardFooter],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboard {
  private readonly apiTeacher = inject(ApiTeacher);
  readonly hasError = signal(false);

  readonly teacher = toSignal(
    this.apiTeacher.getInfoCard().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      })
    ),
    { initialValue: null }
  );
  readonly updates = toSignal(
    this.apiTeacher.getTodayUpdates().pipe(catchError(() => of(null as TeacherUpdateCards | null))),
    { initialValue: null }
  );

  readonly updateItems = computed(() => {
    const data = this.updates();
    if (!data) return [];
    return [
      { label: 'Attendance', value: data.attendanceStatus ?? '-' },
      { label: 'Entry time', value: data.entryTime ?? '-' },
      { label: 'Photo taps', value: data.tapPhotoCount ?? 0, link: '/teacher/tap-photos' },
      { label: 'Notices', value: data.noticeCount ?? 0 },
      { label: 'Pending tasks', value: data.pendingTaskCount ?? 0 },
    ];
  });

  readonly isLoading = computed(() => this.teacher() === null);
}
