import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiSchoolAdmin, SchoolNoticePayload } from '../services/api-school-admin';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-notice-management',
  imports: [ReactiveFormsModule, MatIconModule, DashboardFooter],
  templateUrl: './notice-management.html',
  styleUrl: './notice-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeManagement {
  private readonly formBuilder = inject(FormBuilder);
  private readonly apiSchoolAdmin = inject(ApiSchoolAdmin);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccess = signal('');
  readonly attachmentError = signal('');
  readonly attachedFiles = signal<File[]>([]);

  readonly availableClasses = Array.from({ length: 12 }, (_, i) => String(i + 1));

  readonly noticeForm = this.formBuilder.nonNullable.group({
    noticeTitle: ['', [Validators.required, Validators.minLength(3)]],
    noticeDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    classLevel: [''],
    isStaff: [false],
  });

  goBack(): void {
    this.router.navigate(['/school-admin-dashboard']);
  }

  setAudience(isStaff: boolean): void {
    this.noticeForm.controls.isStaff.setValue(isStaff);
  }

  onNoticeFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';

    if (!selectedFiles.length) {
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 5;

    const currentFiles = this.attachedFiles();
    if (currentFiles.length + selectedFiles.length > MAX_FILES) {
      this.attachmentError.set(`You can attach up to ${MAX_FILES} files in total.`);
      return;
    }

    const oversizedFile = selectedFiles.find(f => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      this.attachmentError.set(`File "${oversizedFile.name}" exceeds the 10MB limit.`);
      return;
    }

    const validFiles = selectedFiles.filter(file => file.size > 0);
    this.attachmentError.set('');
    this.attachedFiles.update(files => [...files, ...validFiles]);
  }

  removeAttachment(index: number): void {
    this.attachedFiles.update(files => files.filter((_, fileIndex) => fileIndex !== index));
    this.attachmentError.set('');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  submitNotice(): void {
    if (this.noticeForm.invalid) {
      this.noticeForm.markAllAsTouched();
      this.submitError.set('Please provide a valid title and detailed description.');
      this.submitSuccess.set('');
      return;
    }

    const payload: SchoolNoticePayload = {
      noticeTitle: this.noticeForm.controls.noticeTitle.value.trim(),
      noticeDescription: this.noticeForm.controls.noticeDescription.value.trim(),
      classLevel: this.noticeForm.controls.classLevel.value ? this.noticeForm.controls.classLevel.value.trim() : null,
      isStaff: this.noticeForm.controls.isStaff.value,
    };

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    this.apiSchoolAdmin
      .createNotice(payload, this.attachedFiles())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: response => {
          if (response.success && response.data.isCreated) {
            this.submitSuccess.set('Notice broadcasted and published successfully.');
            this.noticeForm.reset({ noticeTitle: '', noticeDescription: '', classLevel: '', isStaff: false });
            this.attachedFiles.set([]);
            this.attachmentError.set('');
            return;
          }

          this.submitError.set(response.message || 'Unable to publish the notice.');
        },
        error: () => {
          this.submitError.set('Unable to publish notice right now. Please verify server connectivity.');
        },
      });
  }
}
