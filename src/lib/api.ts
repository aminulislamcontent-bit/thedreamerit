// Standardized API response helpers
import { NextResponse } from 'next/server';

export function ok<T>(data: T, status: number = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(code: string, message: string, status: number = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export function unauthorized(message: string = 'Unauthorized') {
  return err('UNAUTHORIZED', message, 401);
}

export function forbidden(message: string = 'Forbidden') {
  return err('FORBIDDEN', message, 403);
}

export function notFound(message: string = 'Not found') {
  return err('NOT_FOUND', message, 404);
}

export function badRequest(message: string, details?: unknown) {
  return err('BAD_REQUEST', message, 400, details);
}

export function conflict(message: string, details?: unknown) {
  return err('CONFLICT', message, 409, details);
}

// Wrap an async handler with consistent error handling
export function apiHandler(
  handler: (req: Request, ctx: any) => Promise<NextResponse>
) {
  return async (req: Request, ctx: any): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (e: any) {
      if (e?.message === 'UNAUTHORIZED') return unauthorized();
      if (e?.message === 'FORBIDDEN') return forbidden();
      console.error('API error:', e);
      return err('INTERNAL_ERROR', e?.message || 'Internal server error', 500);
    }
  };
}

// Get client IP from request (for audit logging)
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  return real || undefined;
}

export function getUserAgent(req: Request): string | undefined {
  return req.headers.get('user-agent') || undefined;
}
