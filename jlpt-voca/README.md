# 하루 단어 · JLPT

N5~N1 단어를 30개씩 학습하고 일본어 표기를 타이핑해 복습하는 웹앱입니다.

## 실행

Node.js 22.18 이상과 Supabase 프로젝트가 필요합니다.

1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. Supabase 프로젝트의 URL과 Publishable key를 `.env.local`에 설정합니다. `.env.example`을 참고하세요. 비밀 키는 사용하지 않습니다.
3. Supabase Auth에서 이메일/비밀번호 로그인을 활성화합니다. 가입 확인 이메일 사용 여부는 Supabase 인증 설정에 따릅니다.
4. `npm install`, `npm run dev`를 실행한 뒤 표시된 주소를 엽니다.

`npm test`로 급수별 순서, 마지막 묶음, 표기 채점, 모호한 문항, 테스트 이어하기와 오답 재출제를 확인하고, `npm run build`로 배포 빌드를 확인합니다.

## 배포

1. Vercel에서 저장소를 가져와 Next.js 프로젝트로 연결합니다.
2. `.env.example`에 있는 두 환경 변수를 Vercel 프로젝트에 등록한 후 배포합니다. `vercel.json`이 채점 서버의 실행 지역을 서울(`icn1`)로 지정합니다.
3. Supabase의 Authentication → URL Configuration에서 앱 배포 주소를 Site URL과 Redirect URLs에 등록합니다. 로컬에서도 회원가입을 확인하려면 로컬 주소를 Redirect URLs에 추가합니다.

학습 상태는 사용자와 급수별로 저장됩니다. 다른 기기에서 동시에 같은 급수를 변경하면 최신 기록을 다시 불러올 수 있습니다.

## 단어 출처

단어 데이터는 [Haru JLPT](https://github.com/tuski0/haru-jlpt/blob/26d96f9ef486e419a3b5f1845d32ccf65110d167/README.md)에서 가져왔습니다. 원 출처에는 Robin Pourtaud / Tanos JLPT와 EDRDG의 JMdict / KANJIDIC2가 포함됩니다. Haru JLPT는 Kaggle 자료에 CC BY-NC 4.0과 CC BY가 다르게 표기되어 있다고 설명하며 개인 비상업 학습용으로 안내합니다. EDRDG 자료는 CC BY-SA 4.0이며 한국어 뜻 추가 및 중복·읽기·표기 정리가 이루어졌습니다. 자세한 출처와 사용 조건은 위 링크와 `jlpt-words.json`의 source 항목을 참고하세요. 급수는 비공식이며 한국어 뜻은 AI 번역으로 전체 전문가 검수를 거치지 않았습니다.
