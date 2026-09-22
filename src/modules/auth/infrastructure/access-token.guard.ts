import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedRequest { headers: { authorization?: string }; auth?: { userId: string } }

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!token || !secret) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string; type?: string }>(token, { secret });
      if (!payload.sub || payload.type !== 'access') throw new UnauthorizedException();
      request.auth = { userId: payload.sub };
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}
