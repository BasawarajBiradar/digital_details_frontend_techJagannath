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
  readonly hasError = signal(false);
  readonly student = toSignal(
    this.apiStudent.getInfoCard().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      })
    ),
    { initialValue: null }
  );

  readonly isLoading = computed(() => this.student() === null && !this.hasError());

  readonly classDivision = computed(() => {
    const s = this.student();
    return s ? `${s.classLevel} - ${s.div}` : '';
  });

  readonly todayTaps: CardTap[] = [
    { id: 1, time: new Date('2025-05-10T07:42:00') },
    { id: 2, time: new Date('2025-05-10T13:15:00') },
    { id: 3, time: new Date('2025-05-10T17:05:00') },
  ];
}