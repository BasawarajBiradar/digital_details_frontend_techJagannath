import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ApiStudent } from '../services/api-student';

interface CardTap {
  id:   number;
  time: Date;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './student-dashboard.html',
  styleUrl:    './student-dashboard.scss',
})
export class StudentDashboard {

  private readonly apiStudent = inject(ApiStudent);

  // ── Track whether the API call threw an error ─────────────────────────────
  readonly hasError = signal(false);

  // ── Convert the observable to a signal.
  //    toSignal() automatically handles loading: the signal is `undefined`
  //    until the first value arrives, so no manual isLoading flag is needed.
  readonly student = toSignal(
    this.apiStudent.getInfoCard().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      })
    ),
    { initialValue: null }
  );

  // ── Derived: true only while student is still null AND no error occurred
  readonly isLoading = computed(() => this.student() === null && !this.hasError());

  // ── Derived: "10 - A" from classLevel + div
  readonly classDivision = computed(() => {
    const s = this.student();
    return s ? `${s.classLevel} - ${s.div}` : '';
  });

  // ── Tap history (replace with its own API call when ready)
  readonly todayTaps: CardTap[] = [
    { id: 1, time: new Date('2025-05-10T07:42:00') },
    { id: 2, time: new Date('2025-05-10T13:15:00') },
    { id: 3, time: new Date('2025-05-10T17:05:00') },
  ];
}