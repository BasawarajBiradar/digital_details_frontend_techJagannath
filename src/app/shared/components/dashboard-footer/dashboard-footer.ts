import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

type DashboardRole = 'student' | 'school-admin';

interface FooterOption {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-footer',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-footer.html',
  styleUrl: './dashboard-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFooter {
  readonly role = input<DashboardRole>('student');

  readonly options = computed<FooterOption[]>(() => {
    const homeRoute = this.role() === 'student' ? '/student-dashboard' : '/school-admin-dashboard';
    const attendanceRoute = this.role() === 'student'
      ? '/student/attendance-details'
      : '/school-admin/attendance-details';
    const prefix = this.role() === 'student' ? '/student' : '/school-admin';

    return [
      { label: 'Home', icon: 'home', route: homeRoute },
      { label: 'Attendance', icon: 'event_available', route: attendanceRoute },
      { label: 'Photos', icon: 'photo_library', route: `${prefix}/photos` },
      { label: 'Homework', icon: 'assignment', route: `${prefix}/homework` },
      { label: 'Notice', icon: 'campaign', route: `${prefix}/notice` },
    ];
  });
}
