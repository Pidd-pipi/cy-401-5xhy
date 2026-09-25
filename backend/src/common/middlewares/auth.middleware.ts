import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request & { user?: unknown }, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (token) {
      try {
        req.user = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'dev_secret'
        });
      } catch {
        req.user = undefined;
      }
    }

    next();
  }
}
