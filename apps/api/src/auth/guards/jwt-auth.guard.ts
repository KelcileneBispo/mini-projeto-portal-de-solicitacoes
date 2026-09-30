import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UNAUTHENTICATED_MESSAGE } from '../auth.constants.js';
import type { PublicUser } from '../public-user.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser extends PublicUser>(
    error: unknown,
    user: TUser | false | null | undefined,
  ): TUser {
    if (error || !user) {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }

    return user;
  }
}
