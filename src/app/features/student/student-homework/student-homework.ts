import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';

@Component({
  selector: 'app-student-homework',
  imports: [DashboardFooter],
  templateUrl: './student-homework.html',
  styleUrl: './student-homework.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHomework {
}
