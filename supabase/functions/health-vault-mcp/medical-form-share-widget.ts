export const MEDICAL_FORM_SHARE_WIDGET_URI = "ui://widget/health-vault-medical-form-share-v8.html";

export const MEDICAL_FORM_SHARE_WIDGET_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;padding:14px;font:14px/1.45 ui-sans-serif,system-ui;color:#17223b;background:#fff}.card{border:1px solid #dfe3e8;border-radius:18px;padding:18px}.eyebrow{font-size:11px;letter-spacing:.14em;color:#08785f;font-weight:800}.title{font-size:22px;font-weight:800;margin:4px 0}.review{display:grid;grid-template-columns:minmax(120px,auto) 1fr;gap:8px 16px;border-top:1px solid #e4e7ec;border-bottom:1px solid #e4e7ec;padding:14px 0;margin:14px 0}.label{color:#667085;font-weight:700}.value{overflow-wrap:anywhere}.well{background:#f2f6f7;border-radius:12px;padding:14px;margin:14px 0}.muted{color:#667085}.loading{color:#667085;padding:16px;text-align:center}.button{width:100%;border:0;border-radius:12px;padding:13px;background:#17223b;color:#fff;font-weight:800;cursor:pointer}.button:disabled{opacity:.65;cursor:wait}.link{color:#1467e8;font-weight:750}.success{background:#e9f7f2;color:#075e49;border-radius:12px;padding:14px}
</style></head><body><div id="app"><section class="card loading">Loading secure share review…</section></div><script>
(function(){
  var app=document.getElementById('app');
  var busy=false;
  var completedShare=null;
  var latestOutput=null;
  var nextRequestId=1;
  var pendingRequests=new Map();
  function text(value){return value==null?'':String(value)}
  function esc(value){return text(value).replace(/[&<>"']/g,function(character){if(character==='&')return '&amp;';if(character==='<')return '&lt;';if(character==='>')return '&gt;';if(character==='"')return '&quot;';return '&#39;'})}
  function unwrap(raw){if(!raw)return {};if(raw.share)return raw.share;if(raw.structuredContent&&raw.structuredContent.share)return raw.structuredContent.share;return raw}
  function currentOutput(){var bridge=window.openai||{};var current=unwrap(bridge.toolOutput);if(completedShare)return completedShare;if(current&&current.templateId)return current;if(latestOutput)return latestOutput;return {}}
  function request(method,params){var id=nextRequestId++;window.parent.postMessage({jsonrpc:'2.0',id:id,method:method,params:params},'*');return new Promise(function(resolve,reject){pendingRequests.set(id,{resolve:resolve,reject:reject})})}
  function callTool(name,args){var bridge=window.openai||{};if(typeof bridge.callTool==='function')return bridge.callTool(name,args);return request('tools/call',{name:name,arguments:args})}
  function row(label,value){return '<div class="label">'+esc(label)+'</div><div class="value">'+esc(value)+'</div>'}
  function render(){
    if(!app)return;
    var output=currentOutput();
    if(!output.templateId||!output.recipientEmail){app.innerHTML='<section class="card loading">Loading secure share review…</section>';return}
    var done=output.confirmationState==='confirmed';
    var delivery=output.emailDelivery&&output.emailDelivery.recipient;
    var patientDelivery=output.emailDelivery&&output.emailDelivery.patientCopy;
    var deliveryText=delivery?(delivery.sent?'Email accepted for delivery to '+output.recipientEmail:'Email delivery failed; copy the secure link instead.'):'Confirming will create the link and email it to '+output.recipientEmail+'.';
    var receiptStatus=!output.sendPatientCopy?'No patient receipt requested':patientDelivery?(patientDelivery.sent?'Patient receipt accepted for delivery':'Patient receipt email failed; check the verified profile email'):'Send to the verified Health Vault email';
    var review=row('Completed fields',(output.completedFieldCount||13)+' of '+(output.totalFieldCount||13))+row('Recipient',output.recipientName+(output.recipientOrganization?' · '+output.recipientOrganization:''))+row('Recipient email',output.recipientEmail)+row('Access','Secure, read-only link')+row('Expiration',output.expiresInHours+' hours after creation')+(output.note?row('Note',output.note):'')+row('Patient receipt',receiptStatus);
    app.innerHTML='<section class="card"><div class="eyebrow">FINAL REVIEW · SECURE MEDICAL FORM</div><div class="title">'+esc(output.templateTitle)+'</div><div class="review">'+review+'</div><div class="well">'+esc(deliveryText)+'</div>'+(done?'<div class="success"><strong>Secure share created</strong><br><a id="open" class="link" href="#">Open secure share</a><br><span class="muted">Expires '+esc(output.expiresAt)+'</span></div>':'<button id="confirm" class="button" type="button">Confirm & Email Secure Share</button><div id="error"></div>')+'</section>';
    var confirmButton=document.getElementById('confirm');if(confirmButton)confirmButton.addEventListener('click',confirmShare);
    var openLink=document.getElementById('open');if(openLink)openLink.addEventListener('click',function(event){event.preventDefault();var bridge=window.openai||{};if(output.shareUrl&&typeof bridge.openExternal==='function')bridge.openExternal({href:output.shareUrl})});
  }
  async function confirmShare(){
    if(busy)return;busy=true;
    var output=currentOutput();var button=document.getElementById('confirm');
    if(button){button.disabled=true;button.textContent='Creating and emailing share…'}
    try{
      var result=await callTool('create_medical_form_email_share',{templateId:output.templateId,recipientName:output.recipientName,recipientOrganization:output.recipientOrganization||undefined,recipientEmail:output.recipientEmail,expiresInHours:output.expiresInHours||24,note:output.note||undefined,sendPatientCopy:Boolean(output.sendPatientCopy),confirmed:true});
      var serverError=result&&result.isError&&result.content&&result.content.find(function(item){return item&&item.type==='text'});
      if(serverError)throw new Error(serverError.text);
      completedShare=unwrap(result&&result.structuredContent?result.structuredContent:result);
      if(!completedShare||!completedShare.templateId)throw new Error('Health Vault did not return the secure share.');
      render();
    }catch(error){var target=document.getElementById('error');if(target)target.innerHTML='<div class="well" role="alert">'+esc(error&&error.message?error.message:'Unable to create the secure share.')+'</div>';if(button){button.disabled=false;button.textContent='Try again'}}finally{busy=false}
  }
  window.addEventListener('message',function(event){
    if(event.source!==window.parent)return;var message=event.data;if(!message||message.jsonrpc!=='2.0')return;
    if(message.id!==undefined&&pendingRequests.has(message.id)){var pending=pendingRequests.get(message.id);pendingRequests.delete(message.id);if(message.error)pending.reject(message.error);else pending.resolve(message.result);return}
    if(message.method==='ui/notifications/tool-result'){latestOutput=unwrap(message.params&&message.params.structuredContent);render()}
  },{passive:true});
  window.addEventListener('openai:set_globals',function(event){var detail=event.detail||{};var globals=detail.globals||{};latestOutput=unwrap(globals.toolOutput||detail.toolOutput);render()});
  render();
  var attempts=0;var timer=setInterval(function(){render();attempts+=1;if(currentOutput().templateId||attempts>=40)clearInterval(timer)},250);
})();
</script></body></html>`;
