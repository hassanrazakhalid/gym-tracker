import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Food, Meal } from '../../core/models';
import { FOODS } from '../../core/content/foods';
import { BodyWeightService, GoalService, NutritionService } from '../../core/services/tracking.service';
import { addDays, isoDate, parseIsoDate, relativeDay } from '../../core/util';
import { Icon } from '../../shared/icon';
import { Sheet } from '../../shared/sheet';
import { CheckInSheet } from '../tracking/check-in-sheet';

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

@Component({
  selector: 'app-nutrition-page',
  imports: [Icon, Sheet, CheckInSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrition-page.html',
  styleUrl: './nutrition-page.scss',
})
export class NutritionPage {
  protected readonly nutrition = inject(NutritionService);
  private readonly goals = inject(GoalService);
  private readonly weights = inject(BodyWeightService);

  protected readonly meals = MEALS;
  protected readonly date = signal(isoDate());
  protected readonly addTo = signal<Meal | null>(null);
  protected readonly query = signal('');
  protected readonly custom = signal({ name: '', calories: '', protein: '' });
  protected readonly checkInOpen = signal(false);

  protected readonly isToday = computed(() => this.date() === isoDate());
  protected readonly dayLabel = computed(() => {
    const r = relativeDay(this.date());
    if (r === 'today' || r === 'yesterday') return r.charAt(0).toUpperCase() + r.slice(1);
    return parseIsoDate(this.date()).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  });

  protected readonly target = computed(() => this.goals.goal().dailyCalories);
  /** About 1.8 g per kg of body weight. */
  protected readonly proteinTarget = computed(() => Math.round((this.weights.latest()?.weightKg ?? 80) * 1.8));
  protected readonly totals = computed(() => this.nutrition.totals(this.date()));
  protected readonly remaining = computed(() => this.target() - this.totals().calories);
  protected readonly calPct = computed(() => Math.min(100, (this.totals().calories / this.target()) * 100));
  protected readonly proteinPct = computed(() => Math.min(100, (this.totals().proteinG / this.proteinTarget()) * 100));

  protected readonly byMeal = computed(() => {
    const entries = this.nutrition.forDate(this.date());
    return MEALS.map((meal) => {
      const items = entries.filter((e) => e.meal === meal);
      return { meal, items, calories: items.reduce((t, e) => t + e.calories, 0) };
    });
  });

  protected readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? FOODS.filter((f) => f.name.toLowerCase().includes(q)) : FOODS;
  });

  protected shiftDay(delta: number): void {
    const next = isoDate(addDays(parseIsoDate(this.date()), delta));
    if (next <= isoDate()) this.date.set(next);
  }

  protected openAdd(meal: Meal): void {
    this.query.set('');
    this.custom.set({ name: '', calories: '', protein: '' });
    this.addTo.set(meal);
  }

  protected addFood(f: Food): void {
    const meal = this.addTo();
    if (!meal) return;
    this.nutrition.add(this.date(), meal, f.name, f.calories, f.proteinG);
    this.addTo.set(null);
  }

  protected setCustom(field: 'name' | 'calories' | 'protein', value: string): void {
    this.custom.update((c) => ({ ...c, [field]: value }));
  }

  protected readonly customValid = computed(() => {
    const c = this.custom();
    return c.name.trim().length > 0 && Number(c.calories) > 0;
  });

  protected addCustom(e: Event): void {
    e.preventDefault();
    const c = this.custom();
    const meal = this.addTo();
    if (!meal || !this.customValid()) return;
    this.nutrition.add(this.date(), meal, c.name.trim(), Math.round(Number(c.calories)), Math.round(Number(c.protein) || 0));
    this.addTo.set(null);
  }
}
