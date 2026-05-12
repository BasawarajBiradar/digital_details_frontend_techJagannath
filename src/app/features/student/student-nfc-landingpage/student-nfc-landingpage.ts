import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, EMPTY } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ApiStudent, InfoCardData } from '../services/api-student';

@Component({
  selector: 'app-student-nfc-landingpage',
  imports: [CommonModule, MatIconModule],
  templateUrl: './student-nfc-landingpage.html',
  styleUrl: './student-nfc-landingpage.scss',
})
export class StudentNfcLandingpage {

  private readonly apiStudent = inject(ApiStudent);
  private readonly route      = inject(ActivatedRoute);

  readonly hasError = signal(false);

  private readonly uid = this.route.snapshot.paramMap.get('uid');

  readonly student = toSignal(
    this.uid
      ? this.apiStudent.getLandingPageData(this.uid).pipe(
          catchError(() => {
            this.hasError.set(true);
            return of(null);
          })
        )
      : (this.hasError.set(true), of(null)),
    { initialValue: null }
  );

  readonly isLoading = computed(() => this.student() === null && !this.hasError());

  readonly classDivision = computed(() => {
    const s = this.student();
    return s ? `${s.classLevel} - ${s.div}` : '';
  });
}