'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import data from '../jlpt-words.json';
import { activeQuizIds, applyGrade, classifyWord, emptyProgress, type Grade, type Progress } from '../lib/progress';
import { questionHint, wordsForLevel, type Level } from '../lib/vocabulary';

const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const wordsById = new Map(data.words.map(word => [word.id, word]));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = url && key ? createClient(url, key) : null;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!client) {
    return <main className="center"><h1>설정이 필요합니다</h1><p>Supabase 연결 정보를 설정한 후 다시 실행해 주세요.</p></main>;
  }
  if (!ready) return <main className="center">불러오는 중...</main>;
  if (!session) return <SignIn client={client} />;
  return <StudyHome key={session.user.id} client={client} session={session} />;
}

function SignIn({ client }: { client: SupabaseClient }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const credentials = {
      email: String(fields.get('email')).trim(),
      password: String(fields.get('password')),
    };
    setMessage('');
    setBusy(true);
    try {
      const result = signup
        ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: window.location.origin } })
        : await client.auth.signInWithPassword(credentials);

      if (result.error) setMessage(result.error.message);
      else if (signup && !result.data.session) setMessage('가입 확인 이메일을 확인한 뒤 로그인하세요.');
    } catch {
      setMessage('연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="brand">하루 단어 <span>JLPT</span></div>
      <h1>{signup ? '회원가입' : '로그인'}</h1>
      <form key={String(signup)} className="authform" onSubmit={authenticate}>
        <label>이메일<input name="email" type="email" required autoComplete="email" /></label>
        <label>비밀번호<input name="password" type="password" required minLength={6} autoComplete={signup ? 'new-password' : 'current-password'} /></label>
        {message && <p role="status">{message}</p>}
        <button disabled={busy}>{signup ? '회원가입' : '로그인'}</button>
      </form>
      <button className="link" disabled={busy} onClick={() => { setSignup(!signup); setMessage(''); }}>
        {signup ? '로그인 화면으로' : '회원가입 화면으로'}
      </button>
    </main>
  );
}

function StudyHome({ client, session }: { client: SupabaseClient; session: Session }) {
  const [level, setLevel] = useState<Level>('N5');
  const [busy, setBusy] = useState(false);

  return (
    <main className="shell">
      <header>
        <div className="brand">하루 단어 <span>JLPT</span></div>
        <button className="link" disabled={busy} onClick={() => client.auth.signOut()}>로그아웃</button>
      </header>
      <div className="top">
        <h1>JLPT 단어장</h1>
        <label className="level">급수 선택
          <select disabled={busy} value={level} onChange={event => setLevel(event.target.value as Level)}>
            {levels.map(level => <option key={level}>{level}</option>)}
          </select>
        </label>
      </div>
      <Study key={level} client={client} session={session} level={level} onBusyChange={setBusy} />
      <footer>
        단어 출처 · <a href={data.source.sourceNotice}>Haru JLPT 및 원본 데이터 안내</a>
        <p>급수는 비공식 분류이며 한국어 뜻은 AI 번역입니다.</p>
      </footer>
    </main>
  );
}

function Study({ client, session, level, onBusyChange }: {
  client: SupabaseClient;
  session: Session;
  level: Level;
  onBusyChange: (busy: boolean) => void;
}) {
  const [record, setRecord] = useState<{ state: Progress; version: number | null }>();
  const [loadKey, setLoadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Grade>();
  const mutation = useRef(false);
  const userId = session.user.id;
  const levelWords = useMemo(() => wordsForLevel(data.words, level), [level]);
  const hints = useMemo(
    () => new Map(levelWords.map(word => [word.id, questionHint(word, levelWords)])),
    [levelWords],
  );

  useEffect(() => {
    let active = true;
    client.from('study_progress').select('state,version')
      .eq('user_id', userId).eq('level', level).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError('저장된 학습 기록을 불러오지 못했습니다.');
        else setRecord({ state: { ...emptyProgress(), ...data?.state }, version: data?.version ?? null });
      });
    return () => { active = false; };
  }, [client, userId, level, loadKey]);

  function reloadProgress() {
    setError('');
    setRecord(undefined);
    setRevealed(false);
    setInput('');
    setFeedback(undefined);
    setLoadKey(key => key + 1);
  }

  async function mutate(getNext: () => Promise<Progress> | Progress): Promise<boolean> {
    if (!record || mutation.current) return false;
    mutation.current = true;
    setSaving(true);
    onBusyChange(true);
    setError('');
    try {
      const next = await getNext();
      const table = client.from('study_progress');
      const write = record.version === null
        ? table.insert({ user_id: userId, level, state: next, version: 1 })
        : table.update({ state: next, version: record.version + 1 })
          .eq('user_id', userId).eq('level', level).eq('version', record.version);
      const { data, error } = await write.select('version').maybeSingle();

      if (error?.code === '23505' || (!error && !data)) {
        throw new Error('다른 기기에서 학습 기록이 바뀌었습니다. 최신 기록을 불러와 주세요.');
      }
      if (error) throw new Error('학습 기록을 저장하지 못했습니다. 다시 시도해 주세요.');
      setRecord({ state: next, version: data.version });
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : '다시 시도해 주세요.');
      return false;
    } finally {
      mutation.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  }

  if (!record) {
    return error
      ? <div className="message error" role="alert">{error}<button className="link" onClick={reloadProgress}>다시 불러오기</button></div>
      : <p role="status">학습 기록을 불러오는 중...</p>;
  }

  const progress = record.state;
  const quiz = progress.quiz;
  const quizIds = quiz ? activeQuizIds(quiz) : [];
  const quizWord = quiz && wordsById.get(quizIds[quiz.index]);
  const batchWords = levelWords.slice(progress.batch * 30, (progress.batch + 1) * 30);
  const learning = progress.phase === 'learn';
  const current = learning ? batchWords[progress.position] : wordsById.get(progress.review[progress.reviewIndex]);
  const difficult = levelWords.filter(word => progress.difficult[word.id]);
  const learned = levelWords.filter(word => progress.learned[word.id]);
  const canAsk = (id: string) => hints.get(id)?.eligible === true;

  async function startQuiz(ids: string[], batch?: number) {
    const eligible = ids.filter(canAsk);
    const skipped = ids.length - eligible.length;
    const selected = batch === undefined ? eligible.slice(0, 30) : eligible;

    if (!selected.length) {
      setNotice('출제할 수 있는 단어가 없습니다.');
      return;
    }
    const saved = await mutate(() => ({
      ...progress,
      phase: 'home',
      quiz: { ids: shuffle(selected), index: 0, wrong: [], round: 0, attempts: [] },
      pending: progress.pending.filter(index => index !== batch),
    }));
    if (saved) {
      setInput('');
      setNotice(batch !== undefined && skipped ? `뜻이 겹쳐 구분하기 어려운 ${skipped}개 단어를 보류했습니다.` : '');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!quizWord || !input.trim()) return;

    let grade: Grade;
    const saved = await mutate(async () => {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: quizWord.id, answer: input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '채점에 실패했습니다.');
      grade = result;
      return applyGrade(progress, input, grade);
    });
    if (saved) {
      setInput('');
      setFeedback(grade);
    }
  }

  async function classify(known: boolean) {
    const ids = batchWords.map(word => word.id);
    if (await mutate(() => classifyWord(progress, ids, known))) setRevealed(false);
  }

  async function advanceReview() {
    const reviewIndex = progress.reviewIndex + 1;
    const phase = reviewIndex >= progress.review.length ? 'home' : 'review';
    if (await mutate(() => ({ ...progress, phase, reviewIndex }))) setRevealed(false);
  }

  const clash = error.startsWith('다른 기기');
  const disabled = saving || clash;
  const hint = quizWord && hints.get(quizWord.id)?.hint;

  return (
    <>
      {error && <div className="message error" role="alert">{error}{clash && <button className="link" onClick={reloadProgress}>최신 기록 불러오기</button>}</div>}
      {notice && <div className="message" role="status">{notice}<button className="link" onClick={() => setNotice('')}>닫기</button></div>}
      {feedback ? (
        <section className="panel study">
          <div className="wordarea">
            <p>{feedback.correct ? '정답이에요!' : '다시 기억해 봐요'}</p>
            <h2 lang="ja">{feedback.answer}</h2>
          </div>
          <button onClick={() => {
            setFeedback(undefined);
            if (!quiz) setNotice('테스트를 마쳤습니다.');
          }}>{quiz ? '다음 문항' : '테스트 마치기'}</button>
        </section>
      ) : quizWord ? (
        <section className="panel study">
          <div className="row">
            <span className="tag">{quiz.round ? '오답 다시 풀기' : '타이핑 테스트'}</span>
            <span className="muted">{quiz.index + 1} / {quizIds.length}</span>
          </div>
          <div className="wordarea">
            <p className="muted">한국어 뜻을 보고 일본어 표기를 입력해 주세요</p>
            <h2>{quizWord.ko}</h2>
            {hint && <p>힌트 · {hint}</p>}
          </div>
          <form onSubmit={submit} onKeyDown={event => {
            if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
          }}>
            <input autoFocus aria-label="일본어 답안" value={input} onChange={event => setInput(event.target.value)} />
            <button disabled={disabled || !input.trim()}>정답 확인</button>
          </form>
        </section>
      ) : progress.phase !== 'home' && current ? (
        <section className="panel study">
          <div className="row">
            <span className="tag">{learning ? '새 단어 학습' : '모르는 단어 다시 보기'}</span>
            <span className="muted">{learning ? `${progress.position + 1} / ${batchWords.length}` : `${progress.reviewIndex + 1} / ${progress.review.length}`}</span>
          </div>
          <div className="wordarea">
            <h2 lang="ja">{current.w}</h2>
            {revealed && <>
              <p lang="ja" className="reading">{current.r}</p>
              <p>{current.ko}</p>
              {current.note && <p className="muted">{current.note}</p>}
            </>}
          </div>
          {!revealed ? <button onClick={() => setRevealed(true)}>읽기·뜻 보기</button> : learning ? (
            <div className="actions">
              <button className="secondary" disabled={disabled} onClick={() => classify(false)}>모르는 단어</button>
              <button disabled={disabled} onClick={() => classify(true)}>이해했음</button>
            </div>
          ) : <button disabled={disabled} onClick={advanceReview}>다음 단어</button>}
        </section>
      ) : (
        <>
          <div className="stats">
            <div><span>학습한 단어</span><strong>{learned.length}<small>개</small></strong></div>
            <div><span>다시 볼 단어</span><strong>{difficult.length}<small>개</small></strong></div>
            <div><span>다음 학습</span><strong>{batchWords.length ? progress.batch + 1 : '완료'}{batchWords.length > 0 && <small>번째 묶음</small>}</strong></div>
          </div>
          <section className="panel">
            <h2>새 단어 학습</h2>
            <p className="muted">원본 순서대로 한 번에 30개씩 살펴봅니다.</p>
            <button disabled={disabled || !batchWords.length} onClick={() => mutate(() => ({ ...progress, phase: 'learn' }))}>
              {batchWords.length ? '학습 시작' : '모든 단어 학습 완료'}
            </button>
          </section>
          <section className="panel">
            <h2>복습하기</h2>
            <p className="muted">학습한 단어를 일본어 타이핑으로 확인하세요.</p>
            <div className="actions">
              <button disabled={disabled || !difficult.some(word => canAsk(word.id))} onClick={() => startQuiz(difficult.map(word => word.id))}>어려운 단어 복습</button>
              <button className="secondary" disabled={disabled || !learned.some(word => canAsk(word.id))} onClick={() => startQuiz(shuffle(learned.map(word => word.id)))}>학습한 단어 복습</button>
            </div>
          </section>
          <section className="panel">
            <h2>학습한 묶음 테스트</h2>
            {progress.pending.length ? <div className="batchlist">
              {progress.pending.map(batch => (
                <button className="secondary" disabled={disabled} key={batch} onClick={() => startQuiz(
                  levelWords.slice(batch * 30, (batch + 1) * 30).map(word => word.id), batch,
                )}>{batch + 1}번째 묶음 테스트</button>
              ))}
            </div> : <p className="muted">학습을 마친 묶음이 여기에 표시됩니다.</p>}
          </section>
        </>
      )}
    </>
  );
}
