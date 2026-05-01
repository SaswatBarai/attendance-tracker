import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { SERVICE_PORTS, APP_VERSION } from '@attendance-tracker/config';
import { healthRouter } from './routes/health.routes.js';
import { scheduleRouter } from './routes/schedule.routes.js';

const app = express();
const PORT = SERVICE_PORTS.SCHEDULE;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/health', healthRouter);
app.use('/api/schedules', scheduleRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.info(`[schedule-service] running on port ${PORT} — v${APP_VERSION}`);
});

export default app;
