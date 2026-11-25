import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Auth } from 'firebase-admin/auth';
import type { Request } from 'express';
import { FIREBASE_AUTH } from '../firebase/firebase.module.js';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
}

type AuthedRequest = Request & { user?: AuthUser };

const IS_PUBLIC = 'isPublic';

/** Marks a route (or controller) as reachable without signing in. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in user, set by FirebaseAuthGuard. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
  if (!user) throw new UnauthorizedException();
  return user;
});

/**
 * Global guard: every request needs `Authorization: Bearer <Firebase ID token>`
 * unless the route is @Public(). All data is then scoped to that user's uid.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Sign in to continue.');

    try {
      const decoded = await this.auth.verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email ?? null, name: (decoded['name'] as string) ?? null };
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired. Sign in again.');
    }
  }
}
