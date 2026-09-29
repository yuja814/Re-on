# Re-on
Git 협업 방식
 브랜치 생성
  - main프로젝트의 brench 따기 -> 브랜치명 : development
  - develoment brench의 각자 brench 따기 -> 브랜치명 : 이름(ex.Hong)
  - vs 코드 열때도 자신의 이름이 들어간 브랜치 열기

2. 개발 시
  - 개발이 어느정도 진행되었다면 development브랜치로 merge request 하기
    
  if 실패(충돌) 시
  - 충돌이 나는 경우는 다른 사람과 공통 폴더에서 동시 수정 후 merge하였을때 complete 충돌이 나는 경우가 생깁니다.
  - 자신이 수정한 코드를 복사해 잠시 다른 곳에 옮겨두기
  - 오류가 나는 파일을 discard 시키기
  - 다시 pull 하기
  - pull 해서 받은 파일에 자신이 수정한 곳 고치기
  - run 돌려서 에러 확인
  - 에러 없으면 push 후 merge

  - 
