import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiSchoolAdmin, SchoolNoticePayload } from '../services/api-school-admin';

@Component({
  selector: 'app-notice-management',
  imports: [ReactiveFormsModule],
  templateUrl: './notice-management.html',
  styleUrl: './notice-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeManagement {
  private readonly formBuilder = inject(FormBuilder);
  private readonly apiSchoolAdmin = inject(ApiSchoolAdmin);

  readonly isSubmitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccess = signal('');
  readonly attachmentError = signal('');
  readonly attachedFiles = signal<File[]>([]);

  readonly noticeForm = this.formBuilder.nonNullable.group({
    noticeTitle: ['', [Validators.required, Validators.minLength(3)]],
    noticeDescription: ['', [Validators.required, Validators.minLength(10)]],
    classLevel: ['', [Validators.minLength(1)]],
    isStaff: [false],
  });

  onNoticeFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';

    if (!selectedFiles.length) {
      return;
    }

    const validFiles = selectedFiles.filter(file => file.size > 0);
    this.attachmentError.set(
      validFiles.length === selectedFiles.length ? '' : 'Only valid files can be attached.',
    );

    if (!validFiles.length) {
      return;
    }

    this.attachedFiles.update(files => [...files, ...validFiles]);
  }

  removeAttachment(index: number): void {
    this.attachedFiles.update(files => files.filter((_, fileIndex) => fileIndex !== index));
  }

  submitNotice(): void {
    if (this.noticeForm.invalid) {
      this.noticeForm.markAllAsTouched();
      this.submitError.set('Please complete the required notice details.');
      this.submitSuccess.set('');
      return;
    }

    const payload: SchoolNoticePayload = {
      noticeTitle: this.noticeForm.controls.noticeTitle.value.trim(),
      noticeDescription: this.noticeForm.controls.noticeDescription.value.trim(),
      classLevel: this.noticeForm.controls.classLevel.value?.trim() || null,
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
            this.submitSuccess.set('Notice created successfully.');
            this.noticeForm.reset({ noticeTitle: '', noticeDescription: '', classLevel: '', isStaff: false });
            this.attachedFiles.set([]);
            this.attachmentError.set('');
            return;
          }

          this.submitError.set(response.message || 'Unable to create the notice.');
        },
        error: () => {
          this.submitError.set('Unable to create the notice right now. Please try again.');
        },
      });
  }
}
