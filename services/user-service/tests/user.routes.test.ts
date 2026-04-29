import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Role } from '@attendance-tracker/shared-types';

const prismaMock = {
  cohort: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  admin: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  mentor: {
    count: vi.fn(),
  },
  student: {
    count: vi.fn(),
  },
  user: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../src/lib/prisma.js', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

vi.mock('../src/middleware/auth.middleware.js', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { sub: 'super-admin-1', email: 'super@example.com', role: Role.SUPER_ADMIN };
    next();
  },
}));

vi.mock('../src/middleware/role.middleware.js', () => ({
  requireSuperAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

import { cohortRouter } from '../src/routes/cohort.routes.js';
import { adminRouter } from '../src/routes/admin.routes.js';
import { statsRouter } from '../src/routes/stats.routes.js';

describe('user service routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/cohorts', cohortRouter);
    app.use('/api/admins', adminRouter);
    app.use('/api/stats', statsRouter);
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

  it('lists cohorts with aggregate counts', async () => {
    prismaMock.cohort.findMany.mockResolvedValue([
      {
        id: 'cohort-1',
        name: 'Cohort 2026',
        _count: { admins: 1, students: 20, mentors: 2, batches: 4 },
      },
    ]);

    const response = await fetch(`${baseUrl}/api/cohorts`);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toHaveLength(1);
    expect(prismaMock.cohort.findMany).toHaveBeenCalledOnce();
  });

  it('creates a cohort', async () => {
    prismaMock.cohort.create.mockResolvedValue({
      id: 'cohort-2',
      name: 'New Cohort',
      description: 'Phase 3 cohort',
    });

    const response = await fetch(`${baseUrl}/api/cohorts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Cohort', description: 'Phase 3 cohort' }),
    });

    expect(response.status).toBe(201);
    expect(prismaMock.cohort.create).toHaveBeenCalledOnce();
  });

  it('returns stats summary', async () => {
    prismaMock.$transaction.mockResolvedValue([10, 3, 2, 4, 30, 2]);

    const response = await fetch(`${baseUrl}/api/stats`);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.totalUsers).toBe(10);
    expect(payload.data.activeCohorts).toBe(2);
  });

  it('lists assignable users for admin assignment', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-22',
        name: 'Alex Kumar',
        email: 'alex@example.com',
        role: 'STUDENT',
        isActive: true,
        adminProfile: null,
      },
    ]);

    const response = await fetch(`${baseUrl}/api/admins/assignable-users?search=alex`);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data[0].email).toBe('alex@example.com');
  });
});
