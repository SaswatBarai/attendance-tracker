import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SERVICE_PORTS, APP_VERSION } from '@attendance-tracker/config';
import { healthRouter } from './routes/health.routes.js';
import { attendanceCodeRouter } from './routes/attendance-code.routes.js';
import { registerCodeRefreshHandler } from './websocket/code-refresh.handler.js';

const app = express();
const httpServer = createServer(app);
const PORT = SERVICE_PORTS.ATTENDANCE;

const io = new Server(httpServer, {
  cors: { origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' },
});

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/health', healthRouter);
app.use('/api/attendance-codes', attendanceCodeRouter);

registerCodeRefreshHandler(io);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
);

httpServer.listen(PORT, () => {
  console.info(`[attendance-service] running on port ${PORT} — v${APP_VERSION}`);
});

export { io };
export default app;
