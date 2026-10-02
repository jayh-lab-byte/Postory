# Postory

사진과 짧은 메모로 블로그, 인스타그램, 페이스북, X, 스레드, 쇼츠 패키지를 만드는 웹앱입니다. 입력하지 않은 경험은 본문에 넣지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173` 을 엽니다.

작업과 사진은 이 브라우저의 IndexedDB에 저장됩니다. 외부 API 키 없이도 사실 구분, 채널별 글, 복사, 사진 다운로드까지 동작합니다.

`.env.local`에 `OPENAI_API_KEY`를 넣으면 스토리와 문단 다시 쓰기가 서버에서 작성됩니다. `PEXELS_API_KEY`는 보조 사진, `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET`은 검색 보조 키워드에 쓰입니다. 키는 브라우저 번들에 포함되지 않습니다. 연결 여부는 설정의 `/api/health`로 확인합니다.
