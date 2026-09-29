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
