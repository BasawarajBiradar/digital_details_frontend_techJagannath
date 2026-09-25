import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, of, switchMap } from 'rxjs';
import { ApiTeacher, TeacherInfoCard } from '../services/api-teacher';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-teacher-nfc-landing-page',
  imports: [MatIconModule],
  templateUrl: './teacher-nfc-landingpage.html',
  styleUrl: './teacher-nfc-landingpage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherNfcLandingPage implements OnInit {
  private readonly apiTeacher = inject(ApiTeacher);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly teacher = signal<TeacherInfoCard | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly title = computed(() => this.teacher()?.fullName ?? 'Teacher profile');

  ngOnInit(): void {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (!uid) { this.handleError(); return; }
    this.apiTeacher.verifyUid(uid).pipe(
      switchMap(({ userId }) => {
        if (userId === null) {
          this.router.navigate(['/teacher-register', uid]);
          return EMPTY;
        }
        return this.apiTeacher.getLandingPageData(uid, userId);
      }),
      catchError(() => { this.handleError(); return of(null); })
    ).subscribe(data => { this.teacher.set(data); this.loading.set(false); });
  }

  private handleError(): void {
    this.error.set(true);
    this.loading.set(false);
    this.toast.error('Could not load teacher profile.');
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}
