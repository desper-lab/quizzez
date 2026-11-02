import React, { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, RefreshCw, Sparkles, User } from 'lucide-react';
import { ARCHETYPE_PROFILES, QUIZ_QUESTIONS } from '../../data/quizData';
import { Archetype, Submission } from '../../types/quiz';
import { submitQuiz } from '../../services/api';

interface QuizFlowProps {
  onOpenAdmin: () => void;
}

export const QuizFlow: React.FC<QuizFlowProps> = ({ onOpenAdmin }) => {
  const [userName, setUserName] = useState('');
  const [nameError, setNameError] = useState('');
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 = welcome, 1-10 = questions, 11 = results
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userName.trim();
    if (!trimmed) {
      setNameError('Please enter your name or nickname to start.');
      return;
    }
    setNameError('');
    setCurrentStep(1);
  };

  const handleSelectOption = (questionId: number, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    // Auto advance after 250ms for seamless flow
    setTimeout(() => {
      if (questionId < totalQuestions) {
        setCurrentStep(questionId + 1);
      } else {
        // Last question answered, trigger submission
        handleSubmitQuiz({ ...answers, [questionId]: optionId });
      }
    }, 240);
  };

  const handleSubmitQuiz = async (finalAnswers: Record<number, string>) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await submitQuiz(userName.trim(), finalAnswers);
      setSubmissionResult(res.submission);
      setCurrentStep(11);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setServerError(err.message || 'Unable to save your answers. Showing offline result.');
      // Calculate local fallback result
      const fallbackScores = { Thinker: 0, Creator: 0, Leader: 0, Supporter: 0 };
      for (const q of QUIZ_QUESTIONS) {
        const choice = finalAnswers[q.id];
        const opt = q.options.find((o) => o.id === choice);
        if (opt) fallbackScores[opt.archetype] += 1;
      }
      const sorted = (Object.keys(fallbackScores) as Archetype[]).sort(
        (a, b) => fallbackScores[b] - fallbackScores[a]
      );
      setSubmissionResult({
        id: `local_${Date.now()}`,
        name: userName.trim(),
        createdAt: new Date().toISOString(),
        primaryArchetype: sorted[0] || 'Thinker',
        secondaryArchetype: sorted[1] || 'Creator',
        scores: fallbackScores,
        percentageScores: {
          Thinker: Math.round((fallbackScores.Thinker / 10) * 100),
          Creator: Math.round((fallbackScores.Creator / 10) * 100),
          Leader: Math.round((fallbackScores.Leader / 10) * 100),
          Supporter: Math.round((fallbackScores.Supporter / 10) * 100),
        },
        answers: finalAnswers,
      });
      setCurrentStep(11);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    });
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentStep(0);
    setSubmissionResult(null);
    setServerError(null);
  };

  // STEP 0: Welcome Screen
  if (currentStep === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            <span>10 Quick Questions</span>
            <span aria-hidden="true">·</span>
            <span>2 Minutes</span>
            <span aria-hidden="true">·</span>
            <span>Instant Results</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3 text-balance">
            Personality Archetype Assessment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
            Discover whether your instinctual style leans toward the Analytical Thinker, Visionary Creator, Decisive Leader, or Empathetic Supporter.
          </p>

          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name or Nickname
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  maxLength={50}
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. Alex"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <User className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              {nameError && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{nameError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer text-sm sm:text-base"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Submissions saved automatically</span>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Admin View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1..10: Question Stepper
  if (currentStep >= 1 && currentStep <= totalQuestions) {
    const question = QUIZ_QUESTIONS[currentStep - 1];
    const selectedChoice = answers[question.id];
    const progressPercent = Math.round(((currentStep - 1) / totalQuestions) * 100);

    return (
      <div className="w-full max-w-2xl mx-auto py-6 px-4 sm:px-6">
        {/* Progress & Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            <span>
              Question <strong className="text-slate-900 dark:text-slate-100">{currentStep}</strong> of {totalQuestions}
            </span>
            <span className="font-mono tabular-nums">{progressPercent}% complete</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${((currentStep) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 block">
            Scenario {currentStep}
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
            {question.prompt}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 italic">
            Context: {question.scenario}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = selectedChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(question.id, opt.id)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold uppercase font-mono ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="text-sm sm:text-base leading-relaxed grow">
                    {opt.text}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step Navigation Bar */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer px-2 py-1"
            >
              Previous Question
            </button>

            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing results...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STEP 11: Results Screen
  if (currentStep === 11 && submissionResult) {
    const primary = ARCHETYPE_PROFILES[submissionResult.primaryArchetype];
    const secondary = ARCHETYPE_PROFILES[submissionResult.secondaryArchetype];

    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6">
        {serverError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg">
            Note: {serverError}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            <span>Assessment Complete</span>
            <span aria-hidden="true">·</span>
            <span>Participant: {submissionResult.name}</span>
          </div>

          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Primary Archetype
            </span>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${primary.color}`}>
              {primary.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1 italic">
              "{primary.tagline}"
            </p>
          </div>

          {/* Core Strengths */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Signature Strengths
            </h2>
            <ul className="space-y-2">
              {primary.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Archetype Breakdown */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Full Spectrum Distribution
            </h2>
            <div className="space-y-3">
              {(Object.keys(ARCHETYPE_PROFILES) as Archetype[]).map((type) => {
                const profile = ARCHETYPE_PROFILES[type];
                const pct = submissionResult.percentageScores[type] || 0;
                const score = submissionResult.scores[type] || 0;
                const isPrimary = type === primary.type;

                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${isPrimary ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {profile.title} {isPrimary && '(Dominant)'}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {score}/10 ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          type === 'Thinker'
                            ? 'bg-sky-500'
                            : type === 'Creator'
                            ? 'bg-amber-500'
                            : type === 'Leader'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {secondary && secondary.type !== primary.type && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Secondary influence: <span className="font-medium text-slate-700 dark:text-slate-300">{secondary.title}</span>.
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{copyToast ? 'Link Copied to Clipboard!' : 'Share Quiz Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline font-medium cursor-pointer"
            >
              Switch to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
