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

  readonly noticeForm = this.formBuilder.nonNullable.group({
    noticeTitle: ['', [Validators.required, Validators.minLength(3)]],
    noticeDescription: ['', [Validators.required, Validators.minLength(10)]],
    classLevel: [null as number | null, [Validators.min(1)]],
  });

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
      classLevel: this.noticeForm.controls.classLevel.value ?? null,
    };

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    this.apiSchoolAdmin
      .createNotice(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: response => {
          if (response.success && response.data.isCreated) {
            this.submitSuccess.set('Notice created successfully.');
            this.noticeForm.reset({ noticeTitle: '', noticeDescription: '', classLevel: null });
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
