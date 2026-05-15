import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError, of, EMPTY } from 'rxjs';
import { ApiStudent, InfoCardData } from '../services/api-student';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-student-nfc-landingpage',
  imports: [CommonModule, MatIconModule],
  templateUrl: './student-nfc-landingpage.html',
  styleUrl: './student-nfc-landingpage.scss',
})
export class StudentNfcLandingpage implements OnInit {

  readonly hasError  = signal(false);
  readonly isLoading = signal(true);
  readonly student   = signal<InfoCardData | null>(null);

  readonly classDivision = computed(() => {
    const s = this.student();
    return s ? `${s.classLevel} - ${s.div}` : '';
  });

  private readonly uid: string | null;

  constructor(
    private readonly apiStudent: ApiStudent,
    private readonly route:      ActivatedRoute,
    private readonly router:     Router,
    private readonly toast:      ToastService,

  ) {
    this.uid = this.route.snapshot.paramMap.get('uid');
  }

  ngOnInit(): void {
    if (!this.uid) {
      this.handleError();
      return;
    }

    this.verifyAndLoad(this.uid);
  }

  private verifyAndLoad(uid: string): void {
    this.apiStudent
      .verifyUid(uid)
      .pipe(
        switchMap(({ userId }) => {
          if (userId === null) {
            this.router.navigate(['/register', uid]);
            return EMPTY;
          }
          return this.apiStudent.getLandingPageData(uid, userId);
        }),
        catchError(() => {
          this.handleError();
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          this.student.set(data);
        }
        this.isLoading.set(false);
      });
  }

  private handleError(): void {
    this.hasError.set(true);
    this.isLoading.set(false);
    this.toast.error("An error occurred while loading student data.");
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}