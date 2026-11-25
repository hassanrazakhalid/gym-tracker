import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ChartPoint {
  x: number; // timestamp
  y: number;
}

/** Minimal line chart: one series, optional dashed target line, end-point marker. */
@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geometry(); as g) {
      <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" preserveAspectRatio="none" role="img" [attr.aria-label]="label()">
        @if (g.target !== null) {
          <line x1="0" [attr.x2]="width()" [attr.y1]="g.target" [attr.y2]="g.target" class="target" />
        }
        <path [attr.d]="g.area" class="area" />
        <path [attr.d]="g.line" class="line" vector-effect="non-scaling-stroke" />
      </svg>
      <span class="dot" [style.left.%]="g.endX" [style.top.%]="g.endY"></span>
    }
  `,
  styles: `
    :host { display: block; position: relative; height: var(--chart-h, 96px); }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .line { fill: none; stroke: var(--chart-color, var(--blue)); stroke-width: 2.25; stroke-linejoin: round; }
    .area { fill: var(--chart-color, var(--blue)); opacity: 0.08; }
    .target { stroke: var(--ink-3); stroke-width: 1; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
    .dot {
      position: absolute; width: 9px; height: 9px; border-radius: 50%;
      background: var(--chart-color, var(--blue)); border: 2px solid var(--surface);
      transform: translate(-50%, -50%);
    }
  `,
})
export class LineChart {
  readonly points = input.required<ChartPoint[]>();
  readonly target = input<number | null>(null);
  readonly label = input('Trend');
  readonly width = input(300);
  readonly height = input(100);

  protected readonly geometry = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return null;
    const w = this.width();
    const h = this.height();
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const t = this.target();
    const minY = Math.min(...ys, t ?? Infinity);
    const maxY = Math.max(...ys, t ?? -Infinity);
    const padY = (maxY - minY) * 0.12 || 1;
    const lo = minY - padY;
    const hi = maxY + padY;
    const minX = Math.min(...xs);
    const spanX = Math.max(...xs) - minX || 1;
    const sx = (x: number) => ((x - minX) / spanX) * w;
    const sy = (y: number) => h - ((y - lo) / (hi - lo)) * h;
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
    const area = `${line}L${w},${h}L0,${h}Z`;
    const last = pts[pts.length - 1];
    return {
      line,
      area,
      target: t === null ? null : sy(t),
      endX: (sx(last.x) / w) * 100,
      endY: (sy(last.y) / h) * 100,
    };
  });
}
