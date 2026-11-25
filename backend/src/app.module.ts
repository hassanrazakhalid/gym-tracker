import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { FirebaseAuthGuard, Public } from './auth/auth.js';
import { FirebaseModule } from './firebase/firebase.module.js';
import { LibraryModule } from './library/library.js';
import { SessionsModule } from './sessions/sessions.js';
import { TrackingModule } from './tracking/tracking.js';
import { UsersModule } from './users/users.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Controller('health')
class HealthController {
  @Public()
  @Get()
  check() {
    return { ok: true };
  }
}

@Module({
  imports: [
    // ENV_FILE=.env.emulator selects the local emulators (npm run start:emu).
    ConfigModule.forRoot({ isGlobal: true, envFilePath: process.env.ENV_FILE ?? '.env' }),
    // Sends traces/errors to NestJS Observe once OBSERVE_APP_KEY is set; inactive until then.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    FirebaseModule,
    LibraryModule,
    UsersModule,
    SessionsModule,
    TrackingModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: FirebaseAuthGuard }],
})
export class AppModule {}
