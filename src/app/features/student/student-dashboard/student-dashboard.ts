import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ApiStudent, CardTap } from '../services/api-student';
import { QrModel } from '../qr-model/qr-model';
import { ImageCropModal, CropResult } from '../image-crop-modal/image-crop-modal';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule, QrModel, ImageCropModal],
  templateUrl: './student-dashboard.html',
  styleUrl:    './student-dashboard.scss',
})
export class StudentDashboard {

  private readonly apiStudent = inject(ApiStudent);

  readonly hasError    = signal(false);
  readonly showQr      = signal(false);
  readonly qrObjectUrl = signal<string | null>(null);
  readonly qrLoading   = signal(false);
  readonly qrError     = signal(false);

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

    const prev = this.localPhotoUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.localPhotoUrl.set(result.objectUrl);

    // TODO (Phase 2): upload to backend
    // const form = new FormData();
    // form.append('photo', result.blob, 'profile.jpg');
    // this.apiStudent.uploadPhoto(form).subscribe({ ... });
  }

  onCropCancelled(): void {
    this.showCrop.set(false);
    this.cropFile.set(null);
  }
}