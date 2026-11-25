import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PATHS = {
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  book: 'M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14M8 7h8',
  apple:
    'M12 7.5c-1-2-3.2-3-5.2-2.3C3.8 6.3 3.6 10 4.6 13.3 5.6 16.6 8 20.5 10 20.5c1 0 1.2-.6 2-.6s1 .6 2 .6c2 0 4.4-3.9 5.4-7.2 1-3.3.8-7-2.2-8.1-2-.7-4.2.3-5.2 2.3zM12 7.5c0-2 1-4 3-4.5',
  chart: 'M3 3v18h18M7 15l4-4 3 3 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  more: 'M12 5.5h.01M12 12h.01M12 18.5h.01',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9.5 17h5',
  timer: 'M12 9v4l2.5 2M9 2h6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  'arrow-down': 'M12 5v14M6 13l6 6 6-6',
  note: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  reorder: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  split: 'M8 3H3v5M3 3l7 7M16 3h5v5M21 3l-7 7M12 13v8',
  link: 'M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5h.01',
  camera:
    'M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  scale:
    'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM7.5 10a6 6 0 0 1 9 0M12 12l2-2.5',
  flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-3.5 3.5C11 7 10 4 10 2 7 5 5 9 5 15c0 4 3 7 7 7z',
  steps:
    'M8 15c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5zM5.5 18.5a2.5 2 0 1 0 5 0M16 11c2 0 3-2 3-5s-1-4.5-3-4.5S13 3 13 6s1 5 3 5zM13.5 14.5a2.5 2 0 1 0 5 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  play: 'M7 4.5l12 7.5-12 7.5z',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4',
  clipboard: 'M9 4h6v3H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 13l2 2 4-4',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icon', 'aria-hidden': 'true' },
  template: `<svg
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="stroke()"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path [attr.d]="d()" />
  </svg>`,
  styles: `
    :host { display: inline-flex; line-height: 0; flex-shrink: 0; }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly stroke = input(2);
  protected readonly d = computed(() => PATHS[this.name()]);
}
