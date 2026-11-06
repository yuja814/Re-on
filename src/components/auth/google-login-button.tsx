import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { signInWithGoogle } from '@/services/google-sign-in';
export default function GoogleLoginButton({onCredential,disabled,onError}: {onCredential:(token:string)=>void; disabled:boolean;onError?:(message:string)=>void}) {
  const [pending,setPending]=useState(false);
  return <Pressable disabled={disabled || pending} accessibilityRole="button" accessibilityLabel="Google로 로그인"
    onPress={()=>{setPending(true);void signInWithGoogle().then(token=>{if(token)onCredential(token);}).catch((reason:unknown)=>onError?.(reason instanceof Error?reason.message:'Google 로그인 실패')).finally(()=>setPending(false));}}>
    <Image source={require('@/assets/images/auth/google-sign-in.png')} style={{width:200,height:47}} contentFit="contain" />
  </Pressable>;
}
