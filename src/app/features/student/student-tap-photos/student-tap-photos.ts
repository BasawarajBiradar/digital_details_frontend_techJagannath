import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { ApiStudent, StudentTapPhotoRecord } from '../services/api-student';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

export type DateFilterPreset = 'today' | '7days' | 'month' | 'custom';

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
  readonly activePreset = signal<DateFilterPreset>('month');

  readonly tapPhotos = signal<StudentTapPhotoRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Lightbox Modal State
  readonly showPhotoModal = signal(false);
  readonly selectedPhotoIndex = signal<number>(-1);
  readonly modalZoom = signal<number>(1);

  // Backward compatibility signals
  readonly showPhoto = computed(() => this.showPhotoModal());
  readonly selectedPhotoUrl = computed(() => this.activePhoto()?.photoUrl ?? null);

  // Track failed image URLs for broken image fallback
  readonly failedImages = signal<Set<string>>(new Set());

  // Skeleton placeholders count
  readonly skeletonCards = Array.from({ length: 6 }, (_, index) => index);

  // Photos that contain a valid image URL
  readonly photosWithUrl = computed(() =>
    this.tapPhotos().filter((record) => !!record.photoUrl)
  );

  // Currently inspected photo in lightbox
  readonly activePhoto = computed<StudentTapPhotoRecord | null>(() => {
    const list = this.photosWithUrl();
    const index = this.selectedPhotoIndex();
    if (index >= 0 && index < list.length) {
      return list[index];
    }
    return null;
  });

  // Human-readable active date range summary
  readonly activeDateRangeLabel = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();
    if (!from || !to) return 'Custom Date Range';

    const fromStr = this.formatDateObj(from);
    const toStr = this.formatDateObj(to);
    if (fromStr === toStr) {
      return `Date: ${fromStr}`;
    }
    return `${fromStr} – ${toStr}`;
  });

  constructor() {
    this.fetchTapPhotos();
  }

  // ─── Filter Presets ────────────────────────────────────────────────────────
  setFilterPreset(preset: DateFilterPreset): void {
    this.activePreset.set(preset);

    if (preset === 'today') {
      this.fromDate.set(this.startOfDay(this.today));
      this.toDate.set(this.startOfDay(this.today));
      this.fetchTapPhotos();
    } else if (preset === '7days') {
      const past7 = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 6);
      this.fromDate.set(this.startOfDay(past7));
      this.toDate.set(this.startOfDay(this.today));
      this.fetchTapPhotos();
    } else if (preset === 'month') {
      this.fromDate.set(this.startOfMonth(this.today));
      this.toDate.set(this.startOfDay(this.today));
      this.fetchTapPhotos();
    }
    // 'custom' maintains current picker bounds until user changes them
  }

  onFromDateChanged(date: Date | null): void {
    this.fromDate.set(date);
    this.activePreset.set('custom');
    this.fetchTapPhotos();
  }

  onToDateChanged(date: Date | null): void {
    this.toDate.set(date);
    this.activePreset.set('custom');
    this.fetchTapPhotos();
  }

  retry(): void {
    this.fetchTapPhotos();
  }

  // ─── Lightbox Interactions ──────────────────────────────────────────────────
  openPhoto(photo: StudentTapPhotoRecord): void {
    if (!photo.photoUrl) return;

    const list = this.photosWithUrl();
    const foundIndex = list.findIndex(
      (item) => item.photoUrl === photo.photoUrl && item.date === photo.date && item.time === photo.time
    );

    this.selectedPhotoIndex.set(foundIndex !== -1 ? foundIndex : 0);
    this.modalZoom.set(1);
    this.showPhotoModal.set(true);
  }

  closePhoto(): void {
    this.showPhotoModal.set(false);
    this.selectedPhotoIndex.set(-1);
    this.modalZoom.set(1);
  }

  nextPhoto(): void {
    if (this.selectedPhotoIndex() < this.photosWithUrl().length - 1) {
      this.selectedPhotoIndex.update((i) => i + 1);
      this.modalZoom.set(1);
    }
  }

  previousPhoto(): void {
    if (this.selectedPhotoIndex() > 0) {
      this.selectedPhotoIndex.update((i) => i - 1);
      this.modalZoom.set(1);
    }
  }

  zoomIn(): void {
    this.modalZoom.update((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  }

  zoomOut(): void {
    this.modalZoom.update((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100));
  }

  resetZoom(): void {
    this.modalZoom.set(1);
  }

  downloadPhoto(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  // ─── Image Error Handling ───────────────────────────────────────────────────
  onImageError(photoUrl: string | null): void {
    if (!photoUrl) return;
    const next = new Set(this.failedImages());
    next.add(photoUrl);
    this.failedImages.set(next);
  }

  isImageFailed(photoUrl: string | null): boolean {
    return !!photoUrl && this.failedImages().has(photoUrl);
  }

  // ─── Keyboard Accessibility ────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.showPhotoModal()) return;

    if (event.key === 'Escape') {
      this.closePhoto();
    } else if (event.key === 'ArrowRight') {
      this.nextPhoto();
    } else if (event.key === 'ArrowLeft') {
      this.previousPhoto();
    }
  }

  // ─── Date & Time Formatting ────────────────────────────────────────────────
  formatDate(value: string): string {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatShortDate(value: string): string {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  formatTime(value: string): string {
    if (!value) return '';
    const [hours, minutes] = value.split(':');
    if (hours === undefined || minutes === undefined) return value;

    const date = new Date(2000, 0, 1, Number(hours), Number(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  private formatDateObj(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ─── API Integration ───────────────────────────────────────────────────────
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

    this.apiStudent
      .getTapPhotoOverview(this.toApiDate(fromDate), this.toApiDate(toDate))
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of([] as StudentTapPhotoRecord[]);
        })
      )
      .subscribe((records) => {
        const safeRecords = Array.isArray(records) ? records : [];
        this.tapPhotos.set(safeRecords);
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
