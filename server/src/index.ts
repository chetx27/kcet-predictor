import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Middleware ────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── Health check ─────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler ──────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⬡ KCET Compass API`);
  console.log(`  ├─ Running on http://localhost:${PORT}`);
  console.log(`  ├─ Health: http://localhost:${PORT}/health`);
  console.log(`  └─ API: http://localhost:${PORT}/api/v1\n`);
});