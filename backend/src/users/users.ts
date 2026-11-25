import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../auth/auth.js';
import { Routine } from '../domain/models.js';
import {
  demoDataSchema,
  goalSchema,
  idSchema,
  lessonsSchema,
  profilePatchSchema,
  routineSchema,
  weekPlanSchema,
  type ProfilePatchDto,
  type RoutineDto,
} from '../domain/schemas.js';
import { LibraryModule, LibraryService } from '../library/library.js';
import { DemoDataService } from './demo-data.service.js';
import { UsersService } from './users.service.js';

@Controller('me')
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly library: LibraryService,
    private readonly demo: DemoDataService,
  ) {}

  /** Profile, weekly plan, goal and lesson progress. Created on first call. */
  @Get()
  async get(@CurrentUser() user: AuthUser) {
    const doc = await this.users.getOrCreate(user);
    return { uid: user.uid, email: user.email, ...doc };
  }

  @Patch()
  async patch(@CurrentUser() user: AuthUser, @Body({ schema: profilePatchSchema }) body: ProfilePatchDto) {
    await this.users.getOrCreate(user);
    await this.users.update(user.uid, body);
    return this.get(user);
  }

  /** Routine id (or null for rest) per weekday, Sunday first. */
  @Put('plan')
  async plan(@CurrentUser() user: AuthUser, @Body({ schema: weekPlanSchema }) body: z.infer<typeof weekPlanSchema>) {
    const unknown = body.week.filter((id): id is string => id !== null && !this.library.defaultRoutine(id));
    if (unknown.length) throw new BadRequestException(`Unknown routine: ${unknown.join(', ')}`);
    await this.users.getOrCreate(user);
    await this.users.update(user.uid, { weekPlan: body.week });
    return { weekPlan: body.week };
  }

  @Put('goal')
  async goal(@CurrentUser() user: AuthUser, @Body({ schema: goalSchema }) body: z.infer<typeof goalSchema>) {
    await this.users.getOrCreate(user);
    await this.users.update(user.uid, { goal: body });
    return { goal: body };
  }

  @Put('lessons')
  async lessons(@CurrentUser() user: AuthUser, @Body({ schema: lessonsSchema }) body: z.infer<typeof lessonsSchema>) {
    const unknown = body.completed.filter((id) => !this.library.isLesson(id));
    if (unknown.length) throw new BadRequestException(`Unknown lesson: ${unknown.join(', ')}`);
    await this.users.getOrCreate(user);
    await this.users.update(user.uid, { lessonsDone: [...new Set(body.completed)] });
    return { lessonsDone: body.completed };
  }

  /** Replaces all of this user's data with sample history. */
  @Post('demo-data')
  @HttpCode(204)
  async demoData(@CurrentUser() user: AuthUser, @Body({ schema: demoDataSchema }) body: z.infer<typeof demoDataSchema>) {
    await this.demo.load(user, body.today);
  }

  /** Deletes everything stored for this user. The account itself stays. */
  @Delete('data')
  @HttpCode(204)
  async wipe(@CurrentUser() user: AuthUser) {
    await this.users.wipe(user.uid);
  }
}

/**
 * Routines start as the built-in ones. A user's edits (e.g. swapped exercises)
 * are stored as their own copy and override the built-in version.
 */
@Controller('routines')
export class RoutinesController {
  constructor(
    private readonly users: UsersService,
    private readonly library: LibraryService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const snap = await this.users.col(user.uid, 'routines').get();
    const custom = new Map(snap.docs.map((d) => [d.id, d.data() as Routine]));
    return {
      routines: this.library.routines.map((r) => custom.get(r.id) ?? r),
      customized: [...custom.keys()],
    };
  }

  @Put(':id')
  async put(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: routineSchema }) body: RoutineDto,
  ) {
    if (body.id !== id) throw new BadRequestException('The routine id in the body must match the URL.');
    if (!this.library.defaultRoutine(id)) throw new BadRequestException(`Unknown routine: ${id}`);
    const unknown = body.blocks.flatMap((b) => b.exercises).filter((e) => !this.library.isExercise(e.exerciseId));
    if (unknown.length) throw new BadRequestException(`Unknown exercise: ${unknown.map((e) => e.exerciseId).join(', ')}`);
    await this.users.col(user.uid, 'routines').doc(id).set(body);
    return { routine: body };
  }

  /** Restores the built-in version. */
  @Delete(':id')
  async restore(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    await this.users.col(user.uid, 'routines').doc(id).delete();
    return { routine: this.library.defaultRoutine(id) ?? null };
  }
}

@Module({
  imports: [LibraryModule],
  providers: [UsersService, DemoDataService],
  controllers: [MeController, RoutinesController],
  exports: [UsersService],
})
export class UsersModule {}
