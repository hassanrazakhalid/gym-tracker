import { Body, Controller, Delete, Get, HttpCode, Module, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../auth/auth.js';
import {
  bodyWeightSchema,
  checkInSchema,
  dateSchema,
  foodSchema,
  idSchema,
  photoSchema,
  sinceQuerySchema,
  stepsSchema,
  type FoodDto,
} from '../domain/schemas.js';
import { uid as newId } from '../domain/util.js';
import { UsersModule } from '../users/users.js';
import { UsersService, type UserCollection } from '../users/users.service.js';

type Since = z.infer<typeof sinceQuerySchema>;

/**
 * Daily tracking: body weight, food log, nutrition check-ins, steps and progress
 * photos. Per-day entries use the date (yyyy-mm-dd, the user's local date) as id.
 */
@Controller()
export class TrackingController {
  constructor(private readonly users: UsersService) {}

  private async listByDate(uid: string, col: UserCollection, since?: string) {
    let q = this.users.col(uid, col).orderBy('date', 'desc');
    if (since) q = q.where('date', '>=', since);
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // ---------------------------------------------------------------- body weight

  @Get('body-weight')
  async bodyWeight(@CurrentUser() u: AuthUser, @Query({ schema: sinceQuerySchema }) q: Since) {
    return { entries: await this.listByDate(u.uid, 'bodyWeight', q.since) };
  }

  @Put('body-weight/:date')
  async logWeight(
    @CurrentUser() u: AuthUser,
    @Param('date', { schema: dateSchema }) date: string,
    @Body({ schema: bodyWeightSchema }) body: z.infer<typeof bodyWeightSchema>,
  ) {
    const entry = { date, weightKg: body.weightKg };
    await this.users.col(u.uid, 'bodyWeight').doc(date).set(entry);
    return { entry: { id: date, ...entry } };
  }

  @Delete('body-weight/:date')
  @HttpCode(204)
  async deleteWeight(@CurrentUser() u: AuthUser, @Param('date', { schema: dateSchema }) date: string) {
    await this.users.col(u.uid, 'bodyWeight').doc(date).delete();
  }

  // ---------------------------------------------------------------- food

  @Get('foods')
  async foods(@CurrentUser() u: AuthUser, @Query({ schema: sinceQuerySchema }) q: Since) {
    return { entries: await this.listByDate(u.uid, 'foods', q.since) };
  }

  @Post('foods')
  async addFood(@CurrentUser() u: AuthUser, @Body({ schema: foodSchema }) body: FoodDto) {
    const id = newId('food');
    await this.users.col(u.uid, 'foods').doc(id).set({ id, ...body });
    return { entry: { id, ...body } };
  }

  @Delete('foods/:id')
  @HttpCode(204)
  async deleteFood(@CurrentUser() u: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    await this.users.col(u.uid, 'foods').doc(id).delete();
  }

  // ---------------------------------------------------------------- check-ins

  @Get('check-ins')
  async checkIns(@CurrentUser() u: AuthUser, @Query({ schema: sinceQuerySchema }) q: Since) {
    return { entries: await this.listByDate(u.uid, 'checkIns', q.since) };
  }

  @Put('check-ins/:date')
  async checkIn(
    @CurrentUser() u: AuthUser,
    @Param('date', { schema: dateSchema }) date: string,
    @Body({ schema: checkInSchema }) body: z.infer<typeof checkInSchema>,
  ) {
    const entry = { date, ...body };
    await this.users.col(u.uid, 'checkIns').doc(date).set(entry);
    return { entry };
  }

  // ---------------------------------------------------------------- steps

  @Get('steps')
  async steps(@CurrentUser() u: AuthUser, @Query({ schema: sinceQuerySchema }) q: Since) {
    return { entries: await this.listByDate(u.uid, 'steps', q.since) };
  }

  @Put('steps/:date')
  async setSteps(
    @CurrentUser() u: AuthUser,
    @Param('date', { schema: dateSchema }) date: string,
    @Body({ schema: stepsSchema }) body: z.infer<typeof stepsSchema>,
  ) {
    const entry = { date, steps: body.steps };
    await this.users.col(u.uid, 'steps').doc(date).set(entry);
    return { entry };
  }

  // ---------------------------------------------------------------- photos

  @Get('photos')
  async photos(@CurrentUser() u: AuthUser) {
    return { photos: await this.listByDate(u.uid, 'photos') };
  }

  @Post('photos')
  async addPhoto(@CurrentUser() u: AuthUser, @Body({ schema: photoSchema }) body: z.infer<typeof photoSchema>) {
    const id = newId('photo');
    await this.users.col(u.uid, 'photos').doc(id).set({ id, ...body });
    return { photo: { id, ...body } };
  }

  @Delete('photos/:id')
  @HttpCode(204)
  async deletePhoto(@CurrentUser() u: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    await this.users.col(u.uid, 'photos').doc(id).delete();
  }
}

@Module({
  imports: [UsersModule],
  controllers: [TrackingController],
})
export class TrackingModule {}
