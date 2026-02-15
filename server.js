const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configuración principal (compatible con Node 18+/20+).
const LISTEN_HOST = process.env.PROXY_HOST || '127.0.0.1';
const LISTEN_PORT = Number(process.env.PROXY_PORT || 8787);
const N8N_TARGET = process.env.N8N_TARGET || 'http://127.0.0.1:5678';

// Por defecto solo proxyea rutas webhook. Si quieres todo, setea PROXY_ALL=true.
const PROXY_ALL = String(process.env.PROXY_ALL || 'false').toLowerCase() === 'true';

const PUBLIC_BASE = '/webhook/whatsapp-in';
const VERIFY_PATH = '/webhook/whatsapp-in-verify';
const EVENT_PATH = '/webhook/whatsapp-in-event';

function fullIncomingUrl(req) {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

function pickTargetPath(req) {
  const path = req.path;

  // B) Entrada directa a verify: proxy tal cual (sin reescrituras adicionales).
  if (path === VERIFY_PATH) {
    return VERIFY_PATH;
  }

  // C) Entrada directa a event: proxy tal cual (sin reescrituras adicionales).
  if (path === EVENT_PATH) {
    return EVENT_PATH;
  }

  // A) Entrada pública recomendada: /webhook/whatsapp-in
  // GET -> verify, POST -> event.
  if (path === PUBLIC_BASE) {
    if (req.method === 'GET') {
      return VERIFY_PATH;
    }

    if (req.method === 'POST') {
      return EVENT_PATH;
    }

    // Métodos diferentes a GET/POST deben devolver 405.
    return null;
  }

  // Para rutas no contempladas.
  return undefined;
}

// Logs de entrada para depuración.
app.use((req, _res, next) => {
  console.log(`[IN] ${req.method} ${fullIncomingUrl(req)}`);
  next();
});

// Endpoints de salud.
app.get('/health', (_req, res) => {
  res.status(200).type('text/plain').send('OK');
});

app.get('/', (_req, res) => {
  res.status(200).type('text/plain').send('Proxy OK');
});

const proxyMiddleware = createProxyMiddleware({
  target: N8N_TARGET,
  changeOrigin: true,
  xfwd: true,
  logLevel: 'silent',

  // Reescribe path y conserva SIEMPRE el querystring original.
  pathRewrite: (path, req) => {
    const rewrittenPath = pickTargetPath(req);

    if (rewrittenPath === undefined || rewrittenPath === null) {
      return path;
    }

    const queryIndex = req.originalUrl.indexOf('?');
    const originalQuery = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
    const finalPath = `${rewrittenPath}${originalQuery}`;

    console.log(`[REWRITE] ${req.method} ${path} -> ${finalPath}`);
    return finalPath;
  },

  onProxyRes: (proxyRes, req, res) => {
    // OUT: status code final devuelto por n8n.
    const statusCode = proxyRes.statusCode || 0;
    const statusMessage = proxyRes.statusMessage || '';
    console.log(`[OUT] ${req.method} ${req.originalUrl} -> ${statusCode}${statusMessage ? ` ${statusMessage}` : ''}`);
    if (statusCode >= 400) {
      console.error(`[OUT ERROR] ${req.method} ${req.originalUrl} -> ${statusCode}${statusMessage ? ` ${statusMessage}` : ''}`);
    }

    // Asegura que si n8n devuelve 5xx se mantenga tal cual.
    if (!res.headersSent) {
      res.statusCode = statusCode;
    }
  },

  onError: (err, req, res) => {
    // Si n8n está caído o hay error de red: 502 Proxy error.
    console.error(`[PROXY ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);

    if (!res.headersSent) {
      res.status(502).type('text/plain').send('Proxy error');
    }
  },
});

function shouldProxy(req) {
  if (PROXY_ALL) {
    return true;
  }

  return (
    req.path === PUBLIC_BASE ||
    req.path === VERIFY_PATH ||
    req.path === EVENT_PATH
  );
}

app.use((req, res, next) => {
  // Solo permitir GET/POST en rutas webhook.
  if (shouldProxy(req)) {
    const targetPath = pickTargetPath(req);

    if (req.path === PUBLIC_BASE) {
      if (req.method === 'GET') {
        console.log('[ROUTE] GET -> verify');
      } else if (req.method === 'POST') {
        console.log('[ROUTE] POST -> event');
      }
    }

    if (targetPath === null) {
      res.set('Allow', 'GET, POST');
      return res.status(405).type('text/plain').send('Method Not Allowed');
    }

    return proxyMiddleware(req, res, next);
  }

  // Evita tragarse otras rutas cuando PROXY_ALL está desactivado.
  if (!PROXY_ALL) {
    return res.status(404).type('text/plain').send('Not Found');
  }

  return proxyMiddleware(req, res, next);
});

app.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`Proxy escuchando en http://${LISTEN_HOST}:${LISTEN_PORT}`);
  console.log(`Reenviando a n8n en ${N8N_TARGET}`);
  console.log(`Modo PROXY_ALL=${PROXY_ALL}`);
  console.log('Rutas esperadas:');
  console.log(`- ${PUBLIC_BASE} (GET->verify, POST->event)`);
  console.log(`- ${VERIFY_PATH} (directo)`);
  console.log(`- ${EVENT_PATH} (directo)`);
});
