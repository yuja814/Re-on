import { authorizeYouTube, connectYouTube } from './youtube-api';
const STATE_KEY='reon.youtube.state';
const MEMORY_KEY='reon.youtube.memory';
export async function beginYouTubeConnection(memoryId:string) {
  if(!/^[1-9][0-9]*$/.test(memoryId))throw new Error('Memory ID가 올바르지 않습니다.');
  const {authorizationUrl}=await authorizeYouTube();
  const url=new URL(authorizationUrl);
  const state=url.searchParams.get('state');
  if(url.origin!=='https://accounts.google.com' || !state)throw new Error('Google 연결 주소를 확인하지 못했습니다.');
  sessionStorage.setItem(STATE_KEY,state);sessionStorage.setItem(MEMORY_KEY,memoryId);
  window.location.assign(url.href);
}
const pending=new Map<string,Promise<string>>();
export function finishYouTubeConnection(code:string,state:string):Promise<string> {
  const existing=pending.get(state);if(existing)return existing;
  const task=(async()=>{
    if(!code || !state || state!==sessionStorage.getItem(STATE_KEY))throw new Error('연결 요청이 만료됐습니다. 원래 화면에서 다시 연결해주세요.');
    const memory=sessionStorage.getItem(MEMORY_KEY);
    sessionStorage.removeItem(STATE_KEY);sessionStorage.removeItem(MEMORY_KEY);
    await connectYouTube(code,state);
    return memory && /^[1-9][0-9]*$/.test(memory)?memory:'';
  })();
  pending.set(state,task);return task;
}
