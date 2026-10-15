import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
export function useRequestProviders(){
 const [providers,setProviders]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let generation=0,alive=true;
  async function load(){const run=++generation;setProviders([]);setError('');setLoading(true);
   try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error('Sign in to view your care team.');
    const {data,error}=await supabase.from('care_team').select('id,name,specialty,organization,email').eq('user_id',user.id).order('name');
    if(error)throw Error('Unable to load your care team. You can enter provider details manually.');
    if(alive&&run===generation)setProviders((data||[]).map(p=>({id:p.id,name:p.name||'',specialty:p.specialty||'',clinic:p.organization||'',email:p.email||''})));
   }catch(e){if(alive&&run===generation)setError(e.message);}finally{if(alive&&run===generation)setLoading(false);}
  }
  void load();const {data:{subscription}}=supabase.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN')void load();});
  return()=>{alive=false;generation++;subscription.unsubscribe();};
 },[]);return {providers,error,loading};
}
