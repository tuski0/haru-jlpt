# 하루 단어 · 일본어 분석 설정

현재 웹 앱은 https://tuski0.github.io/haru-jlpt/ 에서 사용할 수 있습니다. 플래시카드·테스트·단어장 검색은 바로 동작합니다. 임의의 일본어 단어·문장 분석은 아래 서버 설정을 한 번 완료하면 사용할 수 있습니다.

## 구성과 비용

화면은 GitHub Pages, 분석 서버는 Cloudflare Workers, 뜻·문법 설명은 Google Gemini입니다. EC2·Docker·별도 도메인은 필요하지 않습니다. 한자 획수·부수·읽기는 앱에 포함된 KANJIDIC2 사전에서 가져옵니다.

Cloudflare Workers Free와 SQLite Durable Objects의 무료 할당량으로 구성할 수 있습니다. Workers Free는 하루 100,000개 요청을 제공합니다. 이 앱은 개인 분석 요청을 기본 분당 5회·하루 100회로 제한합니다. 무료 요금제를 유지하며 시작하세요. Gemini의 무료 이용 가능 여부·모델 사용량은 본인 Google 프로젝트에 별도로 적용됩니다. Cloudflare가 무료라고 Gemini 호출까지 항상 무료인 것은 아닙니다.

## 1. 계정 준비

1. https://dash.cloudflare.com/ 에서 본인 Cloudflare 계정을 만들고 로그인합니다. Free 요금제로 시작합니다. 가입·약관 동의는 직접 진행하세요.
2. https://nodejs.org/ 에서 Node.js 24 LTS를 설치합니다. 이미 설치되어 있으면 건너뜁니다.
3. [분석 서버 ZIP](haru-jlpt-worker.zip)을 압축 해제합니다. 안의 `worker` 폴더를 터미널에서 엽니다. GitHub 저장소 전체를 내려받았다면 그 안의 `worker` 폴더를 사용해도 됩니다.

## 2. 서버 배포

아래 명령은 `worker.mjs`와 `wrangler.toml`이 있는 폴더에서 순서대로 실행합니다. macOS는 터미널, Windows는 PowerShell을 사용하세요.

```sh
npm ci
npx wrangler login
npx wrangler deploy
```

로그인 명령으로 열린 브라우저에서 본인 Cloudflare 계정으로 로그인하고 Wrangler의 배포 권한 요청을 확인합니다. 계정이 여러 개면 사용할 계정을 선택합니다. 첫 배포 때 Workers 하위 도메인 설정이 나오면 안내에 따라 이름을 정합니다.

마지막에 `https://haru-jlpt-api.본인하위도메인.workers.dev` 형식의 주소가 표시됩니다. 이 주소를 보관하세요. 이 단계에서는 비밀값이 없으므로 분석 요청은 거부되며 Gemini를 호출하지 않습니다. 사용량 제한용 SQLite Durable Object도 설정 파일에 따라 함께 생성됩니다.

## 3. 비밀값 등록

```sh
npx wrangler secret put GEMINI_API_KEY
```

입력을 요청하면 이미 가지고 있는 Gemini API 키를 직접 붙여넣습니다. 키를 명령 뒤에 쓰거나 GitHub 파일·웹 앱·채팅에 넣지 마세요.

웹 앱에서 본인만 분석을 요청하도록 Gemini 키와 다른 **개인 연결 암호**도 등록합니다. 24~256자의 무작위 문자열을 사용하세요. 다음 명령을 본인 터미널에서 실행하면 48자리 문자열이 생성됩니다.

```sh
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

생성된 문자열을 본인 암호 관리 도구 등에 보관하고 다음 명령의 입력창에 붙여넣습니다. 이 문자열이 `ANALYSIS_TOKEN`입니다.

```sh
npx wrangler secret put ANALYSIS_TOKEN
npx wrangler deploy
```

암호는 웹 앱에서도 동일하게 입력해야 합니다. Gemini 키와 혼동하지 마세요. 비밀값은 Cloudflare Secret에 저장되고 공개 저장소에는 포함되지 않습니다.

## 4. 웹 앱 연결과 첫 분석

1. https://tuski0.github.io/haru-jlpt/ 를 열고 **검색·분석 → 일본어 분석**을 선택합니다.
2. 상단 **설정 → 분석 연결 설정**에서 배포 때 받은 `https://…workers.dev` 기본 주소와 위에서 만든 개인 연결 암호를 입력합니다. 주소 뒤에 `/analyze`를 붙일 필요가 없습니다.
3. **연결 확인 · 저장**을 누릅니다.
4. `食べる` 또는 `私は図書館で日本語を勉強しています。`를 입력하고 **분석하기**를 누릅니다.

단어는 읽기·뜻·쓰임·예문과 한자 정보를, 문장은 전체 읽기·뜻과 구절별 조사·역할·문법을 표시합니다. 문맥에 따라 설명이 달라질 수 있습니다.

연결 확인은 서버 설정과 개인 암호만 확인하고 Gemini를 호출하지 않습니다. 실제 키·모델 이용 가능 여부는 첫 분석으로 확인합니다. 현재 제공한 코드의 로컬 검증은 테스트 응답을 사용했으며, 본인 키로 실제 Gemini 분석을 확인한 상태는 아닙니다.

Workers 주소는 해당 브라우저에, 개인 연결 암호는 현재 브라우저 세션에만 저장합니다. 브라우저 세션을 종료하면 암호를 다시 입력해야 할 수 있습니다. 학습 기록 백업에는 연결 암호가 들어가지 않습니다. **연결 해제**로 저장된 연결 설정을 지울 수 있습니다.

## 기본 설정

`wrangler.toml`에 아래 값이 준비되어 있습니다. 수정한 뒤 `npx wrangler deploy`를 실행하면 적용됩니다.

| 이름 | 기본값 | 설명 |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://tuski0.github.io` | 허용할 웹 앱 출처. `/haru-jlpt/` 경로와 끝 슬래시를 붙이지 않음 |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | 서버에서만 선택하는 분석 모델. 본인 프로젝트에서 지원되는 모델 필요 |
| `REQUESTS_PER_MINUTE` | `5` | 전체 개인 서버의 분당 분석 요청 제한 |
| `REQUESTS_PER_DAY` | `100` | 전체 개인 서버의 하루 분석 요청 제한. 한국 시간 자정에 초기화 |

실패한 Gemini 요청도 사용량 제한에 포함됩니다. 서버를 다시 배포해도 누적 횟수를 유지합니다. 같은 페이지에서 최근 동일 입력을 다시 분석하면 메모리 캐시를 사용합니다. 새로고침하면 캐시는 지워집니다. 한 번에 일본어 200자까지 입력할 수 있습니다.

키는 `GEMINI_API_KEY`, 연결 암호는 `ANALYSIS_TOKEN`이라는 Secret으로만 등록합니다. `wrangler.toml`의 일반 변수나 Pages HTML에 넣지 마세요. 이 서버는 개인용 암호를 사용하는 형태이며 여러 사용자용 로그인 서비스는 아닙니다.

## 오류가 나오면

| 안내 | 확인할 부분 |
|---|---|
| 연결 암호 확인 / 401 | Cloudflare의 `ANALYSIS_TOKEN`과 웹 앱 암호가 같은지 확인 |
| 허용되지 않은 사이트 / 403 | 실제 Pages 주소에서 접속했는지, `ALLOWED_ORIGINS`에 경로 없이 올바른 출처를 넣었는지 확인 |
| 서버 연결 실패 | 주소가 `https://…workers.dev`인지, 배포가 완료됐는지, 인터넷과 허용 출처 확인 |
| 서버 설정 필요 / 503 | 두 Secret과 `ANALYSIS_QUOTA` 바인딩을 확인. 제공 설정으로 다시 배포 |
| 사용량 초과 / 429 | 분당 제한이면 잠시 기다리기. 일일 제한이면 다음 한국 시간 자정 이후 사용. Gemini 쿼터도 Google AI Studio에서 확인 |
| Gemini 처리 실패 / 502 | 키 유효성·Gemini API 활성화·프로젝트 모델 이용 권한을 Google AI Studio에서 확인. 지원되는 모델로 변경 후 재배포 |
| 시간 초과 / 504 | 입력을 짧게 나누어 다시 분석 |
| 결과 형식 오류 | 모델 응답이 원문을 빠뜨렸거나 불완전한 경우. 짧은 입력으로 재시도 |
| 이미 Workers 이름이 존재 | 본인 계정에 같은 이름의 기존 서비스가 있다면 `name`을 새 이름으로 바꾸고 재배포 |

일반 브라우저로 `/health` 주소를 직접 열면 개인 암호가 없어 거부되는 것이 정상입니다. 웹 앱 설정 화면의 연결 확인 버튼을 이용하세요.

## 로컬 실행과 검증

서버 폴더에서 `npm test`로 인증·입력 검증·동시 요청 제한·일일 초기화·Gemini 오류 처리 테스트를 실행할 수 있습니다. 실제 API 키는 사용하지 않습니다.

로컬 분석까지 실행하려면 `worker` 폴더에 `.dev.vars`를 만들어 아래 두 비밀값을 직접 입력합니다. 이 파일은 Git에서 제외되어 있습니다.

```dotenv
GEMINI_API_KEY=본인키
ANALYSIS_TOKEN=본인의24자이상개인연결암호
```

다음 명령으로 서버를 실행합니다.

```sh
npx wrangler dev --port 8788 --var ALLOWED_ORIGINS:http://localhost:8000
```

앱 소스의 `dist` 폴더를 로컬 웹 서버로 실행합니다.

```sh
python3 -m http.server 8000 --directory dist
```

`http://localhost:8000`에서 웹 앱을 열고 Workers 주소에 `http://localhost:8788`을 입력합니다. 로컬 분석도 실제 Gemini를 호출하므로 Google 사용량이 발생할 수 있습니다. 파일을 직접 여는 오프라인 HTML에서는 플래시카드·테스트·단어장 검색을 사용할 수 있지만, AI 분석은 온라인 Pages나 로컬 웹 서버에서 사용하세요.

## 데이터와 운영

분석할 때 입력 일본어가 Cloudflare 서버와 Google Gemini로 전송됩니다. 이 코드에는 요청 문장·API 키·암호를 기록하는 로그나 데이터베이스가 없습니다. Durable Object에는 사용량 카운터만 저장합니다. Cloudflare와 Google의 플랫폼 처리·보관 정책은 별도로 적용됩니다. 웹 앱 학습 기록은 브라우저 안에 남습니다.

서버 수정 후에는 `npm test`와 `npx wrangler deploy --dry-run`으로 확인하고 `npx wrangler deploy`로 갱신합니다. API 키를 바꾸려면 다시 `npx wrangler secret put GEMINI_API_KEY`를 실행합니다. 서버를 유지할 EC2 인스턴스나 Docker 컨테이너는 없습니다.

공식 문서: [Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/), [Durable Objects 요금](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Secret 설정](https://developers.cloudflare.com/workers/configuration/secrets/), [Wrangler 명령](https://developers.cloudflare.com/workers/wrangler/commands/), [Gemini API 키](https://ai.google.dev/gemini-api/docs/api-key), [Gemini 모델](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).
