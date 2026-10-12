# Re:on Backend

Java 21 / Spring Boot 4.1.1 / Gradle Wrapper

구현된 API:

- `POST /api/v1/music/resolve`: YouTube Music 링크로 음악 정보 조회
- `POST /api/v1/auth/google`: Google ID 토큰 검증, 사용자 등록/갱신, Re:on 로그인 토큰 발급
- `GET /api/v1/users/me`: 로그인한 사용자 정보 조회
- `POST /api/v1/auth/logout`: 현재 로그인 세션 폐기

- `POST /api/v1/moments`: 음악 기록 생성 (201)
- `GET /api/v1/moments`: 내 기록 목록 / 연·월 필터 / 커서 페이지 이동
- `GET /api/v1/moments/{id}`: 내 기록 상세
- `PATCH /api/v1/moments/{id}`: 메모 수정
- `DELETE /api/v1/moments/{id}`: 기록 삭제 (204)

- `POST /api/v1/integrations/youtube/authorize`: 사용자별 OAuth 연결 시작 URL 발급
- `POST /api/v1/integrations/youtube/connect`: 인증 코드와 state로 권한 연결
- `GET /api/v1/integrations/youtube/status`: 연결 상태 확인 / 만료 시 토큰 갱신

- `POST /api/v1/memories/{memoryId}/playlist`: 저장된 활성 Memory로 RE:PLAY 생성

GitHub `minjoung` 브랜치의 Memory Engine v0.3.0을 가져와 Spring Boot 저장·조회와 연결했습니다. 원본은 `memory-engine/CORE_SOURCE.md`에 기록되어 있으며 분석 알고리즘은 변경하지 않았습니다. 자동 분석 스케줄·운영 Memory 목록/상세/읽음 API는 별도 구현 범위입니다.

## 로컬 실행

JDK 21을 설치하고 JAVA_HOME을 지정하세요. 이번 검증에 사용한 `/tmp/reon-jdk21/Contents/Home`은 임시 경로입니다. 장기 개발에는 별도로 설치한 JDK를 사용하세요.

```bash
cd backend
export JAVA_HOME=/tmp/reon-jdk21/Contents/Home
export GOOGLE_CLIENT_ID='웹 OAuth 클라이언트 ID.apps.googleusercontent.com'
export YOUTUBE_API_KEY='YouTube Data API 키'
./gradlew bootRun
```

backend 디렉터리에서 실행하면 `.env`를 Java properties 형식으로 자동 로딩합니다. `.env.example`을 복사해 `KEY=value` 형식으로 입력하세요. 따옴표나 `export`는 넣지 않습니다. OS 환경변수가 파일 값보다 우선하며 IDE 실행 환경변수도 사용할 수 있습니다.

기본 `dev` 프로필은 H2 파일 DB를 사용합니다. 사용자와 세션은 `backend/data`에 저장되어 재시작 후 유지됩니다. 이 폴더는 Git에서 제외합니다. 테스트는 별도의 메모리 DB를 사용합니다. H2 콘솔은 활성화하지 않습니다.

`GOOGLE_CLIENT_ID`는 프론트에서 ID 토큰을 요청할 때 사용하는 웹 클라이언트 ID와 일치해야 합니다. 로그인에는 Google 클라이언트 시크릿이 필요하지 않습니다. YouTube 권한 연결용 OAuth와 Re:on 로그인은 별도 기능입니다.

## RE:PLAY 플레이리스트 생성

```bash
curl -i -X POST http://localhost:8080/api/v1/memories/201/playlist \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

요청 본문은 없습니다. 사용자 ID, 곡 목록, 제목을 클라이언트에서 받지 않고 인증 세션과 해당 사용자가 소유한 Memory에서 읽습니다.

```json
{
  "playlistId":"PLxxxxxxxx",
  "playlistUrl":"https://music.youtube.com/playlist?list=PLxxxxxxxx",
  "title":"Memory 제목",
  "trackCount":11
}
```

YouTube OAuth 권한으로 **비공개 플레이리스트**를 생성하고 Memory의 곡을 순서대로 추가합니다. 같은 videoId는 첫 등장만 유지합니다. 같은 사용자·Memory의 생성 완료 요청은 기존 결과를 반환하므로 중복 클릭으로 새 플레이리스트가 생기지 않습니다. Memory가 이후 변경돼도 완료 결과는 재생성하지 않습니다.

제목은 1~150자, 설명은 최대 5000자, videoId는 음악 API와 같은 11자리입니다. 중복 제거 후 1~100곡을 허용하며 `replay.max-tracks`로 상한을 설정할 수 있습니다. 빈 Memory나 잘못된 음악 정보는 YouTube 호출 전에 거부합니다. 이번 구현은 동기식 생성으로 대량 곡 생성·백그라운드 작업은 포함하지 않습니다.

### Memory 담당자 연결 계약

`replay/memory/MemoryPlaylistSource.java`의 다음 인터페이스를 **Spring 컴포넌트**로 구현하세요.

```java
Optional<MemoryMusic> findOwned(Long memoryId, Long userId);
```

- 해당 사용자가 소유한 Memory만 조회하고, 없는 Memory와 타인 Memory는 `Optional.empty()` 반환
- `MemoryMusic(title, description, videoIds)`의 videoIds는 Memory가 의도한 재생 순서로 반환
- 현재 Moment에 저장된 실제 videoId를 사용하고, 사용자에게 받은 임의 제목·곡 목록으로 대체하지 않기
- `description`은 선택 가능(null), title과 videoIds는 필수

이 인터페이스는 이제 `memory/service/PersistedMemoryPlaylistSource`로 구현했습니다. 담당자의 Python 엔진이 생성한 Memory를 숫자 DB ID에 매핑해 읽습니다. 플레이리스트 생성 전에 해당 사용자의 해당 월 전체 기록을 다시 분석해 활성 상태와 삭제 반영을 확인합니다. 타인 Memory와 비활성 Memory는 조회 대상에서 제외합니다.

### 실패와 중복 생성 방지

생성 요청을 DB에 먼저 기록하고, 플레이리스트 ID와 성공이 확인된 곡 수를 단계별로 저장합니다. 외부 API 호출 중에는 전체 DB 트랜잭션을 유지하지 않습니다. 같은 사용자·Memory의 동시 요청은 DB 유니크 제약으로 중복 생성 진입을 방지합니다.

중간 실패 시 일반 오류 형식에 `playlistUrl`과 `confirmedTrackCount`를 추가합니다.

```json
{
  "code":"YOUTUBE_PLAYLIST_ERROR",
  "message":"플레이리스트 생성을 완료하지 못했습니다. 확인된 곡 수와 기존 결과를 확인해주세요.",
  "playlistUrl":"https://music.youtube.com/playlist?list=PLxxxxxxxx",
  "confirmedTrackCount":3
}
```

네트워크 오류는 Google에서 이미 성공한 뒤 응답만 유실된 경우도 있으므로 `confirmedTrackCount`는 실제 곡 수보다 작을 수 있습니다. 플레이리스트 생성 응답 자체가 유실되면 링크는 null입니다. 이 상태의 재요청은 `409 PLAYLIST_CREATION_INCOMPLETE`로 막으며 자동 재생성·곡 재추가·원격 삭제를 하지 않습니다. 서버가 중단된 생성 요청도 이 상태로 보호합니다.

**불완전한 생성의 자동 복구와 사용자 재시도/초기화 API는 아직 없습니다.** 운영 시 기존 YouTube 결과를 확인한 뒤 실패 기록을 수동으로 정리해야 합니다. 부분 생성 결과와 불확실성을 숨기지 않는 MVP 동작입니다.

YouTube 401 또는 부족한 권한은 `YOUTUBE_AUTH_REQUIRED`로 처리하고 연결에 재인증 표시를 저장합니다. 할당량 초과는 503, YouTube 채널 미생성은 409, 추가 불가 곡은 422입니다. 오류 응답에 Google access token이나 provider 원문은 노출하지 않습니다.

## YouTube OAuth 권한 연결

Re:on 로그인과 별도이며, 모든 API에 Re:on Bearer 토큰이 필요합니다. 웹 OAuth 클라이언트의 authorization code + PKCE 흐름을 사용합니다.

### 설정

```bash
export GOOGLE_CLIENT_ID='웹 OAuth 클라이언트 ID'
export GOOGLE_CLIENT_SECRET='같은 클라이언트의 시크릿'
export YOUTUBE_REDIRECT_URI='https://프론트주소/youtube-callback'
export YOUTUBE_TOKEN_ENCRYPTION_KEY='Base64로 인코딩한 32바이트 암호화 키'
```

암호화 키 생성: `openssl rand -base64 32`. 생성한 값은 서버 환경변수/비밀 저장소에 보관하세요. 재시작과 배포 이후에도 같은 키를 사용해야 저장된 토큰을 읽을 수 있습니다. 현재 키 교체·재암호화 기능은 없습니다. backend 디렉터리의 `.env`에서 읽도록 설정했으며 키와 시크릿을 Git에 저장하지 않습니다.

Google Cloud에서 YouTube Data API를 활성화하고, 웹 OAuth 클라이언트의 승인된 리디렉션 URI에 `YOUTUBE_REDIRECT_URI`를 정확히 등록하세요. HTTPS를 사용하며 로컬 테스트는 HTTP localhost 또는 127.0.0.1을 허용합니다. 이 URI는 **프론트가 code와 state를 수신하는 콜백 화면**입니다. 이번 작업은 백엔드만 구현했고 콜백 화면/모바일 딥링크 연결은 프론트 작업입니다. 네이티브 SDK에서 별도로 만든 server auth code를 바로 보내는 방식과 혼용하지 않습니다.

### 연결 순서

1. 로그인한 상태에서 `POST /api/v1/integrations/youtube/authorize` 호출
2. 응답의 `authorizationUrl`을 브라우저에서 열기
3. Google에서 YouTube 플레이리스트 권한 허용
4. 등록한 프론트 콜백 화면에서 `code`와 `state`를 받기
5. Re:on Bearer 토큰으로 `POST /connect`에 두 값을 전달

```bash
curl -i -X POST http://localhost:8080/api/v1/integrations/youtube/authorize \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

```json
{"authorizationUrl":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

서버는 `youtube.force-ssl` 권한, `access_type=offline`, `prompt=consent`, PKCE S256을 요청합니다. 사용자별 state는 10분 동안 유효하며 한 번만 사용 가능합니다. 새 연결을 시작하면 이전 state는 무효가 됩니다. PKCE verifier는 서버에 암호화 저장하며 프론트에 전달하지 않습니다.

```http
POST /api/v1/integrations/youtube/connect
Authorization: Bearer REON_ACCESS_TOKEN
Content-Type: application/json

{"authorizationCode":"Google 콜백의 code","state":"Google 콜백의 state"}
```

```json
{"connected":true}
```

기존 API 명세의 authorizationCode-only 요청에 **필수 state를 추가**했습니다. 다른 사용자의 state나 만료·사용된 state를 거부합니다. 인증 코드는 Google에 form body로 전달하며 URL이나 오류 응답에 시크릿·토큰을 노출하지 않습니다. 올바른 state는 코드 교환 전에 소비하고 실패해도 재사용할 수 없으므로, 연결 실패 후에는 authorize부터 다시 시작하세요.

처음 연결과 재연결 모두 refresh token이 필요합니다. 누락하면 기존 연결을 덮어쓰지 않고 409를 반환합니다. 재연결 성공 시 기존 토큰을 교체하고 재인증 필요 표시를 해제합니다. YouTube 계정은 사용자가 Google 동의 화면에서 선택한 계정이며, Re:on 로그인 계정과 같은 계정인지 강제하지 않습니다.

### 상태 / 갱신

```bash
curl -i http://localhost:8080/api/v1/integrations/youtube/status \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

| 상태 | connected | reauthRequired |
| --- | --- | --- |
| 연결한 적 없음 | false | false |
| 사용 가능한 연결 | true | false |
| refresh token 철회·만료 또는 권한 부족 | false | true |

Access/refresh token은 AES-256-GCM으로 DB에 저장합니다. HTTP 응답에는 Google 토큰을 반환하지 않습니다. 상태 조회 시 access token 만료 60초 전부터 refresh token으로 갱신하며, Google이 새 refresh token을 반환하지 않으면 기존 것을 유지합니다. 재인증 필요 표시가 생긴 뒤에는 다시 연결하기 전까지 갱신하지 않습니다.

Google의 `invalid_grant`는 재인증 필요로 저장합니다. 일시적인 네트워크·서버 오류는 502를 반환하며 연결 정보를 폐기하지 않습니다. 상태는 저장된 만료 시간과 갱신 결과를 기준으로 판단하므로, 아직 유효한 토큰의 외부 철회를 즉시 감지하지는 않습니다. 다음 Playlist 구현에서 실제 YouTube 호출 오류도 처리해야 합니다.

후속 Playlist 코드는 인증된 사용자 ID로 `YouTubeConnectionStore.accessToken(userId)`를 호출할 수 있습니다. 토큰이 만료됐다면 갱신하고, 연결 누락·재인증 필요이면 409를 반환합니다. 이는 HTTP API가 아닌 서버 내부 서비스입니다.

## Moment 기록

모든 Moment API에는 `Authorization: Bearer REON_ACCESS_TOKEN`이 필요합니다. 사용자 ID는 요청에서 받지 않고 서버의 로그인 세션에서 결정합니다. 본인 기록만 조회·수정·삭제할 수 있으며, 다른 사람의 기록과 없는 기록은 모두 `404 MOMENT_NOT_FOUND`로 처리합니다.

```bash
curl -i -X POST http://localhost:8080/api/v1/moments \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"videoId":"wJhWwt1OmT8","memo":"등교하면서 들은 곡","recordedAt":"2026-10-11T08:30:00+09:00","location":{"latitude":37.45,"longitude":127.128}}'
```

생성은 `201 Created`와 `Location: /api/v1/moments/{id}`를 반환합니다.

```json
{
  "id": 101,
  "music": {
    "videoId": "wJhWwt1OmT8",
    "title": "Live Forever",
    "channelTitle": "Oasis - Topic",
    "thumbnailUrl": "https://...",
    "originalUrl": "https://music.youtube.com/watch?v=wJhWwt1OmT8"
  },
  "memo": "등교하면서 들은 곡",
  "recordedAt": "2026-10-11T08:30:00+09:00",
  "location": {"latitude":37.45,"longitude":127.128}
}
```

상세 조회도 같은 형식을 반환합니다. `artist` 대신 기존 음악 API와 동일한 `channelTitle`을 사용합니다. 곡 제목·채널명·썸네일은 생성 시 YouTube에서 확인하고 기록에 저장합니다. 이후 조회와 메모 수정은 YouTube를 다시 호출하지 않습니다. 생성에는 `YOUTUBE_API_KEY`가 필요하며 조회 실패 시 기록을 저장하지 않습니다.

- `videoId`: 11자리 영문·숫자·`_`·`-`
- `memo`: 선택, 최대 2000자. 생략하거나 null이면 빈 문자열로 저장
- `recordedAt`: 필수, UTC 오프셋이 포함된 ISO 8601. 한국 시간 기준 1970~9998년
- `location`: 선택, 생략하거나 null이면 위치를 저장하지 않음. 입력할 때 위도와 경도 모두 필수
- 위도 -90~90, 경도 -180~180

시간은 UTC로 저장하고 응답은 `+09:00`으로 반환합니다. DB 정밀도에 맞춰 마이크로초 이하를 버립니다. 위치는 앱에서 동의를 받은 경우에만 보내세요.

### 목록과 페이지 이동

```bash
curl -i 'http://localhost:8080/api/v1/moments?year=2026&month=10&size=20' \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

```json
{
  "content": [{"id":101,"title":"Live Forever","channelTitle":"Oasis - Topic","thumbnailUrl":"https://...","memo":"등교하면서 들은 곡","recordedAt":"2026-10-11T08:30:00+09:00"}],
  "nextCursor": "서버가 반환한 커서",
  "hasNext": true
}
```

`size` 기본값은 20이며 1~100입니다. `year`는 선택이고 `month`를 쓰려면 year도 함께 보내야 합니다. 연·월은 `Asia/Seoul` 기준, 시작 포함 / 다음 기간 시작 제외입니다. 필터가 없으면 모든 날짜를 조회합니다.

들은 시간 내림차순으로 정렬하고 같은 시간이면 ID 내림차순으로 정렬합니다. 다음 요청은 같은 필터로 `cursor={nextCursor}`를 전달하세요. 마지막 페이지는 `hasNext: false`, `nextCursor: null`입니다. 커서는 마지막 시간과 ID를 URL-safe Base64로 담으며 삭제된 기록을 기준으로도 다음 페이지를 조회할 수 있습니다. 커서는 접근 권한을 부여하지 않으며, 모든 목록 쿼리는 로그인한 사용자로 제한됩니다.

### 수정 / 삭제

```bash
curl -i -X PATCH http://localhost:8080/api/v1/moments/101 \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"memo":"수정한 메모"}'

curl -i -X DELETE http://localhost:8080/api/v1/moments/101 \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

수정 응답은 `{ "id": 101, "memo": "수정한 메모", "updatedAt": "...+09:00" }`입니다. 빈 문자열로 메모를 지울 수 있으며 PATCH에서는 memo 누락과 null을 거부합니다. 곡·시간·위치 수정은 이번 API 범위에 포함하지 않습니다. 삭제는 `204 No Content`입니다.

## Google 로그인

프론트에서 Google 로그인으로 받은 **ID 토큰**을 전달하세요. Google access token이나 단순 사용자 ID를 받는 API가 아닙니다.

```http
POST /api/v1/auth/google
Content-Type: application/json

{"idToken":"Google에서 발급받은 ID 토큰"}
```

```json
{
  "accessToken": "Re:on에서 발급한 로그인 토큰",
  "user": {
    "id": 1,
    "name": "사용자 이름",
    "email": "user@example.com",
    "profileImageUrl": "https://..."
  }
}
```

Google 공식 라이브러리로 서명, issuer, audience, 유효 시간을 검증하고 `email_verified`도 확인합니다. 이메일이 아닌 Google `sub`로 사용자를 식별하므로 재로그인하면 같은 사용자 ID를 유지하고 이름·이메일·이미지를 갱신합니다. 이미지가 없으면 null, 이름이 없으면 이메일을 사용합니다.

Re:on 토큰은 JWT 대신 32바이트 난수로 만든 Bearer 세션 토큰입니다. DB에는 SHA-256 해시만 저장합니다. 기본 유효 시간은 1시간이며 `auth.session-ttl`로 설정합니다. 여러 기기의 로그인 세션을 허용합니다. 만료하면 Google ID 토큰을 다시 받아 로그인해야 하며 refresh API는 아직 없습니다. 로그인 때 만료된 세션을 정리합니다.

Google 공개 키는 라이브러리가 조회·캐시합니다. 실제 인증에는 네트워크가 필요하며 배포 시 HTTPS를 사용하세요. 테스트에만 공개 키 조회를 대역으로 처리하고, 운영 코드에는 우회 로그인 기능이 없습니다.

## 내 정보 / 로그아웃

```bash
curl -i http://localhost:8080/api/v1/users/me \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'

curl -i -X POST http://localhost:8080/api/v1/auth/logout \
  -H 'Authorization: Bearer REON_ACCESS_TOKEN'
```

`users/me`는 로그인 응답의 `user`와 동일한 네 필드를 반환합니다. 로그인 응답과 내 정보에는 `Cache-Control: no-store`를 적용합니다.

로그아웃 응답:

```json
{"message":"로그아웃되었습니다."}
```

로그아웃은 현재 토큰만 폐기합니다. 다른 기기 세션과 사용자 계정은 유지됩니다. 폐기하거나 만료된 토큰으로 내 정보를 조회하거나 다시 로그아웃하면 401입니다.

## 음악 조회

```bash
curl -i -X POST http://localhost:8080/api/v1/music/resolve \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://music.youtube.com/watch?v=wJhWwt1OmT8&si=share"}'
```

응답: `videoId`, `title`, `channelTitle`, `thumbnailUrl`. 채널명을 아티스트로 정규화하지 않습니다. 썸네일이 없으면 null입니다. 기존 시작 가이드 기준으로 `artist`와 `originalUrl`은 포함하지 않습니다.

HTTPS `music.youtube.com/watch` URL과 11자리 ID를 검증합니다. 추가 공유 파라미터는 허용하고 중복 v, 외부 호스트, 잘못된 ID는 거부합니다. 고정된 Google videos.list 엔드포인트만 호출하며 연결 제한 3초, 읽기 제한 5초를 적용합니다. 현재 음악 조회는 로그인 없이 사용할 수 있습니다.

## 오류

공통 응답은 `{ "code": "...", "message": "..." }`입니다.

| HTTP | code | 상황 |
| --- | --- | --- |
| 400 | INVALID_REQUEST | 필수 필드 누락, 길이 초과, 잘못된 JSON |
| 400 | INVALID_YOUTUBE_MUSIC_URL | 잘못된 음악 URL 또는 ID |
| 400 | INVALID_YOUTUBE_OAUTH_STATE | 다른 사용자·만료·사용된 state |
| 400 | INVALID_YOUTUBE_AUTHORIZATION_CODE | 잘못된 Google 인증 코드 |
| 403 | YOUTUBE_SCOPE_REQUIRED | 플레이리스트 작성 권한 미허용 |
| 409 | YOUTUBE_OFFLINE_ACCESS_REQUIRED | refresh token 미발급 |
| 409 | YOUTUBE_NOT_CONNECTED / YOUTUBE_REAUTH_REQUIRED | 내부 Playlist 서비스의 연결 요구 |
| 503 | YOUTUBE_OAUTH_NOT_CONFIGURED | OAuth 환경변수 또는 32바이트 암호화 키 누락 |
| 502 | YOUTUBE_OAUTH_UNAVAILABLE | Google 코드 교환·갱신의 통신 오류 |
| 500 | YOUTUBE_TOKEN_STORAGE_ERROR | 저장된 토큰 복호화 실패 (키 변경 등) |
| 401 | INVALID_GOOGLE_TOKEN | 잘못된 서명, audience, issuer, 만료, 미검증 이메일 |
| 401 | UNAUTHORIZED | Re:on Bearer 토큰 누락, 잘못된 토큰, 폐기·만료 |
| 404 | MUSIC_NOT_FOUND | 조회 가능한 영상 없음 |
| 404 | MOMENT_NOT_FOUND | 없는 기록 또는 다른 사용자의 기록 |
| 404 | MEMORY_NOT_FOUND | 없는 Memory 또는 타인 Memory |
| 503 | MEMORY_ENGINE_UNAVAILABLE | Memory 분석 서버 연결 실패 |
| 502 | INVALID_MEMORY_ENGINE_RESPONSE | 분석 결과의 사용자·월·곡 정보 검증 실패 |
| 422 | MEMORY_HISTORY_TOO_LARGE | 월 전체 기록이 1000개를 초과함 |
| 422 | INVALID_MEMORY_MUSIC / INVALID_PLAYLIST_TRACK_COUNT | Memory 음악 정보 오류 또는 곡 수 범위 초과 |
| 409 | PLAYLIST_CREATION_INCOMPLETE | 이전 생성이 진행 중·불완전함 |
| 409 | YOUTUBE_AUTH_REQUIRED / YOUTUBE_CHANNEL_REQUIRED | 권한 연결 또는 YouTube 채널 필요 |
| 503 | YOUTUBE_QUOTA_EXCEEDED | Google API 할당량 초과 |
| 422 | YOUTUBE_TRACK_UNAVAILABLE | 추가할 수 없는 곡 |
| 502 | YOUTUBE_PLAYLIST_ERROR | 플레이리스트 생성·곡 추가 실패 |
| 409 | DATA_CONFLICT | 동시 최초 로그인 등의 DB 제약 충돌; 다시 시도 가능 |
| 503 | GOOGLE_AUTH_NOT_CONFIGURED | Google 클라이언트 ID 미설정 |
| 503 | YOUTUBE_API_NOT_CONFIGURED | YouTube 키 미설정 |
| 502 | GOOGLE_AUTH_UNAVAILABLE | Google 공개 키 조회 등의 네트워크 실패 |
| 502 | YOUTUBE_API_ERROR | YouTube 오류·연결 실패·잘못된 응답 |

## MySQL

팀 서버는 `mysql` 프로필을 사용하세요. 먼저 데이터베이스를 만들고 `src/main/resources/db/schema-mysql.sql`을 적용하세요. 스크립트는 User, Session, Moment, Memory, YouTube 연결·인증 요청, Playlist 생성 결과 테이블을 만들며 기존 데이터를 삭제하지 않습니다. 기존 DB에도 같은 스크립트를 다시 적용해 새 테이블을 추가하세요. 자동 DDL 변경은 하지 않고 시작 시 엔티티와 스키마를 검증합니다.

```bash
export DB_URL='jdbc:mysql://localhost:3306/reon'
export DB_USERNAME='reon'
export DB_PASSWORD='DB 비밀번호'
export GOOGLE_CLIENT_ID='웹 OAuth 클라이언트 ID'
./gradlew bootRun --args='--spring.profiles.active=mysql'
```

MySQL 스키마 적용 예시 (비밀번호는 프롬프트에 입력):

```bash
mysql -u reon -p reon < src/main/resources/db/schema-mysql.sql
```

## 검증

```bash
./gradlew test
./gradlew bootJar
```

음악·인증 테스트에 Moment 통합 테스트를 추가했습니다. 기록 CRUD, 소유자 제한, 로그아웃된 토큰 거부, 위치·메모 검증, 같은 시각의 커서 페이지 이동, 삭제된 커서 기준, 한국 시간 월 경계와 YouTube 오류 시 저장되지 않는 동작을 검증합니다. H2 통합 테스트로 신규·반복 로그인, 사용자 조회, 독립적인 세션 발급, 로그아웃, 만료, 잘못된 요청을 검증합니다. RSA 키로 서명한 테스트 ID 토큰을 사용해 Google 라이브러리가 다른 audience·issuer·서명·만료를 거부하는지도 확인합니다. YouTube OAuth 테스트는 Google 응답을 모킹해 state 소유자·만료·재사용, PKCE 코드 교환, 암호화, 갱신, 권한 철회, 일시적 오류와 재연결을 검증합니다. Playlist 테스트는 Memory와 YouTube를 모킹해 소유자 제한, 순서 유지·중복 제거, 완료 결과 재사용, 중간 실패·부분 링크, 불확실한 요청 재시도 차단을 확인합니다. Memory Engine의 실제 HTTP 분석 응답은 확인했습니다. 사용자 로그인 후 Core 기록→분석→실제 Google 플레이리스트 생성 흐름과 MySQL은 추가 검증이 필요합니다.

## 구조 / Git

- `music`: 컨트롤러, DTO, 음악 조회 서비스
- `auth`: Google 검증, 로그인 컨트롤러, 세션 엔티티·저장소·서비스
- `user`: 사용자 엔티티·저장소, 응답 DTO, 내 정보 컨트롤러
- `moment`: 기록 엔티티·저장소·서비스·DTO·컨트롤러
- `youtube`: OAuth 연결 컨트롤러, Google 클라이언트, 암호화, 연결·인증 요청 저장소, 플레이리스트 클라이언트
- `replay`: 플레이리스트 생성 API·서비스·결과 저장소, Memory 조회 연결 인터페이스
- `memory`: Python 엔진 클라이언트, 월별 분석·DB 저장, 소유자 제한 어댑터
- `memory-engine`: minjoung 브랜치의 Python 분석 엔진 원본과 로컬 실행 래퍼
- `global`: 공통 예외 처리
- `src/main/resources/db`: MySQL 스키마

소스, Gradle 설정과 Wrapper, `.env.example`, 스키마, README를 커밋하세요. `data`, `build`, `.gradle`, `.idea`, `.env`와 키 파일은 제외합니다. Wrapper JAR는 커밋에 필요합니다.

공식 참고: [Google 백엔드 인증](https://developers.google.com/identity/sign-in/web/backend-auth), [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list), [Spring DB 초기화](https://docs.spring.io/spring-boot/how-to/data-initialization.html).

## 로컬 실제 연동 검증

개발 프로필에서 `http://localhost:18080/dev/verify`를 제공합니다. MySQL 검증을 미루는 동안 임시 H2 메모리 DB로 Google 로그인과 YouTube 권한 연결을 확인할 수 있습니다. Google 토큰은 화면에 출력하지 않고 Re:on 토큰은 탭의 sessionStorage에 보관합니다. Google 인증 코드와 state는 콜백에서 읽은 뒤 주소창에서 제거합니다. Memory 분석과 비공개 플레이리스트 생성도 이 화면에서 실행할 수 있습니다.

Google 웹 OAuth 클라이언트에 다음 설정을 추가하세요:

- 승인된 JavaScript origin: `http://localhost:18080`
- 승인된 redirect URI: `http://localhost:18080/dev/youtube-callback`

`.env`의 YOUTUBE_REDIRECT_URI도 이 콜백 주소로 설정했습니다. Google 로그인 → YouTube 권한 연결 → 연결 상태 조회 순서로 진행하세요. 테스트 모드인 Google 앱은 사용하는 계정을 테스트 사용자로 등록해야 할 수 있습니다.

```bash
./gradlew bootRun --args='--server.port=18080 --spring.datasource.url=jdbc:h2:mem:reon-live-check;MODE=MySQL;DB_CLOSE_DELAY=-1'
```

2026-10-12 실제 YouTube Data API 검증: `/api/v1/music/resolve`로 wJhWwt1OmT8을 조회해 HTTP 200, Live Forever (Remastered), Oasis - Topic, maxres 썸네일을 확인했습니다. 실제 Google 로그인·동의 연결과 MySQL은 아직 확인 전입니다.

## Memory Engine 실제 연결 (2026-10-13)

원본: https://github.com/yuja814/Re-on/tree/minjoung/memory-engine

엔진은 Python 3.10+ 별도 프로세스입니다. 이번 환경에서는 Python 3.12를 사용합니다.

```bash
cd backend/memory-engine
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python run_local.py
```

`run_local.py`는 backend/.env의 REON_ENGINE_TOKEN을 환경변수로 전달하고 127.0.0.1:18081에서 실행합니다. Core는 같은 토큰으로 내부 엔드포인트 `/api/v1/memories/analyze/core`를 호출합니다. 비밀 값은 출력하지 않습니다. MySQL 없이 기본 dev 프로필의 파일 H2 DB를 사용하며 data 폴더는 Git에서 제외합니다.

현재 월 전체 기록을 사용자 행 잠금 안에서 읽고 엔진 결과 저장까지 직렬 처리합니다. Moment 생성·수정·삭제도 같은 잠금을 사용해 오래된 스냅샷이 반영되지 않게 합니다. scope의 revision은 이 직렬 실행에서 0을 사용하며, 비동기 작업 큐로 전환할 때는 문서 계약의 단조 증가 revision과 비교·재분석을 구현해야 합니다. 엔진 응답의 소유자·월·곡 ID·Moment ID를 검증하고 내부 engine_id 기준 upsert 및 비활성화를 적용합니다. 엔진 호출 중 동일 사용자의 기록 쓰기는 대기할 수 있습니다(읽기 timeout 10초).

위경도는 장소 이름이 아니므로 LOCATION 분석 입력에는 null을 전달합니다. 임의의 지명을 만들지 않습니다. 아티스트는 엔진의 Topic 채널 fallback을 그대로 사용합니다.

개발 전용 API (Re:on Bearer 인증 필요):

- `POST /dev/memories/analyze?month=2026-10`: 해당 월 본인 전체 Moment 분석·Memory 저장
- `POST /dev/memories/test-records`: 실제 YouTube 조회로 Oasis 기록 3개 생성 후 현재 월 분석 (실제 검증용 데이터가 추가됩니다)

검증 화면에서 Google 로그인 → YouTube 연결 → 검증용 Oasis 기록 3개 생성·Memory 분석 → 비공개 플레이리스트 생성 순서로 진행하세요. 분석 결과의 숫자 Memory ID는 입력란에 자동 반영됩니다. 기존 임시 메모리 DB로 로그인했다면 파일 DB 전환 후 다시 로그인·연결해야 합니다.

검증 완료: Java 전체 테스트 93개, 담당자 Python 엔진 테스트 60개. 실제 엔진 HTTP 호출에 Oasis 기록 3개를 전달해 200과 `Oasis와 함께한 10월`, 곡 ID wJhWwt1OmT8을 확인했습니다. 아직 사용자의 실제 Google 계정에 플레이리스트를 생성한 것은 아닙니다.

## 실제 MySQL 검증 (2026-10-13)

MySQL 9.7.1의 reon_test에서 테이블 7개와 스키마를 검증했습니다. Memory.snapshot의 @Lob 매핑은 MySQL LONGTEXT와 JDBC 타입이 달라 시작이 실패해, @Column(length=org.hibernate.Length.LONG32)로 수정했습니다. DB 데이터나 컬럼은 변경하지 않았으며 H2 호환성도 검증했습니다.

실제 MySQL 자동 검증은 명시적으로 활성화할 때만 실행합니다. 대상 DB가 reon_test인지 확인하며 검증용 레코드는 트랜잭션으로 롤백합니다.

```bash
REON_MYSQL_VERIFY=true ./gradlew test
```

기존 H2 기반 테스트 93개와 실제 MySQL 저장 테스트 6개가 모두 통과했습니다. MySQL에서 사용자·문자 구분 식별자, Unicode와 이모지, Moment 시간·메모·수정·삭제, 4만 자 이상 Memory JSON, 세션·로그아웃, 암호화된 OAuth 토큰, 플레이리스트 완료 결과를 확인했습니다.

읽기 전용 연결·테이블·건수 확인:

```bash
python3 devtools/check_mysql.py --counts
```

이 스크립트는 비밀번호를 명령줄 인자로 넘기지 않고 권한 600의 임시 설정 파일을 사용한 뒤 삭제합니다. 비밀 값이나 사용자 개인정보를 출력하지 않습니다.

검증 화면을 유지하면서 MySQL 서버 실행:

```bash
./gradlew bootRun --args='--server.port=18080 --spring.profiles.active=dev,mysql'
```

MySQL는 H2와 별도의 데이터이므로 Google 로그인·YouTube 연결을 다시 진행해야 합니다. 실제 앱 흐름 확인 후 서버를 재시작하고 Memory·YouTube 연결·기존 Playlist 링크가 유지되는지 추가 확인하세요. 재시작 유지는 자동 롤백 테스트로 확인한 것이 아니며 실제 데이터 생성 후 검증해야 합니다.

### MySQL 실제 흐름과 재시작 확인

2026-10-13 사용자가 MySQL에서도 실제 로그인·YouTube 연결·Memory·플레이리스트 생성 성공을 보고했습니다. 서버를 MySQL 프로필로 재시작한 뒤 동일한 DB에서 사용자 1, 세션 1, Moment 6, Memory 1, YouTube 연결 1, Playlist 생성 결과 1건이 유지되는 것을 확인했습니다. 현재 내장 브라우저 탭은 인증 세션이 없어 재시작 후 OAuth 상태 조회·기존 Playlist 반환은 사용자가 성공했던 브라우저 탭에서 추가 확인해야 합니다. 기록 건수 유지 확인을 인증 API 검증 완료와 혼동하지 않습니다.
