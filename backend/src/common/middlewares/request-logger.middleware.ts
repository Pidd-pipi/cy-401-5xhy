import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { OperationLog } from '../../utils/operation-log.entity';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  use(req: Request & { user?: { sub?: string } }, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      if (req.path === '/health') {
        return;
      }

      const repository = this.dataSource.getRepository(OperationLog);
      const log = repository.create({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: req.user?.sub || null
      });
      repository.save(log).catch(() => undefined);
    });

    next();
  }
}
