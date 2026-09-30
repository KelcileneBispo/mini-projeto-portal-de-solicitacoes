import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { readJwtConfig, type JwtConfig } from './auth-config.js';
import {
  INVALID_CREDENTIALS_MESSAGE,
  UNAUTHENTICATED_MESSAGE,
} from './auth.constants.js';
import type { LoginDto } from './dto/login.dto.js';
import { hashPassword, verifyPassword } from './password.js';
import type { LoginResponse, PublicUser } from './public-user.js';

type StoredCredential = {
  id: number;
  username: string;
  name: string;
  passwordHash: string;
};

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtConfig = readJwtConfig();
    this.dummyHash = hashPassword(randomBytes(32).toString('hex'));
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const username = dto.username.trim().toLowerCase();
    const user = await this.prisma.client.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        passwordHash: true,
      },
    });
    const passwordMatches = await this.passwordMatches(
      dto.password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(user.id),
      username: user.username,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtConfig.expiresInSeconds,
      user: toPublicUser(user),
    };
  }

  async findAuthenticatedUser(subject: unknown): Promise<PublicUser> {
    if (typeof subject !== 'string' || !/^[1-9]\d*$/.test(subject)) {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }

    const id = Number(subject);

    if (!Number.isSafeInteger(id)) {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(UNAUTHENTICATED_MESSAGE);
    }

    return toPublicUser(user);
  }

  private async passwordMatches(
    password: string,
    passwordHash: string | undefined,
  ): Promise<boolean> {
    const hash = passwordHash ?? (await this.dummyHash);

    try {
      return await verifyPassword(password, hash);
    } catch {
      return false;
    }
  }
}

function toPublicUser(user: StoredCredential | PublicUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
  };
}
