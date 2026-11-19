export async function beginYouTubeConnection(_memoryId:string):Promise<void> {
  throw new Error('YouTube 계정 연결은 현재 웹에서 진행해주세요.');
}
export async function finishYouTubeConnection(_code:string,_state:string):Promise<string> {
  throw new Error('브라우저에서 연결을 다시 시작해주세요.');
}
