export const MEDICAL_FORM_PROGRESS_WIDGET_URI = "ui://widget/health-vault-medical-form-progress.html";

export const MEDICAL_FORM_PROGRESS_WIDGET_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;padding:16px;font:15px/1.45 ui-sans-serif,system-ui;color:#17223b;background:#fff}.card{border:1px solid #dfe3e8;border-radius:18px;overflow:hidden}.head{padding:20px;background:#17223b;color:#fff;border-bottom:4px solid #0c9474}.eyebrow{font-size:12px;letter-spacing:.16em;color:#9fe8d5;font-weight:800}.title{font-size:24px;font-weight:800;margin-top:4px}.body{padding:20px}.row{display:flex;justify-content:space-between;gap:16px;font-weight:750}.track{height:10px;background:#e8edf1;border-radius:99px;overflow:hidden;margin:12px 0 16px}.fill{height:100%;background:#0c9474}.next{padding:14px;background:#f1f7f5;border-radius:12px}.label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#667085;margin-bottom:4px}.muted{color:#667085;margin-top:12px}
</style></head><body><div id="app"></div><script>
(function(){
  var app=document.getElementById('app');
  function text(value){return value==null?'':String(value)}
  function esc(value){return text(value).replace(/[&<>"']/g,function(character){if(character==='&')return '&amp;';if(character==='<')return '&lt;';if(character==='>')return '&gt;';if(character==='"')return '&quot;';return '&#39;'})}
  function number(value){var parsed=Number(value);return isFinite(parsed)?parsed:0}
  function render(){
    if(!app)return;
    var bridge=window.openai||{};
    var out=bridge.toolOutput||{};
    var progress=out.formProgress||out.progress||{};
    var title=out.templateTitle||'Medical form';
    var completed=number(progress.completedFields);
    var total=number(progress.totalFields);
    var percent=Math.max(0,Math.min(100,number(progress.percentReady)));
    var next=out.nextQuestion||null;
    var nextLabel=typeof next==='string'?next:(next&&next.label?next.label:'');
    var nextContent=nextLabel?'<div class="next"><div class="label">Next question</div><strong>'+esc(nextLabel)+'</strong></div>':'<div class="next"><strong>Ready for your final review and confirmation.</strong></div>';
    app.innerHTML='<section class="card"><header class="head"><div class="eyebrow">HEALTH VAULT</div><div class="title">'+esc(title)+'</div></header><div class="body"><div class="row"><span>'+esc(completed)+' of '+esc(total)+' required answers complete</span><span>'+esc(percent)+'%</span></div><div class="track"><div class="fill" style="width:'+percent+'%"></div></div>'+nextContent+'<div class="muted">Your answers stay private and are saved only after you explicitly confirm.</div></div></section>';
  }
  render();
  window.addEventListener('openai:set_globals',render);
})();
</script></body></html>`;
