import { WIDGET_HOST_SCRIPT } from "./widget-host.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

export const NOURISHED_REBEL_WIDGET_URI = "ui://health-vault/nourished-rebel-v5.html";

export async function callNourishedRebel(supabase: SupabaseClient, action: string, input: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("wellness-insights", {
    body: { action, productKey: "gpt_app", ...input },
  });
  if (error) throw new Error(`Unable to update Nourished Rebel Insights: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

export const NOURISHED_REBEL_WIDGET_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:light dark;font-family:ui-sans-serif,system-ui;color:#2f332d;background:#faf9f5}*{box-sizing:border-box}body{margin:0}.card{padding:20px;border:1px solid #d9ddd4;border-radius:18px;background:#fff}.eyebrow{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#58765e;font-weight:800}.question-label{display:block;font-size:28px;line-height:1.1;letter-spacing:-.02em;text-transform:none;color:#2f332d;font-weight:850;margin:4px 0 8px}.question-count{display:block;font-size:12px;line-height:1.3;letter-spacing:.1em;text-transform:uppercase;color:#58765e;margin-bottom:4px}.title{font:700 22px Georgia,serif;margin:7px 0 10px}.copy{line-height:1.55;color:#596057}.snapshot-list{margin:8px 0 0;padding-left:20px;color:#596057}.snapshot-list li{margin:6px 0;line-height:1.5}.progress{height:7px;background:#edf0ea;border-radius:9px;overflow:hidden;margin:14px 0}.bar{height:100%;background:#66856d}.pillars{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.pillar{padding:10px;border-radius:12px;background:#f2f3ef}.pillar b{display:block;text-transform:capitalize}.status{display:inline-flex;margin-top:5px;border:1px solid;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800;line-height:1.2;text-transform:capitalize}.status-strong{border-color:#a7d7ba;background:#e9f7ee;color:#176b3a}.status-needs_support{border-color:#e5c56f;background:#fff7dd;color:#805b00}.status-significant_opportunity{border-color:#efaa91;background:#fff0ea;color:#9a3412}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}button,a{border:1px solid #66856d;border-radius:999px;padding:9px 13px;font-weight:700;background:#66856d;color:#fff;text-decoration:none}.secondary{background:transparent;color:#425648}.note{font-size:11px;color:#777;margin-top:14px}textarea{width:100%;min-height:110px;border:1px solid #ccd2c7;border-radius:12px;padding:11px;font:inherit}.questions button{margin-top:10px}.error{color:#a33;font-size:13px}
</style></head><body><div id="app" class="card"><p class="copy">Loading your wellness insight…</p></div><script>
${WIDGET_HOST_SCRIPT}
let busy=false, editing=false;
const app=document.getElementById('app');function unwrap(v){let x=v;for(let i=0;i<4&&x;i++){if(x.latestInsight||x.checkIn||x.partner)return x;if(x.state){x=x.state;continue}if(x.structuredContent){x=x.structuredContent;continue}if(x.result){x=x.result;continue}break}return null}let latestState=unwrap(hvHost.output);const keys=['sleep','meal_rhythm','energy_cravings','stress','hydration','movement'];const labels={sleep:'Sleep',meal_rhythm:'Meal rhythm',energy_cravings:'Energy & cravings',stress:'Stress',hydration:'Hydration',movement:'Movement'};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function insightMarkup(row){const i=row.insight;const points=(i.snapshot.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[i.snapshot]).map(v=>v.trim()).filter(Boolean);return '<div class="eyebrow">Nourished Rebel · Wellness Insights</div><div class="title">Here’s where things stand</div><ul class="snapshot-list">'+points.map(point=>'<li>'+esc(point)+'</li>').join('')+'</ul><div class="pillars">'+Object.entries(i.pillars).map(([k,p])=>'<div class="pillar"><b>'+esc(k.replace('_',' '))+'</b><span class="status status-'+esc(p.status)+'">'+esc(p.status.replaceAll('_',' '))+'</span><div class="copy">'+esc(p.summary)+'</div></div>').join('')+'</div><div class="actions"><a href="https://healthvault.me/?app=wellness&source=chatgpt">Open in Health Vault</a><a class="secondary" href="https://nourishedrebel.com/?utm_source=health_vault_gpt&utm_campaign=nourished_rebel_insights">Visit Nourished Rebel</a></div><div class="note">'+esc(i.disclaimer)+' Booking stays on Nourished Rebel’s site and is not integrated with Health Vault yet.</div>'}
function render(s){if(!s){app.innerHTML='<div class="eyebrow">Nourished Rebel</div><div class="title">We couldn’t refresh your insight</div><div class="copy">Your saved check-in is unchanged. Please try generating your insight again shortly.</div>';return}if(s.latestInsight){app.innerHTML=insightMarkup(s.latestInsight);return}if(keys.every(k=>s.checkIn?.answers?.[k]||s.checkIn?.skipped_questions?.includes(k))){start(s);return}const n=s.checkIn?.answered_count||0;app.innerHTML='<div class="eyebrow">Nourished Rebel</div><div class="title">'+(n?'Pick up where you left off':'Your wellness insights are waiting')+'</div><div class="copy">Six short questions. Answer what you want; every answer saves.</div><div class="progress"><div class="bar" style="width:'+(n/6*100)+'%"></div></div><div class="actions"><button id="start">'+(s.enrollment?.active?'Continue check-in':'Start check-in')+'</button></div>';document.getElementById('start').onclick=()=>start(s)}
function start(s){const key=keys.find(k=>!s.checkIn?.answers?.[k]&&!s.checkIn?.skipped_questions?.includes(k));if(!key){app.innerHTML='<div class="title">Check-in complete</div><div class="copy">All six questions have been answered or skipped. Open Health Vault to review your check-in and generate your insight.</div><div class="actions"><a href="https://healthvault.me/?app=wellness&source=chatgpt">Open Health Vault</a></div>';editing=false;return}editing=true;const current=Math.min(6,(s.checkIn?.answered_count||0)+(s.checkIn?.skipped_questions?.length||0)+1);app.innerHTML='<div class="question-count">Question '+current+' of 6</div><div class="question-label">'+esc(labels[key])+'</div><div class="title">Tell me what’s true right now</div><div class="questions"><textarea id="answer" placeholder="Share only what you’re comfortable sharing."></textarea><div class="actions"><button id="save">Save & continue</button><button class="secondary" id="skip">Skip</button></div><div id="err" class="error"></div></div>';async function submit(skipped){
if(busy)return;
const answer=document.getElementById('answer'),save=document.getElementById('save'),skip=document.getElementById('skip'),err=document.getElementById('err');
const value=answer.value.trim();
if(!skipped&&!value){err.textContent='Enter an answer or choose Skip.';return}
busy=true;save.disabled=true;skip.disabled=true;answer.disabled=true;save.textContent='Saving…';err.textContent='';
try{
if(!s.enrollment?.active){
const enrolled=unwrap(await hvHost.callTool('start_nourished_rebel_check_in',{confirmed:true}));
if(!enrolled?.enrollment?.active)throw new Error('Enrollment could not be verified.');
s=enrolled;
}
const next=unwrap(await hvHost.callTool('save_nourished_rebel_check_in_answer',{questionKey:key,answer:skipped?null:value,skipped,confirmed:true}));
const verified=skipped?next?.checkIn?.skipped_questions?.includes(key):next?.checkIn?.answers?.[key]===value;
if(!verified)throw new Error('Your saved answer could not be verified.');
busy=false;editing=false;latestState=next;render(next);app.innerHTML='<p role="status">'+(skipped?'Question skipped.':'Answer saved.')+'</p>'+app.innerHTML;if(document.getElementById('start'))document.getElementById('start').onclick=()=>start(next);
}catch(e){
err.textContent=(e.message||'Unable to save.')+(hvHost.confirmationSubmitted?' Open Health Vault to verify your check-in before trying again.':'');
if(hvHost.confirmationSubmitted){save.textContent='Check Health Vault';}
else{busy=false;save.disabled=false;skip.disabled=false;answer.disabled=false;save.textContent='Try again';}
}
}document.getElementById('save').onclick=()=>submit(false);document.getElementById('skip').onclick=()=>submit(true)}
hvHost.subscribe(()=>{if(busy||editing||hvHost.confirmationSubmitted)return;latestState=unwrap(hvHost.output)||latestState;if(latestState)render(latestState)});if(latestState)render(latestState);
</script></body></html>`;
