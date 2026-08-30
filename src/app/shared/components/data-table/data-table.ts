import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

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
  link?: string | readonly string[];
  visible?: boolean;
}

export interface DataTableApiResponse {
  data?: readonly DataTableRow[] | null;
  [key: string]: unknown;
}

@Component({
  selector: 'app-data-table',
  imports: [
    MatAnchor,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
    NgClass,
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
  readonly headerAction = input<DataTableAction | null>(null);
  readonly headerActionTriggered = output<void>();
  readonly action = input<DataTableAction | null>(null);
  readonly actionTriggered = output<DataTableRow>();
  readonly rowClassName = input<((row: DataTableRow) => string | undefined) | null>(null);

  readonly displayedColumnKeys = computed(() => [
    ...this.columns().map((column) => column.key),
    ...(this.action() ? ['actions'] : []),
  ]);
  readonly dataSource = new MatTableDataSource<DataTableRow>([]);
  readonly sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      this.dataSource.data = this.getRows(this.apiResponse());
      this.dataSource.sortingDataAccessor = (row, columnKey) =>
        this.getCellValue(row, columnKey);

      const sort = this.sort();
      if (sort) this.dataSource.sort = sort;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort() ?? null;
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
}