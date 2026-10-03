import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { CropResult, ImageCropModal } from '../../../shared/components/image-crop-modal/image-crop-modal';
import {
  ApiTeacher,
  AddTeacherHomeworkPayload,
  TeacherHomeworkOverview,
  TeacherReviewRequest,
} from '../services/api-teacher';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-teacher-homework',
  imports: [MatIconModule, ReactiveFormsModule, ImageCropModal, DashboardFooter],
  templateUrl: './teacher-homework.html',
  styleUrl: './teacher-homework.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherHomework implements OnDestroy {
  private readonly apiTeacher = inject(ApiTeacher);
  private readonly formBuilder = inject(FormBuilder);
  readonly classLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  readonly divisions = ['A', 'B', 'C', 'D', 'E'];
  readonly subjects = [{ id: 1, name: 'Mathematics' }];
  readonly minimumDeadlineDate = this.toDateInput(new Date());
  readonly addHomeworkForm = this.formBuilder.nonNullable.group({
    subjectMasterId: [1, Validators.required],
    deadlineDate: ['', Validators.required],
    classLevel: ['', Validators.required],
    division: ['', Validators.required],
    homeworkTitle: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  readonly addHomeworkSaving = signal(false);
  readonly addHomeworkError = signal(false);
  readonly addHomeworkSuccess = signal('');
  readonly cropFile = signal<File | null>(null);
  readonly cropQueue = signal<File[]>([]);
  readonly croppedImages = signal<Array<CropResult & { fileName: string }>>([]);
  readonly imageSelectionError = signal('');
  readonly overview = signal<TeacherHomeworkOverview | null>(null);
  readonly overviewLoading = signal(true);
  readonly overviewError = signal(false);
  readonly reviewRequests = signal<TeacherReviewRequest[]>([]);
  readonly detailsVisible = signal(false);
  readonly detailsLoading = signal(false);
  readonly detailsError = signal(false);
  readonly selectedStatuses = signal<Record<number, number>>({});
  readonly statusUpdating = signal<number | null>(null);
  readonly statusError = signal<number | null>(null);

  constructor() {
    this.fetchOverview();
  }

  ngOnDestroy(): void {
    this.croppedImages().forEach(image => URL.revokeObjectURL(image.objectUrl));
  }

  retryOverview(): void {
    this.fetchOverview();
  }

  openReviewRequests(): void {
    this.detailsVisible.set(true);
    this.fetchReviewRequests();
  }

  closeReviewRequests(): void {
    this.detailsVisible.set(false);
  }

  retryReviewRequests(): void {
    this.fetchReviewRequests();
  }

  onHomeworkImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    this.imageSelectionError.set(imageFiles.length === files.length ? '' : 'Choose image files only.');
    if (!imageFiles.length) return;

    this.cropQueue.update(queue => [...queue, ...imageFiles]);
    this.openNextCrop();
  }

  onHomeworkImageCropped(result: CropResult): void {
    const file = this.cropFile();
    if (!file) return;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'homework-image';
    this.croppedImages.update(images => [...images, { ...result, fileName: `${baseName}.jpg` }]);
    this.cropQueue.update(queue => queue.slice(1));
    this.cropFile.set(null);
    this.openNextCrop();
  }

  onHomeworkImageCropCancelled(): void {
    this.cropQueue.update(queue => queue.slice(1));
    this.cropFile.set(null);
    this.openNextCrop();
  }

  removeHomeworkImage(index: number): void {
    this.croppedImages.update(images => {
      const image = images[index];
      if (image) URL.revokeObjectURL(image.objectUrl);
      return images.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  submitHomework(): void {
    if (this.addHomeworkSaving() || this.cropFile() || this.cropQueue().length) return;
    if (this.addHomeworkForm.invalid) {
      this.addHomeworkForm.markAllAsTouched();
      return;
    }

    const values = this.addHomeworkForm.getRawValue();
    const payload: AddTeacherHomeworkPayload = {
      subjectMasterId: Number(values.subjectMasterId),
      deadlineDate: values.deadlineDate,
      classLevel: Number(values.classLevel),
      division: values.division,
      homeworkTitle: values.homeworkTitle.trim(),
      description: values.description.trim(),
    };

    this.addHomeworkSaving.set(true);
    this.addHomeworkError.set(false);
    this.addHomeworkSuccess.set('');
    this.apiTeacher.addHomework(payload, this.croppedImages().map(image => image.blob)).pipe(
      catchError(() => of(null)),
    ).subscribe(result => {
      this.addHomeworkSaving.set(false);
      if (!result?.savedHomeworkTitle) {
        this.addHomeworkError.set(true);
        return;
      }

      this.addHomeworkSuccess.set(`Homework "${result.savedHomeworkTitle}" added.`);
      this.clearHomeworkImages();
      this.imageSelectionError.set('');
      this.addHomeworkForm.reset({
        subjectMasterId: this.subjects[0].id,
        deadlineDate: '',
        classLevel: '',
        division: '',
        homeworkTitle: '',
        description: '',
      });
      this.fetchOverview();
    });
  }

  setStatus(reviewRequestId: number, event: Event): void {
    const statusId = Number((event.target as HTMLSelectElement).value);
    this.selectedStatuses.update(statuses => ({ ...statuses, [reviewRequestId]: statusId }));
  }

  updateStatus(request: TeacherReviewRequest): void {
    const statusId = this.selectedStatuses()[request.reviewRequestId] ?? 3;
    if (this.statusUpdating() !== null) return;

    this.statusUpdating.set(request.reviewRequestId);
    this.statusError.set(null);
    this.apiTeacher.updateHomeworkReviewStatus(request.reviewRequestId, statusId).pipe(
      catchError(() => of(null)),
    ).subscribe(result => {
      this.statusUpdating.set(null);
      if (!result?.responseStatus) {
        this.statusError.set(request.reviewRequestId);
        return;
      }

      this.fetchOverview();
      this.fetchReviewRequests();
    });
  }

  formatDate(value: string): string {
    const date = new Date(value.replace(' ', 'T'));
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private toDateInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private openNextCrop(): void {
    if (this.cropFile()) return;
    const nextFile = this.cropQueue()[0];
    if (nextFile) this.cropFile.set(nextFile);
  }

  private clearHomeworkImages(): void {
    this.croppedImages().forEach(image => URL.revokeObjectURL(image.objectUrl));
    this.croppedImages.set([]);
  }

  private fetchOverview(): void {
    this.overviewLoading.set(true);
    this.overviewError.set(false);
    this.apiTeacher.getHomeworkOverview().pipe(
      catchError(() => {
        this.overviewError.set(true);
        return of(null);
      }),
    ).subscribe(data => {
      this.overview.set(data);
      this.overviewLoading.set(false);
    });
  }

  private fetchReviewRequests(): void {
    this.detailsLoading.set(true);
    this.detailsError.set(false);
    this.apiTeacher.getHomeworkReviewRequests().pipe(
      catchError(() => {
        this.detailsError.set(true);
        return of([] as TeacherReviewRequest[]);
      }),
    ).subscribe(requests => {
      this.reviewRequests.set(requests);
      this.selectedStatuses.update(statuses => {
        const next = { ...statuses };
        requests.forEach(request => {
          next[request.reviewRequestId] ??= 3;
        });
        return next;
      });
      this.detailsLoading.set(false);
    });
  }
}
