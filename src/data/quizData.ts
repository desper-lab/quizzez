import { Archetype, ArchetypeProfile, Question } from '../types/quiz';

export const ARCHETYPE_PROFILES: Record<Archetype, ArchetypeProfile> = {
  Thinker: {
    type: 'Thinker',
    title: 'The Analytical Thinker',
    tagline: 'Deep, deliberate, and logic-driven.',
    traits: ['Analytical', 'Systematic', 'Curious', 'Objective'],
    strengths: ['Solves complex problems logically', 'Identifies blind spots and risks', 'High precision and thoroughness'],
    color: 'text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
  },
  Creator: {
    type: 'Creator',
    title: 'The Visionary Creator',
    tagline: 'Imaginative, inventive, and original.',
    traits: ['Innovative', 'Expressive', 'Adaptable', 'Intuitive'],
    strengths: ['Generates breakthrough concepts', 'Finds unconventional solutions', 'Connects disparate ideas'],
    color: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  },
  Leader: {
    type: 'Leader',
    title: 'The Decisive Leader',
    tagline: 'Proactive, goal-focused, and inspiring.',
    traits: ['Decisive', 'Strategic', 'Confident', 'Action-oriented'],
    strengths: ['Takes initiative under pressure', 'Mobilizes teams toward a shared target', 'Executes with high momentum'],
    color: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  },
  Supporter: {
    type: 'Supporter',
    title: 'The Empathetic Supporter',
    tagline: 'Harmonious, reliable, and team-first.',
    traits: ['Empathetic', 'Collaborative', 'Loyal', 'Supportive'],
    strengths: ['Builds deep trust and safety', 'Fosters team consensus and morale', 'Exceptional active listener'],
    color: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
  },
};

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: 'When your team is faced with an unexpected obstacle, what is your first instinct?',
    scenario: 'A sudden roadblock threatens a project deadline.',
    options: [
      { id: 'a', text: 'Break down the data and identify the root cause systematically.', archetype: 'Thinker' },
      { id: 'b', text: 'Brainstorm creative workarounds and explore outside-the-box angles.', archetype: 'Creator' },
      { id: 'c', text: 'Take charge, assign responsibilities, and set an urgent recovery plan.', archetype: 'Leader' },
      { id: 'd', text: 'Check in on team members, ease anxiety, and rally everyone together.', archetype: 'Supporter' },
    ],
  },
  {
    id: 2,
    prompt: 'How do you approach making an important personal or work decision?',
    scenario: 'You have multiple viable paths forward.',
    options: [
      { id: 'a', text: 'Gather facts, build a pros-and-cons matrix, and evaluate probabilities.', archetype: 'Thinker' },
      { id: 'b', text: 'Trust intuition and imagine which choice creates the most exciting future.', archetype: 'Creator' },
      { id: 'c', text: 'Determine the fastest path to meaningful results and commit promptly.', archetype: 'Leader' },
      { id: 'd', text: 'Consult trusted peers and choose what creates the greatest harmony.', archetype: 'Supporter' },
    ],
  },
  {
    id: 3,
    prompt: 'What kind of work environment brings out your best performance?',
    scenario: 'Describing your ideal day-to-day workspace.',
    options: [
      { id: 'a', text: 'Quiet, structured, and focused with uninterrupted deep-thinking time.', archetype: 'Thinker' },
      { id: 'b', text: 'Flexible, open-ended, and stimulating with room for experimentation.', archetype: 'Creator' },
      { id: 'c', text: 'Fast-paced, ambitious, with clear milestones and measurable wins.', archetype: 'Leader' },
      { id: 'd', text: 'Warm, collaborative, and communicative with mutual encouragement.', archetype: 'Supporter' },
    ],
  },
  {
    id: 4,
    prompt: 'When someone gives you constructive criticism, what is your typical reaction?',
    scenario: 'Receiving unexpected feedback on your work.',
    options: [
      { id: 'a', text: 'Analyze whether their argument is objectively valid and fact-based.', archetype: 'Thinker' },
      { id: 'b', text: 'See it as a spark to rethink the entire design or concept.', archetype: 'Creator' },
      { id: 'c', text: 'Filter for what helps reach the target faster and act on it immediately.', archetype: 'Leader' },
      { id: 'd', text: 'Appreciate their intent and seek to understand where they are coming from.', archetype: 'Supporter' },
    ],
  },
  {
    id: 5,
    prompt: 'What role do you naturally fall into during group discussions?',
    scenario: 'A brainstorming or planning meeting with 5+ colleagues.',
    options: [
      { id: 'a', text: 'The skeptic who asks precise questions and tests assumptions.', archetype: 'Thinker' },
      { id: 'b', text: 'The ideator who pitches novel perspectives and unexpected angles.', archetype: 'Creator' },
      { id: 'c', text: 'The driver who keeps the conversation moving toward clear next actions.', archetype: 'Leader' },
      { id: 'd', text: 'The bridge-builder who ensures everyone is heard and feels valued.', archetype: 'Supporter' },
    ],
  },
  {
    id: 6,
    prompt: 'How do you spend your free time when you want to recharge?',
    scenario: 'A completely open Saturday afternoon with no commitments.',
    options: [
      { id: 'a', text: 'Reading, researching a niche topic, or solving a puzzle.', archetype: 'Thinker' },
      { id: 'b', text: 'Making art, tinkering with a new hobby, or writing ideas.', archetype: 'Creator' },
      { id: 'c', text: 'Organizing personal goals, exercising, or working on a passion project.', archetype: 'Leader' },
      { id: 'd', text: 'Spending quality one-on-one time with close family or friends.', archetype: 'Supporter' },
    ],
  },
  {
    id: 7,
    prompt: 'What quality do you respect the most in a teammate or partner?',
    scenario: 'Evaluating people you admire working alongside.',
    options: [
      { id: 'a', text: 'Intellectual honesty, clarity of thought, and rigorous logic.', archetype: 'Thinker' },
      { id: 'b', text: 'Originality, boldness, and refusing to follow the crowd.', archetype: 'Creator' },
      { id: 'c', text: 'Accountability, resilience, and getting things done.', archetype: 'Leader' },
      { id: 'd', text: 'Empathy, dependability, and genuine kindness toward others.', archetype: 'Supporter' },
    ],
  },
  {
    id: 8,
    prompt: 'When starting a brand-new project, what is your initial focus?',
    scenario: 'A blank canvas with high expectations.',
    options: [
      { id: 'a', text: 'Gathering relevant data, reading previous case studies, and scoping constraints.', archetype: 'Thinker' },
      { id: 'b', text: 'Doodling mockups, drafting unique visions, and exploring possibilities.', archetype: 'Creator' },
      { id: 'c', text: 'Setting deadlines, defining key milestones, and establishing success metrics.', archetype: 'Leader' },
      { id: 'd', text: 'Connecting with key stakeholders to understand their needs and expectations.', archetype: 'Supporter' },
    ],
  },
  {
    id: 9,
    prompt: 'Under high stress or tight time constraints, what happens to your demeanor?',
    scenario: 'Crunch time with high stakes.',
    options: [
      { id: 'a', text: 'Become very quiet, calculating, and laser-focused on details.', archetype: 'Thinker' },
      { id: 'b', text: 'Seek fresh inspiration or an unconventional shortcut to break tension.', archetype: 'Creator' },
      { id: 'c', text: 'Step up with commanding energy and direct instructions.', archetype: 'Leader' },
      { id: 'd', text: 'Offer comfort, share burdens, and check that nobody is burning out.', archetype: 'Supporter' },
    ],
  },
  {
    id: 10,
    prompt: 'What is your ultimate definition of a successful life or career?',
    scenario: 'Reflecting on what matters most in the long run.',
    options: [
      { id: 'a', text: 'Mastering deep knowledge and making sense of how the world works.', archetype: 'Thinker' },
      { id: 'b', text: 'Creating things that never existed before and inspiring others.', archetype: 'Creator' },
      { id: 'c', text: 'Achieving significant goals, overcoming challenges, and leaving an impact.', archetype: 'Leader' },
      { id: 'd', text: 'Building meaningful relationships and making people feel loved and supported.', archetype: 'Supporter' },
    ],
  },
];
