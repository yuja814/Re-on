# 아이폰 실기기 개발

현재 단계 (2026-11-06): iPhone 18 Pro / iOS 27.2 시뮬레이터에서 개발 빌드·설치·실제 Google 로그인을 확인했습니다. 로그인 후 기존 H2 데이터의 Moment 목록·상세와 Memory 목록·상세를 실제 화면에서 조회했고, 개발 메뉴 Reload 후에도 로그인 세션이 복원되어 Moment 목록을 다시 표시하는 것을 확인했습니다. 프로세스 강제 종료 후 재실행과 실기기는 아직 검증하지 않았습니다.

## 케이블 없이 시뮬레이터에서 실행

Xcode의 iOS 런타임 설치 후 아래 명령으로 실행합니다. Apple 계정 서명과 물리 기기는 필요하지 않지만 Google iOS 클라이언트 설정은 필요합니다.

```sh
zsh local-test/ios.sh simulator
```

기본 대상은 iPhone 18 Pro입니다. 다른 시뮬레이터는 REON_IOS_SIMULATOR 환경 변수에 기기 이름을 지정합니다. 이 모드에서는 API 주소를 http://127.0.0.1:18090으로 설정해 Mac의 백엔드에 연결합니다. 원래 환경 파일과 웹 설정은 변경하지 않습니다.

한글 경로에서 CocoaPods 인코딩 충돌이 재현되어, 시뮬레이터 스크립트는 소스를 `/private/tmp/reon-ios-build-20261106`에 복사해서 빌드합니다. 백엔드와 DB는 복사하지 않습니다. 앱 수정 후 스크립트를 다시 실행해야 빌드 폴더에 반영됩니다. Metro가 실행 중이면 먼저 해당 터미널에서 Ctrl+C로 종료합니다. 임시 폴더가 삭제되면 다음 실행에서 다시 생성·빌드합니다.

Xcode 27/iOS 27은 Scene lifecycle이 필요합니다. SDK 57의 공식 `expo-build-properties` 플러그인에서 `ios.enableSceneSupport: true`를 설정했습니다. 네이티브 파일 직접 수정 없이 prebuild가 AppDelegate와 scene manifest를 생성합니다.

Metro가 `.env.ios.local`을 JavaScript로 변환하려는 오류가 재현되어, metro.config.js에서 `.env*` 파일을 번들 탐색 대상에서 제외했습니다. 공개 환경 변수는 실행 스크립트/Expo에서 기존 방식으로 주입합니다.

설치된 시뮬레이터 앱용 Metro만 다시 실행할 때는 `zsh local-test/ios.sh simulator-start`를 사용합니다. engine.sh와 backend.sh도 실행 중이어야 합니다.

## 무료 Apple 계정으로 준비

1. Mac App Store에서 Xcode를 설치하고 처음 실행해 필요한 구성 요소를 설치합니다.
2. Xcode Settings > Accounts에 Apple 계정을 추가합니다. 비밀번호는 채팅이나 환경 파일에 넣지 않습니다.
3. Xcode Settings > Locations에서 설치한 Xcode의 Command Line Tools를 선택합니다.
4. 아이폰을 케이블로 연결하고 Mac 신뢰를 승인합니다. 기기가 요구하면 개발자 모드를 켭니다.

## 앱 식별자와 로그인

팀에서 사용할 고유 Bundle ID를 정하고 Google Cloud에서 같은 Bundle ID의 **iOS** OAuth 클라이언트를 생성합니다. 기존 웹 클라이언트는 유지합니다. iOS 클라이언트 ID와 서버의 웹 클라이언트 ID는 서로 다른 값입니다.

프로젝트 루트에서:

```sh
cp local-test/ios.env.example .env.ios.local
```

파일의 빈 값을 입력합니다. 이 파일은 Git에서 제외됩니다. EXPO_PUBLIC 값은 앱에 포함되므로 백엔드 비밀 키를 넣으면 안 됩니다. 실제 iOS 클라이언트 ID로 Google URL scheme을 자동 설정합니다.

아이폰과 Mac을 같은 Wi-Fi에 연결하고 API 주소는 Mac의 Wi-Fi IP:18090으로 설정합니다. 아이폰에서 localhost는 아이폰 자신입니다. 학교/공용 Wi-Fi는 기기 간 연결을 막을 수 있습니다.

## 실행

기존 engine.sh와 backend.sh를 별도 터미널에서 실행합니다. 그 다음:

```sh
zsh local-test/ios.sh build
```

Expo가 네이티브 프로젝트를 생성합니다. ios/android 파일은 직접 만들지 않습니다. 서명 팀 선택이 필요하면 무료 계정의 Personal Team을 선택합니다. 무료 서명은 유효 기간과 기능 제한이 있어 주기적 재설치가 필요합니다.

앱 설치 이후 개발 서버만 다시 시작할 때:

```sh
zsh local-test/ios.sh start
```

환경 변수 변경 후 Metro를 다시 시작합니다. Bundle ID나 Google URL scheme 등 네이티브 설정 변경 후에는 앱을 다시 빌드합니다. 웹 실행은 기존 frontend.sh를 사용합니다.

## 다음 구현/검증

- 실기기 로컬 서버 접속 및 Google 로그인 (시뮬레이터에서는 확인 완료)
- Moment 목록·상세·저장과 SecureStore 세션 복구
- 네이티브 YouTube 권한 연결과 앱 복귀: 현재 서비스는 웹 전용이므로 추가 구현 필요
- 음악 앱 공유로 Moment 작성 진입: 추가 구현 필요
- 위치 권한·권한 거부·백그라운드 복귀
- 네이티브에서 보이는 기본 라우트 헤더 및 목록/하단 탭 겹침 정리

네이티브 YouTube 인증은 기존 웹 클라이언트의 redirect URI를 임의로 reon://로 바꾸면 안 됩니다. 클라이언트 종류, 서버 코드 교환, state/PKCE를 함께 설계한 뒤 진행합니다.

## YouTube에서 Re:on으로 공유하기

- 지원 링크: `music.youtube.com/watch`, `youtube.com/watch`, `www.youtube.com/watch`, `m.youtube.com/watch`, `youtu.be/<영상 ID>` (HTTPS).
- YouTube/Safari에서 영상의 **공유 → Re:on**을 선택하면 곡 정보가 표시된 Moment 작성 화면으로 이동합니다. 제목과 URL이 함께 공유돼도 처리합니다.
- 로그인 전 공유했다면 로그인 후 해당 곡 작성 화면으로 돌아옵니다. 저장은 사용자가 메모를 확인하고 저장 버튼을 눌렀을 때만 실행합니다.
- 여러 서로 다른 영상이나 지원하지 않는 링크는 자동 선택하지 않고 링크 입력 안내를 표시합니다.
- URL의 재생목록·라디오·추적 옵션은 한 곡 기록에 사용하지 않습니다. 일반 영상의 아티스트 표시는 기존과 같이 YouTube 채널명 기준입니다.

### 설치 및 검증

공유 확장은 네이티브 기능이므로 Metro 새로고침만으로 추가되지 않습니다. `zsh local-test/ios.sh simulator`로 다시 빌드해야 합니다. 공유 목록에 Re:on이 바로 보이지 않으면 앱 목록의 더 보기를 확인하세요.

시뮬레이터에는 YouTube 앱 없이 Safari에서 다음 주소를 열어 공유할 수 있습니다:
`https://m.youtube.com/watch?v=maTP315XZCQ`

1. Safari → 공유 → Re:on → 곡 정보·메모 작성 화면 확인.
2. 작성 화면에서 메모 입력 → 저장 → Moment 목록/상세 확인.
3. 앱을 닫은 상태와 실행 중인 상태에서 각각 다시 공유.
4. 작성 화면을 열어 둔 상태에서 다른 곡 공유 시 새 곡으로 변경되는지 확인.
5. 로그아웃 상태에서 공유 → 로그인 → 공유한 곡 작성 화면 복귀 확인.
6. 다른 웹사이트를 공유하면 오류 안내가 나오고 기록이 생성되지 않는지 확인.

공유 수신은 Expo SDK 57의 공식 `expo-sharing` 실험 기능을 사용합니다. iOS 확장에서 본 앱을 여는 방식은 Expo 문서상 Apple의 공식 지원 방식이 아니므로 출시 전 목표 iOS 버전에서 재검증해야 합니다. App Group 및 확장용 서명 설정은 실기기 배포 시 별도로 필요하며, 시뮬레이터 검증과 실기기 설치 가능 여부는 별개입니다.
문서: https://docs.expo.dev/versions/v57.0.0/sdk/sharing/

### 음악 영상 분류 검사

조회와 Moment 생성 시 서버가 YouTube `snippet.categoryId`를 확인합니다. 음악 카테고리(`10`)만 허용하며 뉴스·예능 등 다른 분류와 분류 누락은 HTTP 422 / `MUSIC_CATEGORY_REQUIRED`로 거절합니다. 앱은 음악 영상만 기록 가능하다는 안내를 표시합니다. 제목이나 채널명에 음악이라는 단어가 있어도 우회되지 않습니다.

이는 YouTube 분류에 따른 제한이며 실제 오디오 분석은 아닙니다. 음악 영상이 다른 카테고리로 등록되어 있으면 거절될 수 있고, 잘못 음악으로 분류된 영상까지 판별하지는 못합니다. 기존 저장 기록은 소급 삭제하지 않습니다.
