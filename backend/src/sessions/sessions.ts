import { Body, Controller, Delete, Get, HttpCode, Module, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../auth/auth.js';
import { idSchema, sessionSchema, type SessionDto } from '../domain/schemas.js';
import { LibraryModule } from '../library/library.js';
import { UsersModule } from '../users/users.js';
import { SessionsService } from './sessions.service.js';

const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(1000).default(500) });

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  /** The workout in progress, or null. */
  @Get('active')
  async getActive(@CurrentUser() user: AuthUser) {
    return { session: await this.sessions.getActive(user.uid) };
  }

  /** Saves the workout in progress. The app sends the whole session as it changes. */
  @Put('active')
  async putActive(@CurrentUser() user: AuthUser, @Body({ schema: sessionSchema }) body: SessionDto) {
    return { session: await this.sessions.putActive(user.uid, body) };
  }

  /** Discards the workout in progress without saving anything. */
  @Delete('active')
  @HttpCode(204)
  async discard(@CurrentUser() user: AuthUser) {
    await this.sessions.discardActive(user.uid);
  }

  /**
   * Finishes a workout: saves its completed sets to history, works out PRs and
   * clears the active workout. `session` is null when nothing was logged.
   */
  @Post()
  async finish(@CurrentUser() user: AuthUser, @Body({ schema: sessionSchema }) body: SessionDto) {
    return { session: await this.sessions.finish(user.uid, body) };
  }

  /** Finished workouts, newest first. */
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query({ schema: listQuerySchema }) q: z.infer<typeof listQuerySchema>) {
    return { sessions: await this.sessions.list(user.uid, q.limit) };
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    return { session: await this.sessions.get(user.uid, id) };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    await this.sessions.remove(user.uid, id);
  }
}

@Module({
  imports: [UsersModule, LibraryModule],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
