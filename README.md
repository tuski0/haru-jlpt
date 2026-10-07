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

**검색·분석 → 일본어 분석**으로 임의의 일본어를 설명합니다. Gemini가 뜻·문법을 분석하고 한자 획수·부수·읽기는 사전에서 조회합니다. 서버 설정 전에는 기본 학습과 단어장 검색을 바로 사용할 수 있습니다.

분석 서버는 별도 Cloudflare Workers에 배포합니다. [설정 안내](SETUP.md)를 따라 무료 계정과 Gemini Secret·개인 연결 암호를 준비하세요. API 키는 Pages나 공개 저장소에 넣지 않습니다. 기본 분석 제한은 분당 5회·하루 100회이며 Gemini 이용량과 요금은 Google 프로젝트에 따릅니다.

[분석 서버 ZIP](haru-jlpt-worker.zip)에 포함된 `worker` 폴더의 코드는 배포 준비 상태이며 실제 서버는 본인 계정에 배포한 뒤 연결해야 합니다. 입력한 분석 문장은 서버와 Gemini로 전송되며 학습 기록은 브라우저 안에 저장됩니다.
