export type Grade = { correct: boolean; answer: string };
type Attempt = Grade & { id: string; input: string; round: number };

export type Quiz = {
  ids: string[];
  index: number;
  wrong: string[];
  round: number;
  attempts: Attempt[];
};

export type Progress = {
  learned: Record<string, boolean>;
  difficult: Record<string, boolean>;
  batch: number;
  position: number;
  phase: 'learn' | 'review' | 'home';
  review: string[];
  reviewIndex: number;
  pending: number[];
  quiz: Quiz | null;
};

export function emptyProgress(): Progress {
  return {
    learned: {},
    difficult: {},
    batch: 0,
    position: 0,
    phase: 'home',
    review: [],
    reviewIndex: 0,
    pending: [],
    quiz: null,
  };
}

export function classifyWord(progress: Progress, ids: string[], known: boolean): Progress {
  const next = structuredClone(progress);
  const id = ids[next.position];
  next.learned[id] = true;
  if (!known) next.difficult[id] = true;

  next.position++;
  if (next.position === ids.length) {
    next.review = ids.filter(id => next.difficult[id]);
    next.reviewIndex = 0;
    next.pending.push(next.batch);
    next.batch++;
    next.position = 0;
    next.phase = next.review.length ? 'review' : 'home';
  }
  return next;
}

export function activeQuizIds(quiz: Quiz): string[] {
  return quiz.round === 0 || !quiz.wrong.length ? quiz.ids : quiz.wrong;
}

export function applyGrade(progress: Progress, input: string, grade: Grade): Progress {
  const next = structuredClone(progress);
  const quiz = next.quiz;
  if (!quiz) return next;

  const ids = activeQuizIds(quiz);
  const id = ids[quiz.index];
  quiz.attempts = [...(quiz.attempts ?? []), { id, input, round: quiz.round, ...grade }];
  if (grade.correct) {
    delete next.difficult[id];
  } else {
    next.difficult[id] = true;
    if (quiz.round === 0) quiz.wrong.push(id);
  }

  quiz.index++;
  if (quiz.index === ids.length) {
    if (quiz.round === 0 && quiz.wrong.length) {
      quiz.index = 0;
      quiz.round = 1;
    } else {
      next.quiz = null;
    }
  }
  return next;
}
