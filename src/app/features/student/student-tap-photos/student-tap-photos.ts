import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiStudent, StudentTapPhotoRecord } from '../services/api-student';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-student-tap-photos',
  imports: [DatePickerComponent, MatIconModule, DashboardFooter],
  templateUrl: './student-tap-photos.html',
  styleUrl: './student-tap-photos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentTapPhotos {

  private readonly apiStudent = inject(ApiStudent);
  readonly today = this.startOfDay(new Date());
  readonly fromDate = signal<Date | null>(this.startOfMonth(this.today));
  readonly toDate = signal<Date | null>(this.today);
  readonly tapPhotos = signal<StudentTapPhotoRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly showPhoto = signal(false);
  readonly selectedPhotoUrl = signal<string | null>(null);

  constructor() {
    this.fetchTapPhotos();
  }

  onFromDateChanged(date: Date | null): void {
    this.fromDate.set(date);
    this.fetchTapPhotos();
  }

  onToDateChanged(date: Date | null): void {
    this.toDate.set(date);
    this.fetchTapPhotos();
  }

  retry(): void {
    this.fetchTapPhotos();
  }

  openPhoto(photoUrl: string): void {
    this.selectedPhotoUrl.set(photoUrl);
    this.showPhoto.set(true);
  }

  closePhoto(): void {
    this.showPhoto.set(false);
    this.selectedPhotoUrl.set(null);
  }

  formatDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(value: string): string {
    const [hours, minutes] = value.split(':');
    if (hours === undefined || minutes === undefined) return value;

    const date = new Date(2000, 0, 1, Number(hours), Number(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private fetchTapPhotos(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) {
      this.tapPhotos.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);
    this.apiStudent.getTapPhotoOverview(
      this.toApiDate(fromDate),
      this.toApiDate(toDate),
    ).pipe(
      catchError(() => {
        this.error.set(true);
        return of([] as StudentTapPhotoRecord[]);
      })
    ).subscribe(records => {
      this.tapPhotos.set(records);
      this.loading.set(false);
    });
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
