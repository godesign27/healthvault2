// Check only an actual background/inactive → active transition. Never authorize,
// import, or reopen the portal as a side effect of returning to the app.
export function watchProviderReturn({appState,check,onError}) {
 let previous=appState.currentState,disposed=false,inFlight=false;
 const subscription=appState.addEventListener('change',async next=>{
  const returned=(previous==='background'||previous==='inactive')&&next==='active';
  previous=next;
  if(!returned||disposed||inFlight)return;
  inFlight=true;
  try {await check();} catch(error) {if(!disposed)onError(error);}
  finally {inFlight=false;}
 });
 return ()=>{disposed=true;subscription.remove();};
}
