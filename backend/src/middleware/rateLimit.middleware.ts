import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { SendCommandFn } from 'rate-limit-redis';
import redisClient from '../config/redis';
import { Request } from 'express';

// General API Limiter
// Protects all routes: 100 req per 15 min per IP

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// OTP Request Limiter
// Protects POST /auth/register/initiate and /resend
// Limit: 3 OTP requests per hour — keyed by IP + email (dual key)
// Stored in Redis → scales across multiple server instances

export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,

  // Key = IP + email — prevents:
  //   (a) same person spamming their own email
  //   (b) one IP burning rate limit for many emails
  // ipKeyGenerator normalizes IPv4-mapped IPv6 (e.g. ::ffff:1.2.3.4 → 1.2.3.4)
  keyGenerator: (req: Request): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip = ipKeyGenerator(req as any);
    const emailField = req.body?.email || req.body?.newEmail;
    const email = (emailField as string | undefined)?.toLowerCase().trim() ?? 'unknown';
    return `otp_req:${ip}:${email}`;
  },

  store: new RedisStore({
    // Cast needed: ioredis call() return type is wider than rate-limit-redis expects
    sendCommand: ((...args: Parameters<SendCommandFn>) =>
      redisClient.call(...(args as [string, ...string[]]))
    ) as SendCommandFn,
    prefix: 'rl:otp_request:',
  }),

  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 1 hour before trying again.',
  },

  // Skip rate limit if Redis fails — fail open (availability > security for UX)
  // Change to false if you prefer fail closed (blocks all on Redis down)
  skipFailedRequests: false,
});

// Search API Limiter
// Protects GET /api/public/notes/search
// Limit: 30 requests per minute per IP — prevents DoS attacks on expensive Atlas Search queries

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: ((...args: Parameters<SendCommandFn>) =>
      redisClient.call(...(args as [string, ...string[]]))
    ) as SendCommandFn,
    prefix: 'rl:search:',
  }),
  message: {
    success: false,
    message: 'Too many search requests. Please slow down and try again.',
  },
  skipFailedRequests: false,
});