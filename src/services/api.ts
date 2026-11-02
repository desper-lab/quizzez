import { LogEntry, Submission } from '../types/quiz';

const API_BASE = '/api';

export async function submitQuiz(
  name: string,
  answers: Record<number, string>
): Promise<{ submission: Submission }> {
  try {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, answers }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('[API Service] Submit quiz error:', err);
    throw err;
  }
}

export async function fetchSubmissions(): Promise<Submission[]> {
  try {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch submissions (${res.status})`);
    }

    const data = await res.json();
    return data.submissions || [];
  } catch (err: any) {
    console.error('[API Service] Fetch submissions error:', err);
    throw err;
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return Boolean(data.valid);
  } catch (err) {
    console.error('[API Service] Verify PIN error:', err);
    return false;
  }
}

export async function fetchAdminLogs(): Promise<LogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch logs (${res.status})`);
    }

    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('[API Service] Fetch logs error:', err);
    return [];
  }
}

export async function clearSubmissions(pin: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/admin/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    });

    if (!res.ok) {
      throw new Error('Failed to reset submissions');
    }

    const data = await res.json();
    return data.cleared || 0;
  } catch (err: any) {
    console.error('[API Service] Clear submissions error:', err);
    throw err;
  }
}
