import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DashboardFooter } from '../../../shared/components/dashboard-footer/dashboard-footer';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-student-attendance-details',
  imports: [
    DatePickerComponent,
    DashboardFooter,
  ],
  templateUrl: './student-attendance-details.html',
  styleUrl: './student-attendance-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttendanceDetailsComponent {

  readonly today = this.startOfDay(new Date());
  readonly fromDate = signal<Date | null>(this.addDays(this.today, -7));
  readonly toDate = signal<Date | null>(this.today);

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

}