import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleDeconstructRequest } from './server/deconstructGateway';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Dev server in AI Studio must ALWAYS bind to port 3000
  const PORT = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Primary Tailorix AI Deconstruct Gateway Route
  app.post('/api/deconstruct-garment', async (req, res) => {
    try {
      const result = await handleDeconstructRequest(req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      console.error('[Tailorix Server] Unhandled error in /api/deconstruct-garment:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Internal server error processing garment deconstruction',
          provider: req.body?.provider || 'unknown',
          requestId: `err_${Date.now()}`,
        },
      });
    }
  });

  // Diagnostic Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      timestamp: Date.now(),
    });
  });

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tailorix Server] Full-Stack Applet running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Tailorix Server] Fatal startup error:', err);
  process.exit(1);
});
