# 로컬 웹 연동 검증 결과 — 2026-11-03

대상: `Reon-local-test`, `local/integration`. 기존 작업 폴더 및 GitHub는 변경하지 않았습니다. 변경 코드는 커밋/푸시하지 않았습니다.

## 실제 사용자 UI 검증 (Safari)

| 흐름 | 결과 |
|---|---|
| Google 실제 로그인 → 사용자 정보 | 성공. 사용자 직접 계정 선택 후 앱의 실제 사용자 화면 확인 |
| YouTube Music 링크 음악 조회 | Live Forever / Don't Look Back In Anger 실제 정보 조회 성공 |
| Moment 생성·목록·상세 | 서로 다른 두 곡으로 테스트 기록 4개 저장·조회 성공 |
| 메모 수정 및 새로고침 유지 | 성공, 서버에서 다시 읽어도 수정된 메모 유지 |
| 삭제 | 별도 생성한 5번 테스트 기록만 삭제. 목록 제거 및 직접 상세 주소에서 찾을 수 없음 확인 |
| Memory 자동 생성 | 4개 기록으로 11월 시간대 Memory 생성. 상세에 실제 4개 기록과 메모 표시 |
| 읽음 처리 | 상세 진입 후 목록의 NEW 표시 해제 |
| 변경 후 재분석 | 추가·삭제 후 같은 Memory ID 1, 최종 4개 기록 유지 |
| YouTube OAuth | 사용자 동의 후 프론트 콜백 처리 및 원래 Memory 상세로 복귀 성공 |
| 비공개 플레이리스트 생성 | 실제 원격 API에서 2곡·입력 순서 일치·private 확인 |
| 재시작/반복 생성 요청 | 기존 결과 반환, 원격 2곡 유지 |
| 실제 부분 실패·복구 | 별도 10월 기록 6개/Memory 4로 첫 곡 뒤 의도적 실패. UI 복구 버튼으로 같은 플레이리스트에 두 번째 곡 추가 |
| 복구 후 반복 요청 | 같은 Playlist ID, 원격 곡 수 2, 중복 없음, 원본 순서 및 private 유지 |
| 로그아웃 | 로그인 화면 복귀. Memory 상세 직접 접근 시 로그인 화면으로 이동 |

부분 실패 원격 확인: 복구 전 1곡/원본 2곡 → 복구 후 2곡/순서 일치/private. Playlist ID는 전후 동일합니다. 원격 목록 및 상태는 사용자 소유 export만 읽는 dev 전용 API로 조회했습니다. 원격 데이터를 모의 처리하지 않았습니다.

- [첫 플레이리스트 확인](playlist-verification.png)
- [복구 전](recovery-before.png)
- [복구 후 및 반복 요청 확인](recovery-after.png)

## 자동 검사

- Java: 전체 146개 중 **138개 통과**, opt-in 8개 제외, 실패/오류 0. 제외 대상은 별도 MySQL 6개 및 실제 엔진 opt-in 2개입니다. 이번 UI 검증은 별도 H2 파일 DB와 실제 Python 엔진/YouTube를 사용했습니다.
- TypeScript noEmit: 성공
- Expo lint: 오류/경고 0
- 프론트 서비스 계약 테스트: 7개 통과
- 웹 정적 export: 성공, 경로 17개
- Python: 준비 단계에서 67개 통과. 이후 엔진 소스 변경 없음.
- git diff --check: 성공

## 상태와 범위

현재 Safari 앱은 로그아웃 상태입니다. 로컬 서버 18090/엔진 18091/프론트 18092는 실행 상태로 둡니다. 테스트 데이터는 별도 H2에 유지하며, Google 계정에는 이 검증에서 만든 비공개 플레이리스트 2개가 남습니다. 기존 MySQL 데이터는 사용하지 않았습니다. 위치 수집은 EXPO_PUBLIC_CAPTURE_LOCATION=false로 비활성화했습니다.

Google 설정은 같은 웹 클라이언트에 localhost/18092 원본 및 /youtube-callback URI를 등록한 뒤 확인했습니다. 초기 origin_mismatch와 redirect_uri_mismatch는 설정 반영 후 해소됐습니다.

YouTube Music 웹 링크는 이 브라우저에서 Premium 안내로 이동했습니다. 결제/가입/재생 검증은 진행하지 않았으며 일반 YouTube 링크를 별도로 제공합니다. 원격 생성·곡 수·순서·비공개 상태는 실제 YouTube API로 검증했습니다.

이 결과는 웹 연동 검증입니다. iOS/Android 네이티브 Google 로그인·공유 진입·네이티브 OAuth 복귀·실기기 네트워크는 별도 검증이 필요합니다. 개발 진단 페이지 /local-check와 dev API는 검증용이며 실제 서비스 UI가 아닙니다.
