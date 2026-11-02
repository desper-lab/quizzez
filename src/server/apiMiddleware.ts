import type { IncomingMessage, ServerResponse } from 'http';
import {
  createSubmission,
  getSubmissions,
  getLogs,
  clearSubmissions,
  verifyAdminPin,
  logEvent,
  initSeedIfEmpty,
} from './storage';

// Initialize seed data on load
try {
  initSeedIfEmpty();
} catch (e) {
  console.error('[API] Storage seed init error:', e);
}

// In-memory rate limiting map for OWASP DOS mitigation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}

// Helper to read JSON request body with maximum byte size safeguard (OWASP)
function readJsonBody(req: IncomingMessage, maxBytes = 16384): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        req.destroy();
        reject(new Error('Payload Too Large'));
        return;
      }
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Malformed JSON'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
  });
  res.end(body);
}

export function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const url = req.url || '';
  if (!url.startsWith('/api/')) {
    return next();
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
    });
    res.end();
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Rate limit check
  if (!checkRateLimit(clientIp)) {
    logEvent('WARN', 'RATE_LIMIT_EXCEEDED', `Client exceeded rate limit from ${clientIp}`);
    sendJson(res, 429, { error: 'Too many requests. Please wait a moment.' });
    return;
  }

  const pathname = url.split('?')[0];

  // Route: GET /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
    return;
  }

  // Route: GET /api/submissions
  if (pathname === '/api/submissions' && req.method === 'GET') {
    try {
      const submissions = getSubmissions();
      sendJson(res, 200, { success: true, count: submissions.length, submissions });
    } catch (err: any) {
      logEvent('ERROR', 'FETCH_SUBMISSIONS_FAILED', err?.message || 'Unknown error');
      sendJson(res, 500, { error: 'Failed to retrieve submissions' });
    }
    return;
  }

  // Route: POST /api/submissions
  if (pathname === '/api/submissions' && req.method === 'POST') {
    readJsonBody(req)
      .then((body) => {
        const { name, answers } = body;
        if (!answers || typeof answers !== 'object') {
          sendJson(res, 400, { error: 'Quiz answers are required' });
          return;
        }

        const { submission } = createSubmission(name, answers, clientIp);
        sendJson(res, 201, { success: true, submission });
      })
      .catch((err: any) => {
        const status = err.message === 'Payload Too Large' ? 413 : 400;
        sendJson(res, status, { error: err.message || 'Invalid request body' });
      });
    return;
  }

  // Route: POST /api/admin/verify
  if (pathname === '/api/admin/verify' && req.method === 'POST') {
    readJsonBody(req)
      .then((body) => {
        const pin = String(body?.pin || '').trim();
        const isValid = verifyAdminPin(pin);
        if (isValid) {
          logEvent('INFO', 'ADMIN_LOGIN_SUCCESS', 'Admin PIN successfully validated', {
            clientIp: `${clientIp.slice(0, 7)}***`,
          });
          sendJson(res, 200, { success: true, valid: true });
        } else {
          logEvent('WARN', 'ADMIN_LOGIN_FAILED', 'Invalid PIN attempted', {
            clientIp: `${clientIp.slice(0, 7)}***`,
          });
          sendJson(res, 401, { success: false, valid: false, error: 'Incorrect PIN' });
        }
      })
      .catch(() => sendJson(res, 400, { error: 'Bad request' }));
    return;
  }

  // Route: GET /api/admin/logs
  if (pathname === '/api/admin/logs' && req.method === 'GET') {
    try {
      const logs = getLogs();
      sendJson(res, 200, { success: true, logs });
    } catch (err: any) {
      sendJson(res, 500, { error: 'Failed to load logs' });
    }
    return;
  }

  // Route: POST /api/admin/clear
  if (pathname === '/api/admin/clear' && req.method === 'POST') {
    readJsonBody(req)
      .then((body) => {
        const pin = String(body?.pin || '').trim();
        if (!verifyAdminPin(pin)) {
          sendJson(res, 401, { error: 'Unauthorized PIN' });
          return;
        }
        const result = clearSubmissions();
        sendJson(res, 200, { success: true, cleared: result.count });
      })
      .catch(() => sendJson(res, 400, { error: 'Bad request' }));
    return;
  }

  // 404 for unknown /api/*
  sendJson(res, 404, { error: 'Endpoint not found' });
}
