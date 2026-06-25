import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiResponse } from '../types'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
    }
    return res.status(400).json(response)
  }

  // Known app errors
  if (err instanceof AppError) {
    const response: ApiResponse = { success: false, error: err.message }
    return res.status(err.statusCode).json(response)
  }

  // Unknown errors
  console.error('[Error]', err)
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  }
  return res.status(500).json(response)
}

// Wrap async route handlers — no try/catch in every route
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
