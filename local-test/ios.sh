#!/bin/zsh
set -euo pipefail
cd "${0:A:h}/.."
if [[ ! -f .env.ios.local ]]; then
  print -u2 'local-test/ios.env.example을 .env.ios.local로 복사한 뒤 설정해주세요.'
  exit 1
fi
set -a
source .env.ios.local
set +a
: "${REON_IOS_BUNDLE_IDENTIFIER:?아이폰 앱 Bundle ID가 필요합니다.}"
: "${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:?Google iOS OAuth 클라이언트 ID가 필요합니다.}"
: "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:?Google 웹 OAuth 클라이언트 ID가 필요합니다.}"
: "${EXPO_PUBLIC_API_BASE_URL:?노트북의 서버 주소가 필요합니다.}"
mode="${1:-start}"
if [[ "$mode" == simulator || "$mode" == simulator-start ]]; then
  export EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:18090
elif [[ "$EXPO_PUBLIC_API_BASE_URL" == *localhost* || "$EXPO_PUBLIC_API_BASE_URL" == *127.0.0.1* ]]; then
  print -u2 '아이폰 실기기에서는 localhost 대신 Mac의 Wi-Fi IP 주소를 사용해주세요.'
  exit 1
fi
case "$mode" in
  start) exec npx expo start --dev-client --lan --port 18093 ;;
  simulator|simulator-start)
    # CocoaPods cannot reliably handle the Korean project path. Build a copy;
    # keep generated native files and backend data out of the source sync.
    stage="${REON_IOS_BUILD_DIR:-/private/tmp/reon-ios-build-20261106}"
    if [[ "$stage" != /private/tmp/reon-ios-build* ]]; then
      print -u2 'REON_IOS_BUILD_DIR는 /private/tmp/reon-ios-build로 시작하는 별도 빌드 폴더여야 합니다.'
      exit 1
    fi
    mkdir -p "$stage"
    rsync -a --exclude '/.git/' --exclude '/.idea/' --exclude '/backend/' \
      --exclude '/ios/' --exclude '/android/' --exclude '/.expo/' \
      --exclude '/local-test/' --exclude '/dist/' --exclude '/web-build/' ./ "$stage/"
    cd "$stage"
    export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
    if [[ "$mode" == simulator ]]; then
      npx expo prebuild --platform ios --no-install
      exec npx expo run:ios --device "${REON_IOS_SIMULATOR:-iPhone 18 Pro}" --port 18093
    fi
    exec npx expo start --dev-client --lan --port 18093 ;;
  build)
    if [[ "$(xcode-select -p)" != */Xcode.app/* ]]; then
      print -u2 'Xcode 전체 설치 후 Xcode > Settings > Locations에서 Command Line Tools를 선택해주세요.'
      exit 1
    fi
    exec npx expo run:ios --device --port 18093 ;;
  *) print -u2 '사용법: zsh local-test/ios.sh [start|build|simulator|simulator-start]'; exit 1 ;;
esac
