import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

type GoogleIdentity = {
  initialize: (config: { client_id: string; callback: (value: {credential: string}) => void }) => void;
  renderButton: (element: HTMLElement, options: {theme: string; size: string; width: number}) => void;
  disableAutoSelect: () => void;
};
let sdkPromise: Promise<GoogleIdentity> | undefined;
let receiver: ((credential: string) => void) | undefined;
function identity() { return (window as unknown as {google?: {accounts?: {id?: GoogleIdentity}}}).google?.accounts?.id; }
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if(sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve,reject) => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if(!clientId) { reject(new Error('Google 로그인 클라이언트 설정이 필요합니다.')); return; }
    const ready = () => {
      const api = identity(); if(!api) { reject(new Error('Google 로그인 화면을 불러오지 못했어요.')); return; }
      api.initialize({client_id:clientId, callback:value => receiver?.(value.credential)}); resolve(api);
    };
    if(identity()) { ready(); return; }
    const script = document.createElement('script'); script.src='https://accounts.google.com/gsi/client';
    script.async=true; script.onload=ready; script.onerror=()=>reject(new Error('Google 로그인 화면을 불러오지 못했어요.'));
    document.head.appendChild(script);
  });
  sdkPromise.catch(() => { sdkPromise=undefined; });
  return sdkPromise;
}
export default function GoogleLoginButton({onCredential, disabled}: {onCredential:(token:string)=>void; disabled:boolean;onError?:(message:string)=>void}) {
  const element=useRef<HTMLDivElement>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    const callback=(token:string)=>{ if(active && !disabled) onCredential(token); };
    receiver=callback;
    loadGoogleIdentity().then(api=>{ if(active && element.current) api.renderButton(element.current,{theme:'outline',size:'large',width:240}); })
      .catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Google 로그인 오류');});
    return ()=>{ active=false; if(receiver===callback)receiver=undefined; };
  },[onCredential,disabled]);
  return <View><div ref={element} style={{pointerEvents:disabled?'none':'auto',opacity:disabled?0.5:1}} />{error?<Text style={{color:'#FF6B6B'}}>{error}</Text>:null}</View>;
}
