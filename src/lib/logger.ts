/**
 * Structured logger for AdsPulse.
 *
 * In production, `error` and `warn` calls are forwarded to Sentry in addition
 * to the console so that all issues appear in the error-tracking dashboard.
 * Other levels are console-only (no PII is sent to Sentry).
 *
 * Log retention: Sentry retains errors for 90 days on the free tier; server
 * console logs are retained according to the hosting platform's policy.
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, ctx?: LogContext): string {
  const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  return ctx && Object.keys(ctx).length ? `${base} ${JSON.stringify(ctx)}` : base;
}

function toSentryLevel(level: 'warn' | 'error'): Sentry.SeverityLevel {
  return level === 'error' ? 'error' : 'warning';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug(message: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, ctx));
    }
  },

  info(message: string, ctx?: LogContext): void {
    console.info(formatMessage('info', message, ctx));
  },

  warn(message: string, ctx?: LogContext): void {
    console.warn(formatMessage('warn', message, ctx));
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, {
        level: toSentryLevel('warn'),
        extra: ctx,
      });
    }
  },

  error(message: string, error?: unknown, ctx?: LogContext): void {
    console.error(formatMessage('error', message, ctx), error ?? '');
    if (process.env.NODE_ENV === 'production') {
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message, ...ctx } });
      } else {
        Sentry.captureMessage(message, {
          level: toSentryLevel('error'),
          extra: { cause: error, ...ctx },
        });
      }
    }
  },
} as const;
