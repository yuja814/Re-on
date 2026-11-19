import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Platform, Text, Pressable, View } from 'react-native';
import { finishYouTubeConnection } from '@/services/youtube-browser';
import { useSession } from '@/stores/auth-store';
export default function YouTubeCallback() {
  const params=useLocalSearchParams<{code?:string;state?:string;error?:string}>();
  // Keep the one-time code in component memory while persisted login is loading.
  const [callback]=useState(()=>{
    if(Platform.OS==='web' && typeof window!=='undefined'){
      const query=new URLSearchParams(window.location.search);
      return {code:query.get('code')??'',state:query.get('state')??'',error:query.get('error')??''};
    }
    return {code:params.code??'',state:params.state??'',error:params.error??''};
  });
  const session=useSession();const router=useRouter();
  const [error,setError]=useState('');
  useEffect(()=>{
    if(Platform.OS==='web')window.history.replaceState(window.history.state,'', '/youtube-callback');
    if(session.status==='loading')return;
    let active=true;
    const finish=async()=>{
      if(callback.error)throw new Error('Google 권한 동의가 완료되지 않았습니다. 원래 화면에서 다시 시도해주세요.');
      if(session.status!=='signedIn')throw new Error('로그인 후 YouTube 연결을 다시 시작해주세요.');
      const memory=await finishYouTubeConnection(callback.code,callback.state);
      if(active)router.replace(memory?{pathname:'/memory/detail',params:{memoryId:memory}}:'/memory/home');
    };
    void finish().catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'연결에 실패했습니다.');});
    return()=>{active=false;};
  },[callback.code,callback.state,callback.error,session.status,router]);
  return <View style={{flex:1,padding:32,justifyContent:'center',backgroundColor:'#0D0B02'}}>
    {error?<><Text style={{color:'#FF6B6B'}}>{error}</Text><Pressable onPress={()=>router.replace('/memory/home')}><Text style={{color:'#FFE680',padding:20}}>Memory로 돌아가기</Text></Pressable></>:<><ActivityIndicator/><Text style={{color:'white'}}>YouTube 계정을 연결하고 있어요.</Text></>}
  </View>;
}
