import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';

import { ApiTeacher, TeacherNoticeAttachment, TeacherNoticeTableRecord } from '../services/api-teacher';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-teacher-notice',
  standalone: true,
  imports: [CommonModule, MatIconModule, DashboardFooter],
  templateUrl: './teacher-notice.html',
  styleUrl: './teacher-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherNotice {
  private readonly apiTeacher = inject(ApiTeacher);

  readonly notices = signal<TeacherNoticeTableRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly selectedNotice = signal<TeacherNoticeTableRecord | null>(null);

  readonly tableRows = signal<Array<{
    index: number;
    noticeTitle: string;
    announcementDate: string;
    noticeDetail: string;
  }>>([]);

  constructor() {
    this.loadNotices();
  }

  openDetails(notice: TeacherNoticeTableRecord): void {
    this.selectedNotice.set(notice);
  }

  closeDetails(): void {
    this.selectedNotice.set(null);
  }

  isImageAttachment(file: TeacherNoticeAttachment): boolean {
    return this.getAttachmentKind(file) === 'image';
  }

  isPdfAttachment(file: TeacherNoticeAttachment): boolean {
    return this.getAttachmentKind(file) === 'pdf';
  }

  getAttachmentKind(file: TeacherNoticeAttachment): 'image' | 'pdf' | 'other' {
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

    this.apiTeacher
      .getNoticeTable()
      .pipe(
        catchError(() => {
          this.error.set('Unable to load notices right now. Please try again.');
          this.notices.set([]);
          this.tableRows.set([]);
          return of([] as TeacherNoticeTableRecord[]);
        }),
      )
      .subscribe(notices => {
        this.notices.set(notices);
        this.tableRows.set(notices.map((notice, index) => ({
          index: index + 1,
          noticeTitle: notice.noticeTitle,
          announcementDate: notice.announcementDate,
          noticeDetail: notice.noticeDetail,
        })));
        this.loading.set(false);
      });
  }
}
