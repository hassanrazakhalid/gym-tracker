import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { Public } from '../auth/auth.js';
import { Exercise, Lesson, Routine } from '../domain/models.js';
import { EXERCISES } from './data/exercises.js';
import { LESSONS } from './data/lessons.js';
import { mediaFor } from './data/media.js';
import { ROUTINES, WEEK_PLAN } from './data/routines.js';

/** Built-in content shared by every user: exercise library, starter routines, lessons. */
@Injectable()
export class LibraryService {
  readonly exercises: Exercise[] = EXERCISES.map(({ startLb: _startLb, ...e }) => ({ ...e, media: mediaFor(e.id) }));
  readonly routines: Routine[] = ROUTINES;
  readonly lessons: Lesson[] = LESSONS;
  readonly defaultWeekPlan: (string | null)[] = WEEK_PLAN;

  private readonly exerciseIds = new Set(this.exercises.map((e) => e.id));
  private readonly lessonIds = new Set(this.lessons.map((l) => l.id));

  isExercise(id: string): boolean {
    return this.exerciseIds.has(id);
  }

  isLesson(id: string): boolean {
    return this.lessonIds.has(id);
  }

  defaultRoutine(id: string): Routine | undefined {
    return this.routines.find((r) => r.id === id);
  }
}

@Controller('library')
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  /** Everything the app needs to render before sign-in. Cacheable. */
  @Public()
  @Get()
  get() {
    return {
      exercises: this.library.exercises,
      routines: this.library.routines,
      lessons: this.library.lessons,
      defaultWeekPlan: this.library.defaultWeekPlan,
    };
  }
}

@Module({
  providers: [LibraryService],
  controllers: [LibraryController],
  exports: [LibraryService],
})
export class LibraryModule {}
