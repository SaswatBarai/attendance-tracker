'use client';

import { io, type Socket } from 'socket.io-client';

const ATTENDANCE_URL = process.env['NEXT_PUBLIC_ATTENDANCE_SERVICE_URL'] ?? 'http://localhost:3003';

let socket: Socket | null = null;

export function getAttendanceSocket(): Socket {
  socket ??= io(ATTENDANCE_URL, {
    autoConnect: false,
    transports: ['websocket'],
  });

  return socket;
}
