export const MEDICAL_FORM_WIDGET_URI = "ui://widget/health-vault-medical-form-interview.html";

export const MEDICAL_FORM_WIDGET_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}body{margin:0;padding:12px;background:transparent;color:#202528}
.card{overflow:hidden;border:1px solid #e2e5e7;border-radius:14px;background:#fff}
.hero{padding:18px 20px;color:#f7fafc;background:#17213a;border-bottom:3px solid #0b8063}
.eyebrow{margin:0 0 6px;color:#9ee3cf;font-size:10px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}
h1{margin:0;font-size:21px}.hero p:last-child{margin:7px 0 0;color:#cbd5e1;font-size:12px;line-height:1.45}
.body{display:grid;gap:10px;padding:16px 18px}
.form,.question,.prefill{padding:13px 14px;border:1px solid #e2e5e7;border-radius:10px}
.top,.progress-label{display:flex;justify-content:space-between;gap:12px}
.title{font-weight:750}.status{color:#0b8063;font-size:11px;font-weight:700;text-transform:capitalize}
.status.not_started{color:#687075}
.description,.meta{margin:5px 0 0;color:#687075;font-size:12px;line-height:1.4}
.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:11px;align-items:center}
.upload{padding:14px;border:1px dashed #93a3b8;border-radius:10px;background:#f8fafc}
.footer{display:flex;justify-content:space-between;gap:12px;padding:0 18px 16px}
.link,button{min-height:44px;border:0;background:none;color:#2563eb;font:inherit;font-size:12px;font-weight:750;text-decoration:none;cursor:pointer}
.primary{padding:0 16px;border-radius:9px;background:#2563eb;color:white}
.secondary{padding:0 14px;border:1px solid #cbd5e1;border-radius:9px;color:#2563eb}
.link:focus-visible,button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
.bar{height:8px;margin:8px 0 3px;overflow:hidden;border-radius:999px;background:#e5e7eb}
.fill{height:100%;background:#0b8063}
.question{border-color:#bfdbfe;background:#eff6ff}
.question-label{margin:5px 0 0;font-size:15px;font-weight:700}
.field{display:grid;gap:6px;margin-top:10px}
.field input{min-height:40px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit;background:#fff;color:inherit}
.option{display:inline-block;margin:7px 5px 0 0;padding:8px 12px;border-radius:999px;background:#fff;color:#1d4ed8;font-size:12px;border:1px solid #bfdbfe}
.option.selected{background:#2563eb;color:#fff;border-color:#2563eb}
.prefill ul{margin:8px 0 0;padding-left:18px}
.prefill li{margin:5px 0;color:#475569;font-size:12px}
.notice{padding:10px 12px;border-radius:9px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.45}
.row{padding:12px 0;border-bottom:1px solid #e8eaeb}
.label{display:block;margin-bottom:4px;color:#687075;font-size:10px;font-weight:750;letter-spacing:.06em;text-transform:uppercase}
.value{white-space:pre-wrap;font-size:13px;line-height:1.45}
.error{color:#991b1b;background:#fef2f2}
.success{color:#145846;background:#edf6f2}
button:disabled{opacity:.65;cursor:wait}
@media(prefers-color-scheme:dark){
  body{color:#eef1f3}.card,.form,.prefill{border-color:#343a3e;background:#15191c}
  .upload,.notice{border-color:#56616b;background:#11161a}
  .description,.meta,.prefill li,.label{color:#a7afb4}
  .question{border-color:#24598c;background:#10263c}
  .option{background:#17213a;color:#dbeafe;border-color:#24598c}
  .link,button{color:#8ab4ff}.primary{color:white;background:#2563eb}
  .secondary{border-color:#475569}.bar{background:#343a3e}.row{border-color:#343a3e}
}
</style></head>
<body><main id="app" class="card"><div class="body">Loading medical forms…</div></main>
<script>
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const outputOf=(result)=>result?.structuredContent||result||{};
let interactiveOutput=null;
let submitting=false;
const external=(href)=>window.openai?.openExternal?window.openai.openExternal({href}):window.open(href,'_blank','noopener,noreferrer');
const setBusy=(button,text)=>{if(!button)return;button.disabled=true;button.textContent=text};
function showError(message){
  const app=document.getElementById('app');
  const existing=app.querySelector('[data-error]');
  if(existing)existing.remove();
  app.insertAdjacentHTML('beforeend','<div class="body" data-error><div class="notice error" role="alert">'+esc(message)+'</div></div>');
}
async function call(name,args,button,label){
  try{
    if(button)setBusy(button,label);
    if(!window.openai?.callTool)throw new Error('This action is unavailable in the current ChatGPT session. Continue in chat.');
    const result=await window.openai.callTool(name,args);
    interactiveOutput=outputOf(result);
    renderOutput(interactiveOutput);
    return interactiveOutput;
  }catch(error){
    showError(error?.message||'Unable to continue.');
    throw error;
  }finally{
    if(button)button.disabled=false;
  }
}
function renderCatalog(out){
  const forms=out.forms||[];
  document.getElementById('app').innerHTML='<div class="hero"><p class="eyebrow">Health Vault</p><h1>Which form do you need?</h1><p>Complete reusable forms with ChatGPT. Uploads and restricted legal fields stay in your secure Vault.</p></div><div class="body">'+forms.map((form)=>'<article class="form"><div class="top"><span class="title">'+esc(form.title)+'</span><span class="status '+esc(form.status)+'">'+esc(String(form.status||'').replaceAll('_',' '))+'</span></div><p class="description">'+esc(form.description)+'</p><p class="meta">'+(form.chatEditable?'ChatGPT can prefill safe profile details and ask for what is missing.':'Requires secure web completion.')+(form.updatedAt?' · Updated '+esc(new Date(form.updatedAt).toLocaleDateString()):'')+'</p><div class="actions">'+(form.chatEditable?'<button class="primary" data-start="'+esc(form.id)+'">'+(form.status==='not_started'?'Start in ChatGPT':'Continue in ChatGPT')+'</button>':'<button class="secondary" data-external="'+esc(form.resumeUrl)+'">Open secure form</button>')+'</div></article>').join('')+'<article class="upload"><span class="title">Have a provider form?</span><p class="description">Upload a PDF or clear photos in your private Health Vault. Restricted fields are never collected in chat.</p><div class="actions"><button class="secondary" data-external="'+esc(out.uploadUrl)+'">Upload PDF or photos</button></div></article></div><div class="footer"><span class="meta">'+esc(out.completedCount)+' of '+esc(forms.length)+' common forms complete</span><button class="link" data-external="'+esc(out.allFormsUrl)+'">View all forms</button></div>';
  document.querySelectorAll('[data-start]').forEach((button)=>button.addEventListener('click',()=>call('get_medical_form',{templateId:button.dataset.start},button,'Loading…')));
  document.querySelectorAll('[data-external]').forEach((button)=>button.addEventListener('click',()=>external(button.dataset.external)));
}
function promptFor(form,mode){
  const p=form.progress||{};
  const group=form.nextGroup;
  const q=form.nextQuestion;
  const intro='Continue my Health Vault '+form.definition.title+' interview in ChatGPT. '+p.readyFields+' of '+p.totalFields+' safe fields are ready ('+p.percentReady+'%). ';
  if(mode==='review')return intro+'Review the profile-derived suggestions with me, clearly label them as unconfirmed, then ask for corrections. Never ask for SSN, signatures, legal consent, or payment information.';
  if(group)return intro+'Ask this related group together: '+group.title+'. '+group.prompt+' After my answers, persist them with get_medical_form_progress and continue to the next group.';
  return intro+(q?'Ask me only the next missing question: "'+q.label+'". After my answer, persist it with get_medical_form_progress.':'The required answers are ready. Show the final review card with Confirm & Save. Never ask for SSN, signatures, legal consent, or payment information.');
}
async function continueChat(form,mode,button){
  try{
    setBusy(button, mode==='review'?'Loading prefilled answers…':'Opening question…');
    if(mode==='review'){
      await call('get_medical_form_progress',{templateId:form.definition.id,acceptSuggestions:true},button,'Loading prefilled answers…');
    }
    if(window.openai?.sendFollowUpMessage){
      await window.openai.sendFollowUpMessage({prompt:promptFor(form,mode)});
    }else if(mode!=='review'){
      throw new Error('Continue by answering the next question in chat.');
    }
  }catch(error){
    if(mode!=='review')showError(error?.message||'Unable to start the interview.');
  }finally{
    if(button){button.disabled=false;button.textContent=mode==='review'?'Review prefilled answers':'Continue interview'}
  }
}
function groupMarkup(group){
  if(!group)return {html:'',pending:{},fields:[]};
  const fields=group.fields||[];
  const inputs=fields.map((field)=>{
    if(field.options&&field.options.length){
      return '<div class="field"><span class="label">'+esc(field.label)+'</span><div>'+field.options.map((option)=>'<button type="button" class="option" data-field="'+esc(field.key)+'" data-value="'+esc(option)+'">'+esc(option)+'</button>').join('')+'</div></div>';
    }
    return '<label class="field"><span class="label">'+esc(field.label)+(field.required===false?' (optional)':'')+'</span><input name="'+esc(field.key)+'" placeholder="'+esc(field.label)+'"></label>';
  }).join('');
  const needsForm=fields.some((field)=>!(field.options&&field.options.length));
  return {html:'<section class="question" id="next-group"><p class="eyebrow">Next</p><p class="question-label">'+esc(group.title)+'</p><p class="description">'+esc(group.prompt)+'</p>'+inputs+'<div class="actions">'+(needsForm?'<button class="primary" id="submit-group">Continue</button>':'')+'<button class="'+(needsForm?'secondary':'primary')+'" id="continue">Answer in chat</button></div></section>',pending:{},fields,needsForm};
}
function collectGroupAnswers(pending){
  const answers={...pending};
  document.querySelectorAll('#next-group input[name]').forEach((input)=>{if(input.value.trim())answers[input.name]=input.value.trim()});
  return answers;
}
function renderInterview(form,out){
  const d=form.definition,p=form.progress||{},group=form.nextGroup,s=form.suggestionsToReview||[];
  const preview=out.preview;
  if(preview?.willComplete){renderReview(preview,out);return;}
  const groupBlock=groupMarkup(group);
  const readyNotice=group?'':'<div class="notice">All safe fields are ready. Review your answers, then use Confirm &amp; Save. Nothing has been saved yet.</div><div class="actions"><button class="primary" id="open-review">Review answers</button></div>';
  document.getElementById('app').innerHTML='<div class="hero"><p class="eyebrow">Health Vault · Form interview</p><h1>'+esc(d.title)+'</h1><p>'+esc(d.description)+'</p></div><div class="body"><div><div class="progress-label"><span class="title">'+esc(p.readyFields)+' of '+esc(p.totalFields)+' fields ready</span><span class="status">'+esc(p.percentReady)+'%</span></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+esc(p.percentReady)+'"><div class="fill" style="width:'+esc(p.percentReady)+'%"></div></div><p class="meta">'+esc(p.savedFields||0)+' saved · '+esc(p.interviewFields||0)+' accepted in this interview · '+esc(p.suggestedFields||0)+' safely prefilled for review · '+esc(p.remainingFields)+' questions remaining</p></div>'+(groupBlock.html||readyNotice)+(s.length?'<section class="prefill"><span class="title">Prefilled from your Health Vault profile</span><p class="description">These are suggestions only and must be reviewed before saving.</p><ul>'+s.map((item)=>'<li><strong>'+esc(item.label)+':</strong> '+esc(item.value)+'</li>').join('')+'</ul><div class="actions"><button class="secondary" id="review">Review prefilled answers</button></div></section>':'')+'<div class="notice">For your privacy, ChatGPT will not request Social Security numbers, signatures, legal consent, or payment information.</div><div class="actions"><button class="link" id="back">← Choose another form</button></div></div>';
  const pending=groupBlock.pending||{};
  const submitAnswers=(answers,button,label)=>call('get_medical_form_progress',{templateId:d.id,answers},button,label);
  const cont=document.getElementById('continue');if(cont)cont.addEventListener('click',()=>continueChat(form,'continue',cont));
  const review=document.getElementById('review');if(review)review.addEventListener('click',()=>continueChat(form,'review',review));
  document.getElementById('back')?.addEventListener('click',(event)=>call('list_medical_forms',{},event.currentTarget,'Loading…'));
  document.getElementById('open-review')?.addEventListener('click',(event)=>call('get_medical_form_progress',{templateId:d.id},event.currentTarget,'Preparing review…'));
  document.getElementById('submit-group')?.addEventListener('click',(event)=>{
    const answers=collectGroupAnswers(pending);
    if(!Object.keys(answers).length){showError('Add at least one answer in this group to continue.');return;}
    submitAnswers(answers,event.currentTarget,'Saving answers…');
  });
  document.querySelectorAll('[data-field]').forEach((button)=>button.addEventListener('click',()=>{
    pending[button.dataset.field]=button.dataset.value;
    button.parentElement.querySelectorAll('[data-field="'+button.dataset.field+'"]').forEach((el)=>el.classList.remove('selected'));
    button.classList.add('selected');
    const fields=groupBlock.fields||[];
    if(fields.length&&fields.every((field)=>field.options&&pending[field.key])){
      submitAnswers({...pending},button,'Saving answers…');
    }
  }));
}
function renderReview(preview,out){
  const finishing=Boolean(preview.willComplete);
  const notice=finishing?'Nothing has been saved. Confirm &amp; Save to complete this private form. This does not sign or share the form.':'Nothing has been saved. Confirm &amp; Save to update your private draft. This does not sign or share the form.';
  document.getElementById('app').innerHTML='<div class="hero"><p class="eyebrow">Review before saving</p><h1>'+esc(preview.templateTitle)+'</h1></div><div class="body">'+(preview.reviewFields||[]).map((field)=>'<div class="row"><span class="label">'+esc(field.label)+'</span><div class="value">'+esc(field.value)+'</div></div>').join('')+'</div><div class="notice">'+notice+'</div><div class="actions" style="padding:0 20px 20px"><button class="primary" id="confirm">Confirm &amp; Save</button><a class="secondary" href="https://healthvault27.com/?app=medical-forms&form='+encodeURIComponent(preview.templateId)+'&source=chatgpt" id="open">Open secure form</a></div><div id="error"></div>';
  document.getElementById('confirm')?.addEventListener('click',()=>saveReview(preview));
  document.getElementById('open')?.addEventListener('click',(event)=>{event.preventDefault();external(event.currentTarget.href)});
}
async function saveReview(preview){
  if(submitting||!preview)return;
  submitting=true;
  const button=document.getElementById('confirm');
  if(button){button.disabled=true;button.textContent='Saving…';}
  try{
    const result=await call('confirm_form_answers',{proposalId:preview.proposalId,confirmed:true},button,'Saving…');
    const saved=result?.saved||result?.structuredContent?.saved;
    if(!saved)throw new Error('Health Vault did not return the saved form.');
    renderSaved(saved);
  }catch(error){
    const target=document.getElementById('error');
    if(target)target.innerHTML='<div class="notice error" role="alert">'+esc(error?.message||'Unable to save the form.')+'</div>';
    if(button){button.disabled=false;button.textContent='Confirm & Save';}
  }finally{submitting=false}
}
function renderSaved(saved){
  const complete=saved.savedAs==='completed_form';
  const offer=saved.shareOffer||{};
  document.getElementById('app').innerHTML='<div class="hero"><p class="eyebrow">Health Vault</p><h1>'+(complete?'Form saved':'Draft saved')+'</h1></div><div class="body"><div class="notice success">'+esc(saved.safeSummary||'Your confirmed answers were saved.')+'</div>'+(complete?'<p class="meta">The completed form remains private until you explicitly create a secure share.</p><div class="actions"><button class="primary" id="share">Create a secure share</button></div>':'<p class="meta">'+esc(offer.safeSummary||'Continue the interview to finish remaining questions.')+'</p>')+'<div class="actions"><button class="link" id="back">← Choose another form</button></div></div>';
  document.getElementById('back')?.addEventListener('click',(event)=>call('list_medical_forms',{},event.currentTarget,'Loading…'));
  document.getElementById('share')?.addEventListener('click',async (event)=>{
    const button=event.currentTarget;
    try{
      if(window.openai?.sendFollowUpMessage){
        setBusy(button,'Opening share…');
        await window.openai.sendFollowUpMessage({prompt:offer.prompt||'Create a secure share of my completed medical form.'});
      }else{
        throw new Error('Tell ChatGPT who should receive the secure share.');
      }
    }catch(error){showError(error?.message||'Unable to start a secure share.')}
    finally{button.disabled=false;button.textContent='Create a secure share'}
  });
}
function renderOutput(out){
  if(!out||typeof out!=='object')return;
  if(out.saved)return renderSaved(out.saved);
  if(out.preview)return renderReview(out.preview,out);
  if(out.form)return renderInterview(out.form,out);
  if(out.forms)return renderCatalog(out);
}
function render(){renderOutput(interactiveOutput||window.openai?.toolOutput||{})}
window.addEventListener('openai:set_globals',render);
window.addEventListener('message',(event)=>{
  if(event.source!==window.parent)return;
  const message=event.data;
  if(!message||message.jsonrpc!=='2.0')return;
  if(message.method!=='ui/notifications/tool-result')return;
  const data=message.params?.structuredContent||message.params;
  if(data){interactiveOutput=data;renderOutput(data)}
},{passive:true});
render();
</script></body></html>`;
