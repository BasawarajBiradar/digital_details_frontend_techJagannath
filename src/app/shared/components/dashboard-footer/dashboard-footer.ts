import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

type DashboardRole = 'student' | 'teacher' | 'school-admin';

interface FooterOption {
  label: string;
  icon: string;
  route: string;
  disabled?: boolean;
}

interface DashboardRoutes {
  home: string;
  attendance: string;
  photos: string;
  homework: string;
  notice: string;
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
    const routes: Record<DashboardRole, DashboardRoutes> = {
      student: {
        home: '/student-dashboard',
        attendance: '/student/attendance-details',
        photos: '/student/tap-photos',
        homework: '/student/homework',
        notice: '/student/notice',
      },
      teacher: {
        home: '/teacher-dashboard',
        attendance: '/teacher/attendance-details',
        photos: '/teacher/tap-photos',
        homework: '/teacher/homework',
        notice: '/teacher/notice',
      },
      'school-admin': {
        home: '/school-admin-dashboard',
        attendance: '/school-admin/attendance-details',
        photos: '/school-admin/photos',
        homework: '/school-admin/homework',
        notice: '/school-admin/notice',
      },
    };
    const roleRoutes = routes[this.role()];

    return [
      { label: 'Home', icon: 'home', route: roleRoutes.home },
      { label: 'Attendance', icon: 'event_available', route: roleRoutes.attendance },
      { label: 'Photos', icon: 'photo_library', route: roleRoutes.photos },
      { label: 'Homework', icon: 'assignment', route: roleRoutes.homework },
      { label: 'Notice', icon: 'campaign', route: roleRoutes.notice, disabled: true },
    ];
  });
}
