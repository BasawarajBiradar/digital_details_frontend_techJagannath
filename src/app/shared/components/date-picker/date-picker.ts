import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-date-picker',
  imports: [MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatIconModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent {
  readonly label = input('Select date');
  readonly placeholder = input('Choose a date');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabled = input(false);
  readonly compact = input(false);
  readonly startLabel = input('From');
  readonly endLabel = input('To');
  readonly selectedDate = model<Date | null>(null);
  readonly startDate = model<Date | null>(null);
  readonly endDate = model<Date | null>(null);

  onDateChanged(date: Date | null): void {
    this.selectedDate.set(date);
  }

  onStartDateChanged(date: Date | null): void {
    this.startDate.set(date);
  }

  onEndDateChanged(date: Date | null): void {
    this.endDate.set(date);
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Select date';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
