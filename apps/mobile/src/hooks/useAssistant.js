import {useEffect,useRef,useState} from 'react';
import {supabase} from '../lib/supabase';
import {requestAssistant} from '../lib/assistant-client';
export function useAssistant(page) {
 const [ownerId,setOwnerId]=useState(null);
 const [messages,setMessages]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(null),owner=useRef(null),generation=useRef(0);
 useEffect(()=>{
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(owner.current!==session?.user?.id){owner.current=session?.user?.id;setOwnerId(owner.current);generation.current++;pending.current?.abort();pending.current=null;setMessages([]);setBusy(false);setError('');}
  });
  return ()=>{generation.current++;pending.current?.abort();subscription.unsubscribe();};
 },[]);
 async function send(text){
  if(pending.current || !text.trim())return;
  const controller=new AbortController();pending.current=controller;const run=generation.current;
  setBusy(true);setError('');const timer=setTimeout(()=>controller.abort(),60000);
  try{
   const answer=await requestAssistant({message:text.trim(),history:messages,page,signal:controller.signal,
    getSession:async()=> (await supabase.auth.getSession()).data.session,
    baseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,anonKey:process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY});
   if(run===generation.current)setMessages(prev=>[...prev,{role:'user',content:text.trim()},{role:'assistant',content:answer}].slice(-20));
   return run===generation.current;
  }catch(e){if(run===generation.current)setError(e.name==='AbortError'?'The request timed out. Your message has not been cleared.':e.message);return false;}
  finally{clearTimeout(timer);if(run===generation.current){pending.current=null;setBusy(false);}}
 }
 return {messages,busy,error,send,ownerId};
}
