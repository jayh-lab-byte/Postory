# Postory

사진과 짧은 메모로 블로그, 인스타그램, 페이스북, X, 스레드, 쇼츠 패키지를 만드는 웹앱입니다. 입력하지 않은 경험은 본문에 넣지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://127.0.0.1:5173](http://127.0.0.1:5173) 을 엽니다.

```bash
npm run build
npm run preview
```

## 사용 흐름

1. 홈에서 목적과 짧은 메모를 적거나, 제작 화면에서 사진과 메모를 넣습니다.
2. 메모 문장은 확인된 사실, 사진 수는 관찰된 사실, 아직 모르는 정보는 구분해서 보여 줍니다.
3. 하나의 이야기에서 채널별 글을 만듭니다.
4. 스튜디오에서 문장을 고치고, 사실과 어긋나는 표현을 확인한 뒤 복사하거나 사진을 받습니다.

사진은 최대 10장입니다. 작업과 사진은 이 브라우저의 IndexedDB에 저장됩니다. 외부 API 키 없이도 사실 구분, 채널별 글, 복사, 사진 다운로드까지 동작합니다.

## 화면

| 경로 | 하는 일 |
|---|---|
| `/` | 최근 작업, 퀵 크리에이트, 브랜드 요약 |
| `/create` | 목적, 사진, 메모, 사실 구분 |
| `/projects/:id` | 이야기와 채널 글 편집, 점검, 복사 |
| `/contents` | 저장된 콘텐츠 목록 |
| `/brand` | 표시 이름과 한 줄 소개 |
| `/settings` | API 연결 상태 |

## 환경 변수

키는 `.env.local`에 두고, 브라우저 번들에 넣지 않습니다. 연결 여부는 설정의 `/api/health`로 확인합니다.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PEXELS_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

- `OPENAI_API_KEY`: 스토리와 문단 다시 쓰기. 없거나 호출이 실패하면 이 기기의 작성기로 글을 만듭니다.
- `PEXELS_API_KEY`: 보조 사진 검색.
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 검색 보조 키워드.

## 기술

React, Vite, React Router, Tailwind CSS. 개발 서버의 API는 Vite 미들웨어로 동작하고, 배포용 엔트리 포인트는 `api/[...path].js`입니다.
