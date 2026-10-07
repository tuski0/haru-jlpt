# 하루 단어 · JLPT

N5~N1 단어를 50개/100개 세트로 외우는 개인용 단어장입니다. 한국어 뜻·히라가나 테스트, 검색·한자 상세, 브라우저 기록 저장과 백업을 제공합니다.

**테스트** 탭에서 급수와 50개/100개 세트를 선택해 한국어 뜻 또는 히라가나 읽기를 입력합니다. 새 테스트의 문제 순서는 매번 랜덤으로 섞이며, 중간에 이어서 풀면 저장된 순서를 유지합니다. 플래시카드는 원본 단어 순서대로 학습합니다.

이 폴더는 GitHub Pages에서 그대로 제공할 정적 사이트입니다. 저장소 Settings → Pages → Deploy from a branch → main / (root)를 선택하세요.

학습 기록은 브라우저에 저장되며 서버로 보내지 않습니다. 사이트 주소가 바뀌면 이전 기록은 백업 불러오기로 옮기세요.

## 데이터 출처와 조건

- Robin Pourtaud / Tanos JLPT, [JLPT vocabulary by level](https://www.kaggle.com/datasets/robinpourtaud/jlpt-words-by-level). Kaggle 라이선스 항목 CC BY-NC 4.0, 설명문 CC BY로 표기가 다릅니다. 개인 비상업 학습용입니다.
- EDRDG [JMdict](https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html) / [KANJIDIC2](https://www.edrdg.org/wiki/KANJIDIC_Project.html), 2026-10-05 생성본. [사용 조건](https://www.edrdg.org/edrdg/licence.html), CC BY-SA 4.0. 한국어 뜻 추가 및 중복·읽기·표기 정리. 출처·수정 사실·해당 자료의 라이선스를 유지하세요.
- 원본 8,130행을 한국어로 번역하고 중복을 합친 8,025개 카드, 한자 13,108자(한국어 뜻이 미리 포함된 1,977자). 한국어 뜻은 AI 번역이며 전 항목 전문가 검수는 수행하지 않았습니다. 급수는 비공식 학습용 분류입니다.

## 일본어 단어·문장 분석

**설정 → Gemini API 설정**에서 본인 키를 입력한 뒤 **검색·분석 → 일본어 분석**으로 임의의 일본어를 설명합니다. 브라우저에서 Google Gemini를 직접 호출하며 별도 서버는 필요하지 않습니다. [설정 안내](SETUP.md)를 참고하세요.

키는 현재 브라우저 세션에만 보관하며 공개 코드와 기록 백업에 포함하지 않습니다. 입력 일본어는 Gemini로 전송되며 실제 API 사용량·요금은 본인 Google 프로젝트에 따릅니다. 기본 학습은 API 키 없이 사용할 수 있습니다.

프롬프트는 코드의 시스템 지침으로 고정하고 사용자 입력과 분리합니다. JSON Schema와 응답 검증을 적용합니다. 이는 의미 정확성이나 규칙 준수의 100% 보장이 아니며, 클라이언트 코드를 수정하는 사용자에 대한 접근 통제는 아닙니다. 획수·부수·한자 읽기는 사전 자료를 사용합니다.

`haru-jlpt-worker.zip`은 이전 Cloudflare 서버 방식의 보관 파일이며 현재 앱에는 필요하지 않습니다.
