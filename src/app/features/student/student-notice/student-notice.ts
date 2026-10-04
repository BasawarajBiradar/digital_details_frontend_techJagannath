import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';

import { ApiStudent, StudentNoticeAttachment, StudentNoticeTableRecord } from '../services/api-student';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-student-notice',
  standalone: true,
  imports: [CommonModule, MatIconModule, DashboardFooter, DatePipe],
  templateUrl: './student-notice.html',
  styleUrl: './student-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentNotice {
  private readonly apiStudent = inject(ApiStudent);

  readonly notices = signal<StudentNoticeTableRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly selectedNotice = signal<StudentNoticeTableRecord | null>(null);

  readonly tableRows = computed(() => this.notices().map((notice, index) => ({
    index: index + 1,
    noticeTitle: notice.noticeTitle,
    announcementDate: notice.announcementDate,
    noticeDetail: notice.noticeDetail,
  })));

  constructor() {
    this.loadNotices();
  }

  openDetails(notice: StudentNoticeTableRecord): void {
    this.selectedNotice.set(notice);
  }

  closeDetails(): void {
    this.selectedNotice.set(null);
  }

  isImageAttachment(file: StudentNoticeAttachment): boolean {
    return this.getAttachmentKind(file) === 'image';
  }

  isPdfAttachment(file: StudentNoticeAttachment): boolean {
    return this.getAttachmentKind(file) === 'pdf';
  }

  getAttachmentKind(file: StudentNoticeAttachment): 'image' | 'pdf' | 'other' {
    const name = `${file.fileName ?? ''} ${file.fileUrl ?? ''}`.toLowerCase();

    if (name.includes('pdf') || file.fileUrl.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    }

    if (name.includes('image') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.fileUrl)) {
      return 'image';
    }

    return 'other';
  }

  private loadNotices(): void {
    this.loading.set(true);
    this.error.set('');

    this.apiStudent
      .getNoticeTable()
      .pipe(
        catchError(() => {
          this.error.set('Unable to load notices right now. Please try again.');
          this.notices.set([]);
          return of([] as StudentNoticeTableRecord[]);
        }),
      )
      .subscribe(notices => {
        this.notices.set(notices);
        this.loading.set(false);
      });
  }
}
