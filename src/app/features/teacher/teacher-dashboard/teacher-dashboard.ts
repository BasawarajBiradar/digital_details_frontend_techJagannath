import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiTeacher, TeacherUpdateCards } from '../services/api-teacher';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';
import { ImageCropModal, CropResult } from '../../../shared/components/image-crop-modal/image-crop-modal';
import { ToastService } from '@core/services/toast-service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [MatIconModule, RouterLink, ImageCropModal, DashboardFooter],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboard {
  private readonly apiTeacher = inject(ApiTeacher);
  private readonly toast = inject(ToastService);
  readonly hasError = signal(false);
  readonly showImage = signal(false);
  readonly selectedImageUrl = signal<string | null>(null);
  readonly showCrop = signal(false);
  readonly cropFile = signal<File | null>(null);
  readonly localPhotoUrl = signal<string | null>(null);
  readonly photoUploading = signal(false);
  readonly photoUploadError = signal(false);

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

  readonly displayPhotoUrl = computed(
    () => this.localPhotoUrl() ?? this.teacher()?.photoUrl ?? null
  );

  openImage(): void {
    const photoUrl = this.displayPhotoUrl();
    if (!photoUrl) return;
    this.selectedImageUrl.set(photoUrl);
    this.showImage.set(true);
  }

  closeImage(): void {
    this.showImage.set(false);
    this.selectedImageUrl.set(null);
  }

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.cropFile.set(file);
    this.showCrop.set(true);
    input.value = '';
  }

  onCropDone(result: CropResult): void {
    this.showCrop.set(false);
    this.cropFile.set(null);

    const previousUrl = this.localPhotoUrl();
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    this.localPhotoUrl.set(result.objectUrl);

    const form = new FormData();
    form.append('file', result.blob, 'profile.jpg');
    this.photoUploading.set(true);
    this.photoUploadError.set(false);

    this.apiTeacher.uploadPhoto(form).subscribe({
      next: () => {
        this.photoUploading.set(false);
        window.location.reload();
      },
      error: () => {
        this.photoUploading.set(false);
        this.photoUploadError.set(true);
        this.toast.error('Failed to upload photo. Please try again.');
      },
    });
  }

  onCropCancelled(): void {
    this.showCrop.set(false);
    this.cropFile.set(null);
  }
}
