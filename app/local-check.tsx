import { useEffect, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { ApiError, apiRequest } from '@/services/api-client';
import { useSession } from '@/stores/auth-store';
type Verification={playlistId:string;expectedTrackCount:number;actualTrackCount:number;orderMatches:boolean;privatePlaylist:boolean;videoIds:string[]};
export default function LocalCheck(){
 const {memoryId}=useLocalSearchParams<{memoryId:string}>();const session=useSession();
 const [data,setData]=useState<Verification|null>(null);const [error,setError]=useState('');
 const [preparing,setPreparing]=useState(false);const [recoveryId,setRecoveryId]=useState<number|null>(null);
 const [failure,setFailure]=useState('');
 const prepareRecovery=async()=>{
  if(preparing)return;setPreparing(true);setError('');
  try{
   const memories=await apiRequest<{id:number}[]>('/dev/memories/test-records',{method:'POST',body:{month:'2026-10',videoIds:['wJhWwt1OmT8','r8OipmKFDeM']},timeoutMs:120_000});
   let selected:number|undefined;
   for(const memory of memories){
    const detail=await apiRequest<{moments:{title:string}[]}>(`/memories/${memory.id}`);
    if(new Set(detail.moments.map(item=>item.title)).size>=2){selected=memory.id;break;}
   }
   if(!selected)throw new Error('두 곡이 포함된 검증 Memory를 만들지 못했습니다.');
   setRecoveryId(selected);
   try{await apiRequest(`/dev/memories/${selected}/playlist/fail`,{method:'POST',timeoutMs:120_000});}
   catch(reason){
    if(reason instanceof ApiError && reason.code==='DEV_PLAYLIST_FAILURE'){
     setFailure(`의도한 실패 확인: ${reason.details.confirmedTrackCount}곡 추가 / Memory ${selected}`);return;
    }
    throw reason;
   }
   setFailure('이 Memory에는 이미 생성 이력이 있습니다. 기존 결과를 확인하세요.');
  }catch(reason){setError(reason instanceof Error?reason.message:'실패 검증 준비 오류');}
  finally{setPreparing(false);}
 };
 useEffect(()=>{
  let active=true;
  if(!__DEV__ || session.status!=='signedIn')return;
  if(typeof memoryId!=='string' || !/^[1-9][0-9]*$/.test(memoryId))return;
  void apiRequest<Verification>(`/dev/memories/${memoryId}/playlist/verify`).then(value=>{if(active)setData(value);})
   .catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'검증 실패');});
  return()=>{active=false;};
 },[memoryId,session.status]);
 if(!__DEV__)return <Redirect href="/"/>;
 if(session.status==='signedOut')return <Redirect href="/user/login"/>;
 return <View style={{flex:1,backgroundColor:'#0D0B02',padding:32,gap:12}}>
  <Text style={{color:'#FFE680',fontSize:24}}>로컬 플레이리스트 실제 검증</Text>
  <Pressable disabled={preparing} onPress={()=>{void prepareRecovery();}}><Text style={{color:'#FFE680',padding:12}}>{preparing?'검증용 기록·실패 준비 중':'별도 10월 기록으로 부분 실패 검증 준비'}</Text></Pressable>
  {failure?<Text style={{color:'white'}}>{failure}</Text>:null}
  {recoveryId?<Text selectable style={{color:'white'}}>복구 검증 Memory ID: {recoveryId}</Text>:null}
  {error?<Text style={{color:'#FF6B6B'}}>{error}</Text>:data?<>
   <Text selectable style={{color:'white'}}>Playlist ID: {data.playlistId}</Text>
   <Text style={{color:'white'}}>원본 곡 수: {data.expectedTrackCount}</Text>
   <Text style={{color:'white'}}>실제 YouTube 곡 수: {data.actualTrackCount}</Text>
   <Text style={{color:'white'}}>곡 순서 일치: {String(data.orderMatches)}</Text>
   <Text style={{color:'white'}}>비공개 상태: {String(data.privatePlaylist)}</Text>
   <Text selectable style={{color:'white'}}>곡 ID: {data.videoIds.join(', ')}</Text>
  </>:<Text style={{color:'white'}}>YouTube의 실제 곡 목록을 확인하고 있어요.</Text>}
 </View>;
}
