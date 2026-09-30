import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readJwtConfig } from '../auth-config.js';
import { AuthService } from '../auth.service.js';
import type { PublicUser } from '../public-user.js';

type AccessTokenPayload = {
  sub?: unknown;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const { secret } = readJwtConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  validate(payload: AccessTokenPayload): Promise<PublicUser> {
    return this.authService.findAuthenticatedUser(payload.sub);
  }
}
