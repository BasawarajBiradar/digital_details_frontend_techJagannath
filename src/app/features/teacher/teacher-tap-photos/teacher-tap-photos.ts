import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiTeacher, TeacherTapPhotoRecord } from '../services/api-teacher';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-teacher-tap-photos',
  imports: [DatePickerComponent, MatIconModule, DashboardFooter],
  templateUrl: './teacher-tap-photos.html',
  styleUrl: './teacher-tap-photos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherTapPhotos {
  private readonly apiTeacher = inject(ApiTeacher);
  readonly today = this.startOfDay(new Date());
  readonly fromDate = signal<Date | null>(this.startOfMonth(this.today));
  readonly toDate = signal<Date | null>(this.today);
  readonly records = signal<TeacherTapPhotoRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedPhotoUrl = signal<string | null>(null);

  constructor() { this.fetchRecords(); }

  onFromDateChanged(date: Date | null): void { this.fromDate.set(date); this.fetchRecords(); }
  onToDateChanged(date: Date | null): void { this.toDate.set(date); this.fetchRecords(); }
  retry(): void { this.fetchRecords(); }
  openPhoto(url: string): void { this.selectedPhotoUrl.set(url); }
  closePhoto(): void { this.selectedPhotoUrl.set(null); }

  formatDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(value: string): string {
    const [hours, minutes] = value.split(':');
    if (!hours || !minutes) return value;
    return new Date(2000, 0, 1, Number(hours), Number(minutes)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private fetchRecords(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (!fromDate || !toDate || fromDate > toDate) return;
    this.loading.set(true);
    this.error.set(false);
    this.apiTeacher.getTapPhotos(this.toApiDate(fromDate), this.toApiDate(toDate)).pipe(
      catchError(() => { this.error.set(true); return of([] as TeacherTapPhotoRecord[]); })
    ).subscribe(records => { this.records.set(records); this.loading.set(false); });
  }

  private startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  private startOfMonth(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), 1); }
  private toApiDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
