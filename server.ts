import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de .env se existir
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const startTime = new Date();

app.use(express.json());

// Endpoint de diagnóstico e health check (usado pelo Caddy e monitorização de uptime)
app.get('/api/health', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
  res.json({
    status: 'ok',
    app: 'FSYS360 Service',
    company: 'FozSistemas',
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Endpoint de metadados da aplicação
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    name: 'FSYS360 Service — Gestão de Assistências Técnicas',
    vendor: 'FozSistemas — Equipamentos e Sistemas de Informação, Lda.',
    website: 'https://fozsistemas.com',
    supportPhone: '(+351) 233 094 320',
    a5PaperSize: '148x210mm'
  });
});

// Servir ficheiros estáticos da pasta dist (quando em produção)
const distPath = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h' }));

  // Redirecionamento SPA para index.html para todas as outras rotas
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Se ainda não foi feito build, fornecer mensagem informativa
  app.get('/', (req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FSYS360 Service — Aguarda Compilação</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; max-width: 500px; text-align: center; }
            h1 { color: #38bdf8; margin-top: 0; }
            code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-family: monospace; color: #f43f5e; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>FSYS360 Service</h1>
            <p>O servidor backend está operacional na porta ${PORT}.</p>
            <p>Para gerar a interface gráfica em produção, execute:</p>
            <p><code>npm run build</code></p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(Number(PORT), HOST, () => {
  console.log(`[FSYS360 Service] Servidor iniciado em http://${HOST}:${PORT}`);
  console.log(`[FSYS360 Service] Ambiente: ${process.env.NODE_ENV || 'production'}`);
});
