import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UNAUTHENTICATED_MESSAGE } from '../auth.constants.js';
import type { PublicUser } from '../public-user.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser => {
    const request = context.switchToHttp().getRequest<{ user?: PublicUser }>();

    if (!request.user) {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }

    return request.user;
  },
);
