import {
  BodyWeightEntry,
  Food,
  FoodEntry,
  Goal,
  Meal,
  NutritionCheckIn,
  StepEntry,
} from '../domain/models.js';
import { addDays, isoDate, LB_PER_KG, seededRandom, uid } from '../domain/util.js';

const DAYS = 70;

export function seedBodyWeight(today = new Date()): BodyWeightEntry[] {
  const rand = seededRandom(7);
  const entries: BodyWeightEntry[] = [];
  for (let i = DAYS; i >= 1; i--) {
    if (rand() < 0.22) continue; // missed days
    const trendLb = 196.4 - (DAYS - i) * 0.12;
    const noise = (rand() - 0.5) * 1.8;
    entries.push({
      id: uid('bw'),
      date: isoDate(addDays(today, -i)),
      weightKg: (trendLb + noise) / LB_PER_KG,
    });
  }
  return entries.reverse(); // newest first
}

export function seedGoal(today = new Date()): Goal {
  return {
    type: 'lose-fat',
    pace: 'moderate',
    weeklyRateKg: -1 / LB_PER_KG,
    startDate: isoDate(addDays(today, -DAYS)),
    startingWeightKg: 196.4 / LB_PER_KG,
    dailyCalories: 2250,
  };
}

export const FOODS: Food[] = [
  { name: 'Greek yogurt, plain 0%', serving: '200 g', calories: 118, proteinG: 20 },
  { name: 'Oats', serving: '60 g', calories: 228, proteinG: 8 },
  { name: 'Banana', serving: '1 medium', calories: 105, proteinG: 1 },
  { name: 'Eggs', serving: '3 large', calories: 216, proteinG: 19 },
  { name: 'Whole-grain toast', serving: '2 slices', calories: 180, proteinG: 8 },
  { name: 'Chicken breast, grilled', serving: '200 g', calories: 330, proteinG: 62 },
  { name: 'White rice, cooked', serving: '200 g', calories: 260, proteinG: 5 },
  { name: 'Salmon fillet', serving: '150 g', calories: 312, proteinG: 33 },
  { name: 'Sweet potato', serving: '200 g', calories: 172, proteinG: 3 },
  { name: 'Broccoli', serving: '150 g', calories: 51, proteinG: 4 },
  { name: 'Lean beef mince', serving: '150 g', calories: 263, proteinG: 39 },
  { name: 'Whey protein shake', serving: '1 scoop', calories: 120, proteinG: 24 },
  { name: 'Almonds', serving: '30 g', calories: 174, proteinG: 6 },
  { name: 'Apple', serving: '1 medium', calories: 95, proteinG: 0 },
  { name: 'Cottage cheese', serving: '200 g', calories: 196, proteinG: 24 },
  { name: 'Lentil soup', serving: '1 bowl', calories: 230, proteinG: 14 },
  { name: 'Tuna wrap', serving: '1 wrap', calories: 410, proteinG: 32 },
  { name: 'Mixed salad with olive oil', serving: '1 bowl', calories: 160, proteinG: 3 },
];

const DAY_TEMPLATES: [Meal, string][][] = [
  [
    ['Breakfast', 'Oats'], ['Breakfast', 'Whey protein shake'], ['Breakfast', 'Banana'],
    ['Lunch', 'Chicken breast, grilled'], ['Lunch', 'White rice, cooked'], ['Lunch', 'Broccoli'],
    ['Snacks', 'Greek yogurt, plain 0%'], ['Snacks', 'Almonds'],
    ['Dinner', 'Salmon fillet'], ['Dinner', 'Sweet potato'], ['Dinner', 'Mixed salad with olive oil'],
  ],
  [
    ['Breakfast', 'Eggs'], ['Breakfast', 'Whole-grain toast'],
    ['Lunch', 'Tuna wrap'], ['Lunch', 'Apple'],
    ['Snacks', 'Cottage cheese'],
    ['Dinner', 'Lean beef mince'], ['Dinner', 'White rice, cooked'], ['Dinner', 'Broccoli'],
  ],
];

export function seedFood(today = new Date()): FoodEntry[] {
  const rand = seededRandom(11);
  const entries: FoodEntry[] = [];
  const add = (date: string, meal: Meal, name: string) => {
    const f = FOODS.find((x) => x.name === name)!;
    entries.push({ id: uid('food'), date, meal, name: f.name, calories: f.calories, proteinG: f.proteinG });
  };
  for (let i = 1; i <= 14; i++) {
    if (rand() < 0.3) continue;
    const date = isoDate(addDays(today, -i));
    DAY_TEMPLATES[Math.floor(rand() * DAY_TEMPLATES.length)].forEach(([meal, name]) => add(date, meal, name));
  }
  const t = isoDate(today);
  add(t, 'Breakfast', 'Greek yogurt, plain 0%');
  add(t, 'Breakfast', 'Oats');
  add(t, 'Breakfast', 'Banana');
  return entries;
}

export function seedCheckIns(today = new Date()): NutritionCheckIn[] {
  const rand = seededRandom(3);
  const list: NutritionCheckIn[] = [];
  for (let i = 1; i <= 14; i++) {
    if (rand() < 0.35) continue;
    list.push({
      date: isoDate(addDays(today, -i)),
      hunger: (2 + Math.floor(rand() * 3)) as 2 | 3 | 4,
      energy: (2 + Math.floor(rand() * 4)) as 2 | 3 | 4 | 5,
      onPlan: rand() < 0.75,
    });
  }
  return list;
}

export function seedSteps(today = new Date()): StepEntry[] {
  const rand = seededRandom(19);
  const list: StepEntry[] = [{ date: isoDate(today), steps: 6240 }];
  for (let i = 1; i <= 30; i++) {
    list.push({ date: isoDate(addDays(today, -i)), steps: 5200 + Math.floor(rand() * 7800) });
  }
  return list;
}
