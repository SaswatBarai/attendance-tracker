import type { Server, Socket } from 'socket.io';
import { Role } from '@attendance-tracker/shared-types';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { generateAttendanceCode } from '../services/attendance-code.service.js';

interface RefreshPayload {
  token?: string;
  scheduleId?: string;
  codeType?: 'QR_CODE' | 'MANUAL_CODE';
}

export function registerCodeRefreshHandler(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.info(`[attendance-service] socket connected: ${socket.id}`);

    socket.on('attendance-code:refresh', async (payload: RefreshPayload, callback) => {
      try {
        if (!payload.token) {
          throw Object.assign(new Error('Missing access token'), { statusCode: 401 });
        }

        const user = verifyAccessToken(payload.token);
        if (user.role !== Role.STUDENT) {
          throw Object.assign(new Error('Only students can refresh attendance codes'), {
            statusCode: 403,
          });
        }

        const code = await generateAttendanceCode({
          userId: user.sub,
          scheduleId: payload.scheduleId,
          codeType: payload.codeType ?? 'QR_CODE',
        });

        callback?.({ success: true, data: code });
        socket.emit('attendance-code:refreshed', code);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to refresh attendance code';
        callback?.({ success: false, error: message });
      }
    });

    socket.on('disconnect', () => {
      console.info(`[attendance-service] socket disconnected: ${socket.id}`);
    });
  });
}
