import { Injectable } from '@nestjs/common';
import { seedHistory } from '../demo/history.js';
import { seedBodyWeight, seedCheckIns, seedFood, seedSteps } from '../demo/tracking.js';
import { WorkoutSession } from '../domain/models.js';
import { flagPrSets } from '../domain/records.js';
import { parseIsoDate } from '../domain/util.js';
import type { AuthUser } from '../auth/auth.js';
import { UsersService } from './users.service.js';

/**
 * Replaces a user's data with about nine weeks of realistic sample history,
 * so a new account has something to look at. Dates are relative to `today`,
 * the user's own local date.
 */
@Injectable()
export class DemoDataService {
  constructor(private readonly users: UsersService) {}

  async load(user: AuthUser, today: string): Promise<void> {
    const now = parseIsoDate(today);
    const existing = await this.users.getOrCreate(user);
    await this.users.wipe(user.uid);

    const writer = this.users.doc(user.uid).firestore.bulkWriter();
    writer.set(this.users.doc(user.uid), {
      ...this.users.defaults(user, now),
      name: existing.name,
      unit: existing.unit,
      goal: this.users.demoGoal(now),
      lessonsDone: ['progressive-overload', 'rep-ranges'],
    });

    // Sessions oldest → newest so each one's PRs are judged against what came before.
    const sessions = seedHistory(now).reverse();
    const prior: WorkoutSession[] = [];
    for (const s of sessions) {
      const prSetIds = [...flagPrSets(s, prior).keys()];
      const exerciseIds = [...new Set(s.exercises.map((e) => e.exerciseId))];
      writer.set(this.users.col(user.uid, 'sessions').doc(s.id), { ...s, exerciseIds, prSetIds });
      prior.push(s);
    }

    for (const e of seedBodyWeight(now)) {
      writer.set(this.users.col(user.uid, 'bodyWeight').doc(e.date), { date: e.date, weightKg: e.weightKg });
    }
    for (const f of seedFood(now)) {
      writer.set(this.users.col(user.uid, 'foods').doc(f.id), f);
    }
    for (const c of seedCheckIns(now)) {
      writer.set(this.users.col(user.uid, 'checkIns').doc(c.date), c);
    }
    for (const s of seedSteps(now)) {
      writer.set(this.users.col(user.uid, 'steps').doc(s.date), s);
    }
    await writer.close();
  }
}
