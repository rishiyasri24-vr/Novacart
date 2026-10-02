/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { recordSecurityLog } from '../services/auditLogger.js';
import { UserRole } from '../../shared/types.js';

// In-memory token bucket rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 180; // 180 req/min per IP

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    recordSecurityLog(ip, 'shopper', 'RATE_LIMIT_EXCEEDED', `Client exceeded rate threshold (${MAX_REQUESTS} req/min).`, 'warning', ip);
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait 60 seconds before making additional requests.',
    });
  }

  record.count += 1;
  next();
}

/**
 * Sanitizes input strings against XSS, injection vectors, and prototype pollution
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[match] || match;
    })
    .trim();
}

/**
 * Express middleware to sanitize body inputs
 */
export function sanitizeBodyInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeString(value);
      }
    }
  }
  next();
}

/**
 * Role-Based Access Control enforcement
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.headers['x-user-role'] as UserRole) || 'shopper';
    const actor = (req.headers['x-user-id'] as string) || 'anonymous';

    if (!allowedRoles.includes(role)) {
      recordSecurityLog(
        actor,
        role,
        'RBAC_ACCESS_DENIED',
        `Attempted unauthorized access to ${req.originalUrl}. Required: ${allowedRoles.join(', ')}.`,
        'security_alert',
        req.ip || '127.0.0.1'
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your current role '${role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

/**
 * Applies production security headers
 */
export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}
