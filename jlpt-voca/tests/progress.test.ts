import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeQuizIds, applyGrade, classifyWord, emptyProgress } from '../lib/progress.ts';

test('the final word in a short batch queues one test and only unknown words for review', () => {
  const words = ['one', 'two'];
  const state = { ...emptyProgress(), phase: 'learn' as const };
  const first = classifyWord(state, words, false);
  assert.equal(first.position, 1);
  const last = classifyWord(first, words, true);
  assert.deepEqual(last.learned, { one: true, two: true });
  assert.deepEqual(last.review, ['one']);
  assert.deepEqual(last.pending, [0]);
  assert.equal(last.batch, 1);
  assert.equal(last.position, 0);
  assert.equal(last.phase, 'review');
});

test('a saved answer resumes at the next question and incorrect words are retried once', () => {
  const state = {
    ...emptyProgress(),
    difficult: { two: true },
    quiz: { ids: ['one', 'two'], index: 0, wrong: [], round: 0, attempts: [] },
  };
  const first = applyGrade(state, 'wrong', { correct: false, answer: '壱' });
  assert.equal(first.quiz.index, 1);
  assert.deepEqual(first.quiz.attempts.map(a => a.input), ['wrong']);

  const resumed = JSON.parse(JSON.stringify(first));
  const retry = applyGrade(resumed, '弐', { correct: true, answer: '弐' });
  assert.deepEqual(retry.quiz.ids, ['one', 'two']);
  assert.deepEqual(activeQuizIds(retry.quiz), ['one']);
  assert.equal(retry.quiz.round, 1);
  assert.deepEqual(retry.difficult, { one: true });

  const finished = applyGrade(retry, 'wrong again', { correct: false, answer: '壱' });
  assert.equal(finished.quiz, null);
  assert.deepEqual(finished.difficult, { one: true });
  assert.deepEqual(applyGrade(retry, '壱', { correct: true, answer: '壱' }).difficult, {});
});
