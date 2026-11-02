import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ARCHETYPE_PROFILES, QUIZ_QUESTIONS } from '../../data/quizData';
import { Archetype, LogEntry, Submission } from '../../types/quiz';
import { clearSubmissions, fetchAdminLogs, fetchSubmissions, verifyAdminPin } from '../../services/api';

interface AdminDashboardProps {
  onBackToQuiz: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToQuiz }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Data State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'submissions' | 'logs'>('submissions');
  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<'All' | Archetype>('All');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPinInput, setClearPinInput] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subs, logEntries] = await Promise.all([
        fetchSubmissions(),
        fetchAdminLogs(),
      ]);
      setSubmissions(subs);
      setLogs(logEntries);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      triggerToast('Error updating data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Please enter a PIN');
      return;
    }
    setIsVerifying(true);
    setPinError('');

    const valid = await verifyAdminPin(pinInput.trim());
    setIsVerifying(false);

    if (valid) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      setPinError('Invalid PIN code. Default is 1234.');
    }
  };

  const handleCopyQuizUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      triggerToast('Quiz link copied to clipboard');
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_submissions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Submissions downloaded as JSON');
  };

  const handleExportCsv = () => {
    if (submissions.length === 0) {
      triggerToast('No submissions to export');
      return;
    }

    const headers = ['ID', 'Name', 'Date', 'Primary Archetype', 'Thinker', 'Creator', 'Leader', 'Supporter'];
    const rows = submissions.map((s) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.createdAt,
      s.primaryArchetype,
      s.scores.Thinker,
      s.scores.Creator,
      s.scores.Leader,
      s.scores.Supporter,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Submissions exported as CSV');
  };

  const handleClearDatabase = async () => {
    try {
      await clearSubmissions(clearPinInput.trim() || '1234');
      setShowClearConfirm(false);
      setClearPinInput('');
      triggerToast('Database cleared successfully');
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to clear database');
    }
  };

  // If PIN entry is required
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4">
            <Lock className="w-5 h-5" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
            Admin Verification
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6">
            Enter your admin PIN to access results and logs. (Default PIN: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">1234</span>)
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                PIN Code
              </label>
              <input
                id="pin"
                type="password"
                maxLength={20}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                placeholder="1234"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer text-sm"
            >
              {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onBackToQuiz}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              Return to Public Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesName = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchetype = archetypeFilter === 'All' || sub.primaryArchetype === archetypeFilter;
    return matchesName && matchesArchetype;
  });

  // Analytics computation
  const totalSubmissions = submissions.length;
  const archetypeCounts: Record<Archetype, number> = {
    Thinker: 0,
    Creator: 0,
    Leader: 0,
    Supporter: 0,
  };
  submissions.forEach((s) => {
    if (archetypeCounts[s.primaryArchetype] !== undefined) {
      archetypeCounts[s.primaryArchetype] += 1;
    }
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToQuiz}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back to Quiz"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Admin Console</span>
              <span aria-hidden="true">·</span>
              <span>Local JSON Database</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Quiz Submissions &amp; Analytics
            </h1>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyQuizUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Quiz URL</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Total Submissions</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {totalSubmissions}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-sky-600 dark:text-sky-400 block mb-1">Thinkers</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {archetypeCounts.Thinker}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 block mb-1">Creators</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {archetypeCounts.Creator}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">Leaders</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {archetypeCounts.Leader}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 block mb-1">Supporters</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {archetypeCounts.Supporter}
          </span>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'submissions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Responses ({filteredSubmissions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Troubleshoot Logs ({logs.length})</span>
            </button>
          </div>

          {/* Table Search & Export Controls */}
          {activeTab === 'submissions' && (
            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <div className="relative grow md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Archetype Filter */}
              <div className="flex items-center gap-1 text-xs">
                {(['All', 'Thinker', 'Creator', 'Leader', 'Supporter'] as const).map((arch) => (
                  <button
                    key={arch}
                    type="button"
                    onClick={() => setArchetypeFilter(arch)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      archetypeFilter === arch
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {arch}
                  </button>
                ))}
              </div>

              {/* Download Buttons */}
              <button
                type="button"
                onClick={handleExportCsv}
                title="Export CSV"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                title="Export JSON"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: Submissions Table */}
        {activeTab === 'submissions' && (
          <div className="overflow-x-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                No submissions found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Primary Archetype</th>
                    <th className="py-3 px-4 text-center">Score Breakdown</th>
                    <th className="py-3 px-4 text-right">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSubmissions.map((sub) => {
                    const profile = ARCHETYPE_PROFILES[sub.primaryArchetype];
                    const dateFormatted = new Date(sub.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {sub.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${profile ? profile.color : ''}`}>
                            {profile ? profile.title : sub.primaryArchetype}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            <span title="Thinker" className="text-sky-600 dark:text-sky-400">T:{sub.scores.Thinker}</span>
                            <span aria-hidden="true">·</span>
                            <span title="Creator" className="text-amber-600 dark:text-amber-400">C:{sub.scores.Creator}</span>
                            <span aria-hidden="true">·</span>
                            <span title="Leader" className="text-emerald-600 dark:text-emerald-400">L:{sub.scores.Leader}</span>
                            <span aria-hidden="true">·</span>
                            <span title="Supporter" className="text-indigo-600 dark:text-indigo-400">S:{sub.scores.Supporter}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Troubleshoot & Audit Logs */}
        {activeTab === 'logs' && (
          <div className="p-4">
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Chronological server &amp; validation activity (Latest 500 entries)</span>
              <span className="font-mono tabular-nums">{logs.length} logged events</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Level</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                          {log.timestamp.slice(11, 19)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-semibold">
                          <span
                            className={
                              log.level === 'ERROR'
                                ? 'text-rose-600'
                                : log.level === 'WARN'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                          {log.action}
                        </td>
                        <td className="py-2 px-3">
                          <span>{log.message}</span>
                          {log.details && (
                            <span className="text-slate-400 ml-2">
                              {JSON.stringify(log.details)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Answer Drill-down Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {selectedSubmission.name}'s Responses
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Primary: {selectedSubmission.primaryArchetype} · Submitted {new Date(selectedSubmission.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {QUIZ_QUESTIONS.map((q) => {
                const chosenOptionId = selectedSubmission.answers[q.id];
                const chosenOption = q.options.find((opt) => opt.id === chosenOptionId);

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                      {q.id}. {q.prompt}
                    </div>
                    {chosenOption ? (
                      <div className="flex items-center gap-2 mt-1.5 text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 p-2 rounded-lg">
                        <span className="font-mono font-bold uppercase">{chosenOption.id}.</span>
                        <span className="grow">{chosenOption.text}</span>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                          [{chosenOption.archetype}]
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No answer recorded</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Reset Submissions Database?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This will remove all {submissions.length} stored submissions permanently. Confirm with your PIN code.
            </p>

            <input
              type="password"
              value={clearPinInput}
              onChange={(e) => setClearPinInput(e.target.value)}
              placeholder="Admin PIN (e.g. 1234)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 mb-4 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-center"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearPinInput('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                className="px-3.5 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md cursor-pointer transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
