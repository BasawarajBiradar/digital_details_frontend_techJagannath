// pie-chart.component.ts
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

// ─── Public interfaces ────────────────────────────────────────────────────────

/**
 * Shape of the backend response this component consumes.
 *
 * {
 *   totalNumberOfStudents: 1000,
 *   data: [
 *     { presentStudents: 800 },
 *     { absentStudents: 200 }
 *   ]
 * }
 *
 * The "total" key is whichever non-`data` numeric key is present at the root.
 * The `data` array can be any length with any camelCase keys.
 */
export interface PieChartApiResponse {
  [totalKey: string]: number | PieChartDataItem[];
  data: PieChartDataItem[];
}

/** One item in the data array — a single-entry object: { presentStudents: 800 } */
export interface PieChartDataItem {
  key: string;
  value: number;
}

// ─── Internal type ────────────────────────────────────────────────────────────

interface SliceConfig {
  rawKey: string;
  label: string;
  value: number;
  percentage: number;
  pathD: string;
  color: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChart implements OnChanges {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** Card heading displayed above the chart. */
  @Input() title = '';

  /**
   * Raw API response from the backend.
   * The component automatically identifies the total key and all slice keys.
   */
  @Input() apiResponse: PieChartApiResponse | null = null;

  /**
   * Color for each slice, **in the same order as `apiResponse.data`**.
   *
   * Example (student attendance):
   *   ['#2E8FE8', '#62C8FF']
   *    ↑ presentStudents   ↑ absentStudents
   *
   * Falls back to the TapAxe brand-aligned default palette if omitted or
   * if fewer colors are supplied than there are slices.
   */
  @Input() colors: string[] = [];

  // ── Derived state (rebuilt on each input change) ────────────────────────────

  totalKey = '';
  formattedTotalKey = '';
  totalValue = 0;
  slices: SliceConfig[] = [];

  /** Key of the slice the user is currently hovering. */
  hoveredKey: string | null = null;

  // ── Defaults ─────────────────────────────────────────────────────────────────

  /**
   * TapAxe-themed default palette (sky blue family + accents).
   * Used as fallback when the parent does not supply `colors`.
   */
  private readonly DEFAULT_COLORS: readonly string[] = [
    '#2E8FE8', // --color-primary  (sky blue)
    '#62C8FF', // --color-accent   (light cyan)
    '#1A6FD4', // --color-primary-dark
    '#90DAFF', // --color-accent-bright
    '#4361EE', // indigo
    '#F72585', // pink
    '#7209B7', // violet
    '#43AA8B', // teal
    '#F3722C', // orange
    '#90BE6D', // sage
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['apiResponse'] || changes['colors']) {
      this.buildSlices();
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  /** The slice currently being hovered — used by the template tooltip. */
  get hoveredSlice(): SliceConfig | null {
    return this.slices.find(s => s.rawKey === this.hoveredKey) ?? null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildSlices(): void {
    this.slices = [];

    if (!this.apiResponse) return;

    // 1. Locate the root-level numeric key (the "total" key)
    const rootKeys = Object.keys(this.apiResponse);
    const totalK   = rootKeys.find(
      k => k !== 'data' && typeof (this.apiResponse as Record<string, unknown>)[k] === 'number'
    );

    if (!totalK) return;

    this.totalKey          = totalK;
    this.formattedTotalKey = this.camelToWords(totalK);
    this.totalValue        = (this.apiResponse as Record<string, number>)[totalK];

    // 2. Flatten data array → [{key, value}]
    const items = (this.apiResponse.data ?? []).map((item: PieChartDataItem) => ({
      key: item.key,
      value: item.value
    }));

    const sum     = items.reduce((acc, i) => acc + i.value, 0) || 1;
    const palette = this.buildPalette(items.length);

    // 3. Compute SVG arc paths
    let cumAngle = -Math.PI / 2; // start at 12 o'clock

    this.slices = items.map((item, idx) => {
      const pct   = item.value / sum;
      const angle = pct * 2 * Math.PI;
      const start = cumAngle;
      const end   = cumAngle + angle;
      cumAngle    = end;

      return {
        rawKey:     item.key,
        label:      this.camelToWords(item.key),
        value:      item.value,
        percentage: pct * 100,
        pathD:      this.arcPath(start, end),
        color:      palette[idx],
      } satisfies SliceConfig;
    });
  }

  /**
   * Merge parent-supplied colors with the default palette.
   * Parent colors take priority by index; defaults fill any gaps.
   */
  private buildPalette(count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
      this.colors[i] ?? this.DEFAULT_COLORS[i % this.DEFAULT_COLORS.length]
    );
  }

  /**
   * Generate an SVG arc path for a donut slice.
   * The SVG coordinate space is a 2×2 unit square centred at (0,0).
   */
  private arcPath(startAngle: number, endAngle: number): string {
    const R = 0.90;

    // Full circle case
    if (Math.abs(endAngle - startAngle) >= (Math.PI * 2) - 0.0001) {
      return `
        M 0 ${-R}
        A ${R} ${R} 0 1 1 0 ${R}
        A ${R} ${R} 0 1 1 0 ${-R}
        Z
      `;
    }

    const x1 = Math.cos(startAngle) * R;
    const y1 = Math.sin(startAngle) * R;
    const x2 = Math.cos(endAngle) * R;
    const y2 = Math.sin(endAngle) * R;

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M 0 0
      L ${x1} ${y1}
      A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;
  }

  /**
   * Converts a camelCase key to a human-readable label.
   * "totalNumberOfStudents" → "Total Number Of Students"
   * "absentStudents"        → "Absent Students"
   */
  camelToWords(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }
}