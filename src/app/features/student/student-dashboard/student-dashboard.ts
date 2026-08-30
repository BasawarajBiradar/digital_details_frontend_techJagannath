import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ApiStudent, CardTap } from '../services/api-student';
import { QrModel } from '../qr-model/qr-model';
import { ImageCropModal, CropResult } from '../../../shared/components/image-crop-modal/image-crop-modal';
import { ToastService } from '@core/services/toast-service';
import {
  DataTableAction,
  DataTableColumn,
  DataTableComponent,
  DataTableRow,
} from '../../../shared/components/data-table/data-table';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, QrModel, ImageCropModal, DataTableComponent],
  templateUrl: './student-dashboard.html',
  styleUrl:    './student-dashboard.scss',
})
export class StudentDashboard {

  private readonly apiStudent = inject(ApiStudent);

  readonly hasError    = signal(false);
  readonly showQr      = signal(false);
  readonly showImage   = signal(false);
  readonly selectedImageUrl = signal<string | null>(null);
  readonly qrObjectUrl = signal<string | null>(null);
  readonly qrLoading   = signal(false);
  readonly qrError     = signal(false);
  readonly photoUploading = signal(false);
  readonly photoUploadError = signal(false);
  private readonly toast = inject(ToastService);

  // Crop modal state
  readonly showCrop      = signal(false);
  readonly cropFile      = signal<File | null>(null);
  readonly localPhotoUrl = signal<string | null>(null);

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

  readonly todayTaps = toSignal(
    this.apiStudent.getTodayEntries().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as CardTap[]);
      })
    ),
    { initialValue: [] as CardTap[] }
  );

  // Optimistic preview: local crop wins over server URL
  readonly displayPhotoUrl = computed(
    () => this.localPhotoUrl() ?? this.student()?.photoUrl ?? null
  );

  readonly tapColumns: readonly DataTableColumn[] = [
    { key: 'index', header: '#', sortable: false },
    { key: 'date', header: 'Date', format: (value) => this.formatTapDate(value) },
    { key: 'time', header: 'Time' },
    { key: 'deviceId', header: 'Device ID' },
  ];

  readonly tapAction: DataTableAction = {
    label: 'View',
    icon: 'image',
    disabled: (row) => !(this.displayPhotoUrl() || row['imageUrl']),
  };

  readonly showDetailsButton = signal(true);
  readonly detailsAction = computed<DataTableAction>(() => ({
    label: 'Details',
    link: '/student/attendance-details',
    visible: this.showDetailsButton(),
  }));

  readonly todayTapRows = computed<readonly DataTableRow[]>(() =>
    this.todayTaps().map((tap, index) => ({ ...tap, index: index + 1 }))
  );

  // ── QR ──────────────────────────────────────────────────────────────────────

  openQr() {
    const prev = this.qrObjectUrl();
    if (prev) URL.revokeObjectURL(prev);

    this.qrObjectUrl.set(null);
    this.qrError.set(false);
    this.qrLoading.set(true);
    this.showQr.set(true);

    const uid        = this.student()?.uid;
    const landingUrl = `${window.location.origin}/student/${uid}`;

    this.apiStudent.generateQr(landingUrl).subscribe({
      next:  (blob) => { this.qrObjectUrl.set(URL.createObjectURL(blob)); this.qrLoading.set(false); },
      error: ()     => { this.qrError.set(true); this.qrLoading.set(false); },
    });
  }

  closeQr() { this.showQr.set(false); }

  openImage(url?: string | null) {
    const src = url ?? this.displayPhotoUrl();
    if (!src) return;
    this.selectedImageUrl.set(src);
    this.showImage.set(true);
  }

  onTapAction(row: DataTableRow): void {
    this.openImage(typeof row['imageUrl'] === 'string' ? row['imageUrl'] : null);
  }

  private formatTapDate(value: unknown): string {
    if (typeof value !== 'string') return '-';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  closeImage() {
    this.showImage.set(false);
    this.selectedImageUrl.set(null);
  }

  // ── Photo edit ───────────────────────────────────────────────────────────────

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.cropFile.set(file);
    this.showCrop.set(true);
    input.value = '';
  }

  onCropDone(result: CropResult): void {
    this.showCrop.set(false);
    this.cropFile.set(null);

    // Optimistic preview immediately
    const prev = this.localPhotoUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.localPhotoUrl.set(result.objectUrl);

    // Upload to backend
    const form = new FormData();
    form.append('file', result.blob, 'profile.jpg');  // key must be 'file'

    this.photoUploading.set(true);
    this.photoUploadError.set(false);

    this.apiStudent.uploadPhoto(form).subscribe({
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