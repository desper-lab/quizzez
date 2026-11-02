export type Archetype = 'Thinker' | 'Creator' | 'Leader' | 'Supporter';

export interface QuestionOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
  archetype: Archetype;
}

export interface Question {
  id: number;
  prompt: string;
  scenario: string;
  options: QuestionOption[];
}

export interface ArchetypeProfile {
  type: Archetype;
  title: string;
  tagline: string;
  traits: string[];
  strengths: string[];
  color: string;
  badgeBg: string;
}

export interface SubmissionScores {
  Thinker: number;
  Creator: number;
  Leader: number;
  Supporter: number;
}

export interface Submission {
  id: string;
  name: string;
  createdAt: string;
  primaryArchetype: Archetype;
  secondaryArchetype: Archetype;
  scores: SubmissionScores;
  percentageScores: SubmissionScores;
  answers: Record<number, string>; // questionId (1-10) -> optionId ('a','b','c','d')
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface QuizStats {
  totalSubmissions: number;
  archetypeDistribution: Record<Archetype, number>;
  latestSubmissionTime: string | null;
}
