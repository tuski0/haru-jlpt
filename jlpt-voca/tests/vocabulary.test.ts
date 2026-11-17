import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrectAnswer, questionHint, wordBatch, wordsForLevel, type Level, type Word } from '../lib/vocabulary.ts';
const words: Word[] = JSON.parse(readFileSync(new URL('../jlpt-words.json', import.meta.url), 'utf8')).words;
test('all levels retain their source order and complete 30-word batches', () => {
  for (const [level, count] of Object.entries({N5:718,N4:668,N3:2139,N2:1905,N1:2699})) {
    const sorted = wordsForLevel(words, level as Level);
    assert.equal(sorted.length, count);
    assert.ok(sorted.every((word, i) => i === 0 || sorted[i-1].order[level] < word.order[level]));
    const batches = Array.from({length: Math.ceil(count/30)}, (_, i) => wordBatch(words, level as Level, i)).flat();
    assert.deepEqual(batches, sorted);
  }
});
test('grading requires the written form and normalizes whitespace and Unicode', () => {
  const word = {w:'食べる'} as Word;
  assert.equal(isCorrectAnswer(' 食べる ', word), true);
  assert.equal(isCorrectAnswer('たべる', word), false);
  assert.equal(isCorrectAnswer('か\u3099', {w:'が'} as Word), true);
});
test('ambiguous meanings require a distinguishing hint', () => {
  const one = {id:'1',ko:'그쪽',w:'そちら',r:'そちら'} as Word;
  const two = {id:'2',ko:'그쪽',w:'そっち',r:'そっち'} as Word;
  assert.equal(questionHint(one,[one,two]).eligible,false);
  assert.equal(questionHint(one,[one]).eligible,true);
});
