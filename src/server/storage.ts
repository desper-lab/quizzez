import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Archetype, LogEntry, Submission, SubmissionScores } from '../types/quiz';
import { QUIZ_QUESTIONS } from '../data/quizData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

const DEFAULT_ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Ensure data directory exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[Storage] Failed to create data directory:', err);
  }
}

// Atomic file write using temporary file replacement
function atomicWriteJson<T>(filePath: string, data: T): void {
  ensureDataDir();
  const tempPath = `${filePath}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`[Storage] Atomic write failed for ${filePath}:`, err);
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}

// Read JSON safely with fallback
function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      atomicWriteJson(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[Storage] Read error for ${filePath}:`, err);
    return fallback;
  }
}

// Append structured troubleshooting log
export function logEvent(
  level: 'INFO' | 'WARN' | 'ERROR',
  action: string,
  message: string,
  details?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    level,
    action,
    message,
    details,
  };

  try {
    const logs = safeReadJson<LogEntry[]>(LOGS_FILE, []);
    // Keep last 500 logs to prevent disk bloat
    const updated = [entry, ...logs].slice(0, 500);
    atomicWriteJson(LOGS_FILE, updated);
  } catch (err) {
    console.error('[Storage] Failed to append log entry:', err);
  }

  return entry;
}

// Retrieve submissions
export function getSubmissions(): Submission[] {
  return safeReadJson<Submission[]>(SUBMISSIONS_FILE, []);
}

// Retrieve troubleshooting logs
export function getLogs(): LogEntry[] {
  return safeReadJson<LogEntry[]>(LOGS_FILE, []);
}

// Clear all submissions
export function clearSubmissions(): { count: number } {
  const current = getSubmissions();
  const count = current.length;
  atomicWriteJson(SUBMISSIONS_FILE, []);
  logEvent('WARN', 'ADMIN_CLEAR_DATA', `Cleared ${count} quiz submissions from database`);
  return { count };
}

// Constant-time PIN check (OWASP timing-attack mitigation)
export function verifyAdminPin(providedPin: string): boolean {
  if (!providedPin || typeof providedPin !== 'string') {
    return false;
  }
  const expected = Buffer.from(DEFAULT_ADMIN_PIN);
  const received = Buffer.from(providedPin);

  if (expected.length !== received.length) {
    // Constant time dummy check to avoid length leak
    crypto.timingSafeEqual(expected, expected);
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

// Sanitization utility (OWASP XSS mitigation)
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // remove HTML tag markers
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 60); // enforce max length
}

// Calculate scores and dominant archetype
export function calculateScores(answers: Record<number, string>): {
  scores: SubmissionScores;
  percentageScores: SubmissionScores;
  primaryArchetype: Archetype;
  secondaryArchetype: Archetype;
} {
  const scores: SubmissionScores = {
    Thinker: 0,
    Creator: 0,
    Leader: 0,
    Supporter: 0,
  };

  // Map of question options to archetypes
  const questionMap = new Map<number, Map<string, Archetype>>();
  for (const q of QUIZ_QUESTIONS) {
    const optMap = new Map<string, Archetype>();
    for (const opt of q.options) {
      optMap.set(opt.id, opt.archetype);
    }
    questionMap.set(q.id, optMap);
  }

  let totalAnswered = 0;
  for (const [qIdStr, optId] of Object.entries(answers)) {
    const qId = parseInt(qIdStr, 10);
    const optMap = questionMap.get(qId);
    if (optMap && optMap.has(optId)) {
      const arch = optMap.get(optId)!;
      scores[arch] += 1;
      totalAnswered += 1;
    }
  }

  const denom = totalAnswered > 0 ? totalAnswered : 1;
  const percentageScores: SubmissionScores = {
    Thinker: Math.round((scores.Thinker / denom) * 100),
    Creator: Math.round((scores.Creator / denom) * 100),
    Leader: Math.round((scores.Leader / denom) * 100),
    Supporter: Math.round((scores.Supporter / denom) * 100),
  };

  const sortedArchetypes = (Object.keys(scores) as Archetype[]).sort(
    (a, b) => scores[b] - scores[a]
  );

  return {
    scores,
    percentageScores,
    primaryArchetype: sortedArchetypes[0] || 'Thinker',
    secondaryArchetype: sortedArchetypes[1] || 'Creator',
  };
}

// Create and store a new submission
export function createSubmission(
  rawName: string,
  answers: Record<number, string>,
  clientIp?: string
): { submission: Submission } {
  const sanitizedName = sanitizeInput(rawName) || 'Anonymous Participant';

  // Validate answers
  if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
    logEvent('WARN', 'SUBMISSION_VALIDATION_FAILED', 'Submission rejected: empty or invalid answers', {
      name: sanitizedName,
      clientIp,
    });
    throw new Error('Invalid or empty quiz answers');
  }

  const { scores, percentageScores, primaryArchetype, secondaryArchetype } = calculateScores(answers);

  const submission: Submission = {
    id: `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: sanitizedName,
    createdAt: new Date().toISOString(),
    primaryArchetype,
    secondaryArchetype,
    scores,
    percentageScores,
    answers,
  };

  const submissions = getSubmissions();
  submissions.unshift(submission);
  atomicWriteJson(SUBMISSIONS_FILE, submissions);

  logEvent('INFO', 'SUBMISSION_CREATED', `Quiz completed by "${sanitizedName}" (${primaryArchetype})`, {
    submissionId: submission.id,
    name: sanitizedName,
    primaryArchetype,
    scoreSummary: scores,
    clientIp: clientIp ? `${clientIp.slice(0, 7)}***` : 'unknown',
  });

  return { submission };
}

// Initialize seed data if file is empty
export function initSeedIfEmpty(): void {
  ensureDataDir();
  const current = safeReadJson<Submission[]>(SUBMISSIONS_FILE, []);
  if (current.length === 0) {
    const sampleSubmissions: Submission[] = [
      {
        id: 'sub_seed_01',
        name: 'Elena Rostova',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        primaryArchetype: 'Thinker',
        secondaryArchetype: 'Leader',
        scores: { Thinker: 6, Creator: 2, Leader: 2, Supporter: 0 },
        percentageScores: { Thinker: 60, Creator: 20, Leader: 20, Supporter: 0 },
        answers: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'a', 7: 'a', 8: 'c', 9: 'c', 10: 'b' },
      },
      {
        id: 'sub_seed_02',
        name: 'Marcus Chen',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        primaryArchetype: 'Leader',
        secondaryArchetype: 'Creator',
        scores: { Thinker: 1, Creator: 3, Leader: 5, Supporter: 1 },
        percentageScores: { Thinker: 10, Creator: 30, Leader: 50, Supporter: 10 },
        answers: { 1: 'c', 2: 'c', 3: 'c', 4: 'c', 5: 'c', 6: 'c', 7: 'b', 8: 'b', 9: 'b', 10: 'd' },
      },
      {
        id: 'sub_seed_03',
        name: 'Sarah Jenkins',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        primaryArchetype: 'Supporter',
        secondaryArchetype: 'Creator',
        scores: { Thinker: 1, Creator: 3, Leader: 1, Supporter: 5 },
        percentageScores: { Thinker: 10, Creator: 30, Leader: 10, Supporter: 50 },
        answers: { 1: 'd', 2: 'd', 3: 'd', 4: 'd', 5: 'd', 6: 'b', 7: 'b', 8: 'b', 9: 'a', 10: 'd' },
      },
    ];
    atomicWriteJson(SUBMISSIONS_FILE, sampleSubmissions);
    logEvent('INFO', 'SYSTEM_INITIALIZED', 'Storage seeded with 3 representative initial submissions');
  }
}
