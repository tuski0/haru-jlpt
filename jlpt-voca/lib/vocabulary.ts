export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type Word = { id: string; w: string; r: string; ko: string; levels: string[]; order: Record<string, number>; note?: string };
export function wordsForLevel(words: Word[], level: Level): Word[] {
  return words.filter(word => word.levels.includes(level)).sort((a, b) => a.order[level] - b.order[level]);
}
export function wordBatch(words: Word[], level: Level, batchIndex: number): Word[] {
  if (!Number.isInteger(batchIndex) || batchIndex < 0) return [];
  return wordsForLevel(words, level).slice(batchIndex * 30, (batchIndex + 1) * 30);
}
export function isCorrectAnswer(input: string, word: Word): boolean {
  return input.trim().normalize('NFC') === word.w.trim().normalize('NFC');
}
export function questionHint(word: Word, levelWords: Word[]): { hint: string; eligible: boolean } {
  const matches = levelWords.filter(other => other.ko.trim() === word.ko.trim());
  if (matches.length < 2) return { hint: '', eligible: true };
  const chars = Array.from(word.r);
  const hint = `${chars[0]}・${chars.length}글자`;
  const unique = matches.filter(other => Array.from(other.r)[0] === chars[0] && Array.from(other.r).length === chars.length).length === 1;
  const exposes = word.w === word.r && chars.length <= 1;
  return { hint, eligible: unique && !exposes };
}
