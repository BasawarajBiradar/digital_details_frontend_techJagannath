import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

export type DataTableRow = Record<string, unknown>;

export interface DataTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  format?: (value: unknown, row: DataTableRow) => string;
}

export interface DataTableAction {
  label: string;
  icon?: string;
  disabled?: (row: DataTableRow) => boolean;
}

export interface DataTableApiResponse {
  data?: readonly DataTableRow[] | null;
  [key: string]: unknown;
}

@Component({
  selector: 'app-data-table',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements AfterViewInit {
  readonly title = input('');
  readonly columns = input<readonly DataTableColumn[]>([]);
  readonly apiResponse = input<DataTableApiResponse | readonly DataTableRow[] | null>(null);
  readonly loading = input(false);
  readonly searchable = input(true);
  readonly paginated = input(true);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25, 100]);
  readonly action = input<DataTableAction | null>(null);
  readonly actionTriggered = output<DataTableRow>();

  readonly filterControl = new FormControl('', { nonNullable: true });
  readonly displayedColumnKeys = computed(() => [
    ...this.columns().map((column) => column.key),
    ...(this.action() ? ['actions'] : []),
  ]);
  readonly dataSource = new MatTableDataSource<DataTableRow>([]);
  readonly paginator = viewChild(MatPaginator);
  readonly sort = viewChild(MatSort);
  readonly filter = signal('');

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.filterControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.filter.set(value.trim().toLowerCase()));

    effect(() => {
      this.dataSource.data = this.getRows(this.apiResponse());
      this.dataSource.filterPredicate = (row) => this.matchesFilter(row, this.filter());
      this.dataSource.sortingDataAccessor = (row, columnKey) =>
        this.getCellValue(row, columnKey);
      this.dataSource.filter = this.filter();

      const paginator = this.paginator();
      const sort = this.sort();
      if (paginator) this.dataSource.paginator = paginator;
      if (sort) this.dataSource.sort = sort;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator() ?? null;
    this.dataSource.sort = this.sort() ?? null;
  }

  clearFilter(): void {
    this.filterControl.setValue('');
  }

  displayValue(row: DataTableRow, column: DataTableColumn): string {
    const value = this.getCellValue(row, column.key);
    if (column.format) return column.format(value, row);
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private getRows(response: DataTableApiResponse | readonly DataTableRow[] | null): DataTableRow[] {
    if (Array.isArray(response)) return [...response];
    if (!response || !('data' in response) || !response.data) return [];
    return [...response.data];
  }

  private getCellValue(row: DataTableRow, key: string): string | number {
    const value = key.split('.').reduce<unknown>((current, segment) => {
      if (typeof current !== 'object' || current === null) return undefined;
      return (current as Record<string, unknown>)[segment];
    }, row);

    return typeof value === 'number' ? value : String(value ?? '');
  }

  private matchesFilter(row: DataTableRow, value: string): boolean {
    if (!value) return true;
    return this.columns()
      .map((column) => this.displayValue(row, column).toLowerCase())
      .some((cell) => cell.includes(value));
  }
}
