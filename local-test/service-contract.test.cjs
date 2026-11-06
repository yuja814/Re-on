const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(js, {module,exports:module.exports,require:name=>{
    if(!(name in imports))throw new Error(`Unexpected dependency ${name}`);return imports[name];
  }, URLSearchParams,AbortController,setTimeout,clearTimeout,process:{env:{EXPO_PUBLIC_API_BASE_URL:'http://localhost:18090'}},...extra});
  return module.exports;
}
test('Bearer and memo-only request match the backend contract', async()=>{
  let captured;
  const api=load('src/services/api-client.ts',{'@/stores/auth-store':{getAccessToken:()=> 'session',clearSession:async()=>{}}},{fetch:async(url,options)=>{
    captured={url,options};return {ok:true,status:200,json:async()=>({id:1,memo:'edited'})};
  }});
  await api.apiRequest('/moments/1',{method:'PATCH',body:{memo:'edited'}});
  assert.equal(captured.url,'http://localhost:18090/api/v1/moments/1');
  assert.equal(captured.options.headers.Authorization,'Bearer session');
  assert.equal(captured.options.body,JSON.stringify({memo:'edited'}));
});
test('partial-playlist failure preserves URL and confirmed count',async()=>{
  const api=load('src/services/api-client.ts',{'@/stores/auth-store':{getAccessToken:()=> 'session',clearSession:async()=>{}}},{fetch:async()=>({ok:false,status:502,json:async()=>({code:'YOUTUBE_PLAYLIST_ERROR',message:'partial',playlistUrl:'https://music.youtube.com/playlist?list=PL123',confirmedTrackCount:1})})});
  await assert.rejects(api.apiRequest('/memories/1/playlist',{method:'POST'}),error=>error.details.confirmedTrackCount===1 && error.details.playlistUrl.endsWith('PL123'));
});
test('expired session is cleared but a newer login is not discarded',async()=>{
  let token='old',cleared=0;
  const api=load('src/services/api-client.ts',{'@/stores/auth-store':{getAccessToken:()=>token,clearSession:async()=>{cleared++;}}},{fetch:async()=>{token='new';return {ok:false,status:401,json:async()=>({code:'UNAUTHORIZED'})};}});
  await assert.rejects(api.apiRequest('/users/me'));assert.equal(cleared,0);
  token='old';
  const same=load('src/services/api-client.ts',{'@/stores/auth-store':{getAccessToken:()=>token,clearSession:async()=>{cleared++;}}},{fetch:async()=>({ok:false,status:401,json:async()=>({code:'UNAUTHORIZED'})})});
  await assert.rejects(same.apiRequest('/users/me'));assert.equal(cleared,1);
});
test('204 DELETE returns without trying to parse JSON',async()=>{
  const api=load('src/services/api-client.ts',{'@/stores/auth-store':{getAccessToken:()=>undefined,clearSession:async()=>{}}},{fetch:async()=>({ok:true,status:204,json:async()=>{throw new Error('must not parse');}})});
  assert.equal(await api.apiRequest('/moments/1',{method:'DELETE'}),undefined);
});
test('Memory and recovery services call the canonical API endpoints',async()=>{
  const calls=[];const client={apiRequest:async(...args)=>{calls.push(args);return {};}};
  const memory=load('src/services/memory-api.ts',{'./api-client':client});
  const youtube=load('src/services/youtube-api.ts',{'./api-client':client});
  await memory.fetchMemories();await memory.fetchMemory('201');await memory.markMemoryRead('201');await youtube.resumePlaylist('201');
  assert.deepEqual(calls.map(call=>call[0]),['/memories','/memories/201','/memories/201/read','/memories/201/playlist/resume']);
  assert.equal(calls[2][1].method,'PATCH');assert.equal(calls[3][1].method,'POST');
});
test('OAuth callback validates state and exchanges a code only once',async()=>{
  const storage=new Map([['reon.youtube.state','expected'],['reon.youtube.memory','201']]);let exchanged=0;
  const browser=load('src/services/youtube-browser.web.ts',{'./youtube-api':{connectYouTube:async()=>{exchanged++;}}},{sessionStorage:{getItem:key=>storage.get(key),removeItem:key=>storage.delete(key)}});
  await assert.rejects(browser.finishYouTubeConnection('code','wrong'));
  const [one,two]=await Promise.all([browser.finishYouTubeConnection('code','expected'),browser.finishYouTubeConnection('code','expected')]);
  assert.equal(one,'201');assert.equal(two,'201');assert.equal(exchanged,1);
});
test('local integration privacy setting never requests device location',async()=>{
  let requested=false;
  const context=load('src/utils/context.ts',{'@/utils/location':{getCurrentPlace:async()=>{requested=true;return {coordinates:{latitude:1,longitude:2}};}}},{process:{env:{EXPO_PUBLIC_CAPTURE_LOCATION:'false'}}});
  const recorded=await context.startContextCollection().collect();
  assert.equal(requested,false);assert.equal(recorded.coordinates,undefined);assert.equal(recorded.location,undefined);
});
