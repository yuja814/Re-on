# Re:on 로컬 통합 실행·검증

원본 개발 폴더/GitHub는 변경하지 않았습니다. 이 폴더의 `local/integration`에서만 팀 브랜치를 합치고 웹 연동을 수정했습니다. 기능 변경은 아직 커밋/푸시하지 않았습니다.

## 실행

각각 별도 터미널에서 이 폴더를 기준으로 실행합니다.

```bash
./local-test/engine.sh
./local-test/backend.sh
./local-test/frontend.sh
```

- 프론트: http://localhost:18092
- 백엔드 검증: http://localhost:18090/dev/verify
- 엔진: http://localhost:18091/health
- 데이터: 이 폴더의 backend/data/reon H2. 기존 MySQL/사용자/플레이리스트는 복사하지 않았습니다.
- 중지: 각 터미널에서 Ctrl+C.

## 환경 설정

backend/.env에는 기존 Google·YouTube 설정만 복사했습니다. 기존 DB 접속 정보는 복사하지 않았습니다. .env와 프론트 .env.local은 Git에서 제외됩니다.

Cloud의 프론트 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID와 같은 웹 OAuth 클라이언트에서 승인된 JavaScript 원본에 http://localhost 및 http://localhost:18092, 승인된 리디렉션 URI에 http://localhost:18092/youtube-callback을 추가해야 합니다. 로그인은 GIS 공식 버튼의 실제 ID 토큰을 서버에서 검증합니다. origin_mismatch는 같은 클라이언트의 등록 주소를 확인하세요.

백엔드 CORS는 REON_WEB_ALLOWED_ORIGINS=http://localhost:18092에 한정합니다. 다른 브라우저 원본은 기본 거부하며 메모리 API 인증보다 앞에서 사전 요청을 처리합니다. 실제 요청은 여전히 Bearer 세션이 필요합니다.

## 이번 로컬 변경

- 타입/CSS 선언/React 린트 오류 정리
- 웹 가짜 로그인 제거, 실제 Google 공식 버튼 연결 및 로그아웃 자동 선택 해제
- 공통 API 클라이언트의 부분 실패 URL/성공 곡 수 보존, 응답 본문까지 timeout 적용, 오래된 401이 새 세션을 지우지 않도록 처리
- Memory 임시 토큰/고정 서버 주소 제거, momentCount/title 필드 정리, 소유자 인증·상세·읽음 연결
- Memory 목록 재진입 시 갱신, 읽음 실패 재시도와 빈 상태 표시
- RE:PLAY 생성/복구 결과·오류 표시, 사용자 클릭으로 YouTube 링크 열기
- YouTube 동의 후 웹 콜백, sessionStorage state 대조, 중복 코드 교환 방지, 콜백 URL의 code/state 제거

## 검사

```bash
./node_modules/.bin/tsc --noEmit
npm run lint
node --test local-test/service-contract.test.cjs
cd backend
./gradlew test bootJar
```

타입 검사/린트 오류와 경고 0, 프론트 서비스 계약 7개 통과. 최종 백엔드 전체 146개 중 138개 통과(opt-in 8개 제외), 실패 0. 엔진 Python 67개는 초기 준비 시 통과했습니다. 운영 Google 검증은 모의 처리하지 않았습니다.

## 실제 사용자 흐름 검증 (진행 중)

1. Google 로그인 → 목록 → 내 정보 확인.
2. /moment/new?url=<인코딩한 YouTube Music URL>로 공유 기록 작성 → 저장 → 상세 → 메모 수정 → 삭제.
3. 반복 기록 생성 후 자동 분석 → Memory 목록/상세/읽음 확인.
4. Memory RE:PLAY → YouTube 권한 연결 → 동의 후 복귀 → 생성 → 실제 플레이리스트 확인.
5. 부분 실패 시 동일 플레이리스트 복구와 중복 없음 확인, 로그아웃 후 보호 API 401 확인.

실제 계정 로그인과 YouTube 동의 콜백 복귀를 확인했습니다. UI에서 음악 조회, 기록 생성·상세·메모 수정·새로고침 유지·삭제·삭제 후 직접 상세 접근 차단을 확인했습니다. 반복 기록 4개로 Memory 자동 생성·상세·읽음 표시 해제·동일 ID 재분석을 확인했습니다. 첫 플레이리스트는 원격 API에서 2곡/원본 순서 일치/비공개를 확인했습니다. 부분 실패 복구·반복 요청·최종 로그아웃 및 보호 화면 차단까지 실제 UI 검증을 완료했습니다. 자세한 근거는 local-test/RESULTS.md에 있습니다. 실제 위치 권한은 사용자 선택이며 거부해도 위치 없이 기록할 수 있습니다.

네이티브 iOS/Android Google 로그인과 YouTube 복귀 흐름은 이번 웹 검증과 별도입니다. 플랫폼 OAuth·개발 빌드 설정 후 검증해야 합니다. 이번 YouTube 브라우저 연결은 웹에 구현했습니다.


## 검증 완료 및 남은 범위

웹 주요 연동 흐름의 실제 UI 검증을 완료했습니다. [상세 결과](local-test/RESULTS.md)를 확인하세요. 현재 앱은 로그아웃 상태입니다. 로컬 H2에 테스트 기록과 계정 정보가 남으며 Google 계정에는 검증용 비공개 플레이리스트 2개가 생성됐습니다. 원본 폴더와 기존 MySQL은 변경하지 않았습니다.

위치 수집은 이 로컬 환경에서 EXPO_PUBLIC_CAPTURE_LOCATION=false로 껐습니다. 개발 전용 /local-check?memoryId=<ID> 화면은 실제 YouTube 목록·순서·비공개 상태를 읽어 확인합니다. ‘별도 10월 기록으로 부분 실패 검증 준비’를 다시 누르면 6개 테스트 기록이 추가되므로 단순 결과 조회 시에는 누르지 않습니다.

네이티브 실기기 검증 및 GitHub 반영은 아직 수행하지 않았습니다.
