# Re-on
Git 협업 방식
1. 브랜치 생성
  - main프로젝트의 branch 따기 -> 브랜치명 : development
  - development branch의 각자 branch 따기 -> 브랜치명 : 이름(ex.Hong)
  - vs 코드 열때도 자신의 이름이 들어간 브랜치 열기

2. 개발 시
  - 개발이 어느정도 진행되었다면 development브랜치로 merge request 하기
    
  if 실패(충돌) 시
  - 다른 사람과 공통 폴더에서 동시 수정 후 merge하였을때 complete 충돌이 나는 경우가 생깁니다.
  - 자신이 수정한 코드를 복사해 잠시 다른 곳에 옮겨두기
  - 오류가 나는 파일을 discard 시키기
  - 다시 pull 하기
  - pull 해서 받은 파일에 자신이 수정한 곳 고치기
  - run 돌려서 에러 확인
  - 에러 없으면 push 후 merge

  *충돌 줄이는 법
  - 작업 전 pull하고 자주 push하기

  **중요**
  - 반드시 development브랜치로 merge 시킬 때는
    꼭 에러가 없는 상태를 확인하고 올려주세요.

3. 개발 완료
   - 개발이 완료되면 development 브랜치를 main프로젝트로 merge 하기
   - main프로젝트가 정상적으로 돌아가는지 확인
   - 정상적으로 돌아간다면 배포 및 나머지 branch 모두 제거
  
4. commit 규칙
   - feat : 새로운 기능 추가
   - fix : 버그 수정
   - docs : 문서 수정
   - style : 코드 스타일/포맷팅 수정 (세미콜론 누락, 들여쓰기 등 동작에 영향 없는 변경)
   - refactor : 기능 변경 없는 코드 구조 개선
   - test : 테스트 코드 작성, 수정
   - chore : 빌드 업무, 프로젝트 설정 변경
   - design : UI 디자인 변경
=======
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
>>>>>>> 0c9818f (Initial commit)
