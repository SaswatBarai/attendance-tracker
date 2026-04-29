import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Role } from '@attendance-tracker/shared-types';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../src/lib/prisma.js', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

vi.mock('../src/utils/password.util.js', () => ({
  comparePassword: vi.fn(),
}));

vi.mock('../src/utils/jwt.util.js', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/jwt.util.js')>(
    '../src/utils/jwt.util.js'
  );

  return {
    ...actual,
    buildTokenPair: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
});

import { authRouter } from '../src/routes/auth.routes.js';
import { comparePassword } from '../src/utils/password.util.js';
import { buildTokenPair, verifyRefreshToken, signAccessToken } from '../src/utils/jwt.util.js';

describe('auth routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in and returns token pair plus user payload', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      password: 'hashed-password',
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    });
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(buildTokenPair).mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Password@123' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.accessToken).toBe('access-token');
    expect(payload.data.refreshToken).toBe('refresh-token');
    expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
  });

  it('refreshes tokens and rotates the old refresh token', async () => {
    vi.mocked(verifyRefreshToken).mockReturnValue({ sub: 'user-1' });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      token: 'refresh-token',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      isActive: true,
    });
    prismaMock.refreshToken.update.mockResolvedValue({});
    prismaMock.refreshToken.create.mockResolvedValue({});
    vi.mocked(buildTokenPair).mockReturnValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.accessToken).toBe('new-access-token');
    expect(prismaMock.refreshToken.update).toHaveBeenCalledOnce();
    expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
  });

  it('returns the current user for /me when authenticated', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'mentor@example.com',
      name: 'Mentor User',
      role: 'MENTOR',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const token = signAccessToken({
      sub: 'user-1',
      email: 'mentor@example.com',
      role: Role.MENTOR,
    });

    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.email).toBe('mentor@example.com');
  });

  it('revokes the refresh token on logout when provided', async () => {
    prismaMock.refreshToken.update.mockResolvedValue({});

    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.refreshToken.update).toHaveBeenCalledOnce();
  });
});
