import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@attendance-tracker/shared-types';

const ACCESS_SECRET = process.env['JWT_SECRET']!;

if (!ACCESS_SECRET) {
  throw new Error('JWT_SECRET must be set in environment');
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}
