import { NextFunction, Request, Response } from 'express';

export class ErrorHandlerMiddleware {
  use(error: unknown, _req: Request, res: Response, next: NextFunction) {
    if (!error) {
      next();
      return;
    }

    const err = error as { status?: number; message?: string; response?: unknown };
    const status = err.status || 500;
    res.status(status).json({
      code: status,
      message: err.message || 'Internal server error',
      details: err.response || null
    });
  }
}
