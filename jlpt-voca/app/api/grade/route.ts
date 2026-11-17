import { createClient } from '@supabase/supabase-js';
import data from '../../../jlpt-words.json';
import { isCorrectAnswer } from '../../../lib/vocabulary';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!url || !key || !token) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const supabase = createClient(url, key);
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || typeof body.answer !== 'string') return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const word = data.words.find(item => item.id === body.id);
  if (!word) return Response.json({ error: '단어를 찾을 수 없습니다.' }, { status: 404 });
  return Response.json({ correct: isCorrectAnswer(body.answer, word), answer: word.w });
}
