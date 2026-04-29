export const EDITOR_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;}
.tb{display:flex;align-items:center;gap:4px;padding:8px 10px;background:#F8FAFF;border-bottom:1.5px solid #E2E8F0;flex-wrap:wrap;position:sticky;top:0;z-index:9;}
.btn{padding:5px 10px;border-radius:7px;border:1.5px solid #E2E8F0;background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:#475569;line-height:1;user-select:none;}
.btn:active,.btn.on{background:#6366F1;border-color:#6366F1;color:#fff;}
.sep{width:1px;height:22px;background:#E2E8F0;margin:0 2px;flex-shrink:0;}
.sw{width:22px;height:22px;border-radius:50%;border:2.5px solid #E2E8F0;cursor:pointer;flex-shrink:0;}
.sw:active{transform:scale(1.2);border-color:#0008;}
.sz{padding:5px 6px;border-radius:7px;border:1.5px solid #E2E8F0;background:#fff;font-size:12px;color:#475569;cursor:pointer;outline:none;}
.ed{padding:14px 16px;min-height:120px;outline:none;font-size:14px;line-height:1.65;color:#0F172A;word-break:break-word;}
.ed:empty:before{content:attr(data-ph);color:#94A3B8;pointer-events:none;}
#srcArea{width:100%;min-height:130px;padding:12px 16px;font-size:12px;font-family:'Courier New',monospace;border:none;outline:none;resize:vertical;line-height:1.6;color:#1E293B;background:#FAFBFF;display:none;}
</style>
</head>
<body>
<div class="tb">
  <button class="btn" id="bB" onmousedown="fmt(event,'bold')"><b>B</b></button>
  <button class="btn" id="bI" onmousedown="fmt(event,'italic')"><i>I</i></button>
  <button class="btn" id="bU" onmousedown="fmt(event,'underline')"><u>U</u></button>
  <div class="sep"></div>
  <select class="sz" onchange="sz(this.value)">
    <option value="">Size</option>
    <option value="1">Tiny</option>
    <option value="2">Small</option>
    <option value="3">Normal</option>
    <option value="4">Large</option>
    <option value="5">Bigger</option>
  </select>
  <div class="sep"></div>
  <div class="sw" style="background:#0F172A" onmousedown="clr(event,'#0F172A')"></div>
  <div class="sw" style="background:#6366F1" onmousedown="clr(event,'#6366F1')"></div>
  <div class="sw" style="background:#3B82F6" onmousedown="clr(event,'#3B82F6')"></div>
  <div class="sw" style="background:#10B981" onmousedown="clr(event,'#10B981')"></div>
  <div class="sw" style="background:#EF4444" onmousedown="clr(event,'#EF4444')"></div>
  <div class="sw" style="background:#F59E0B" onmousedown="clr(event,'#F59E0B')"></div>
  <div class="sw" style="background:#8B5CF6" onmousedown="clr(event,'#8B5CF6')"></div>
  <div class="sep"></div>
  <button class="btn" onmousedown="fmt(event,'insertUnorderedList')">&#8226; List</button>
  <button class="btn" onmousedown="lnk(event)">&#128279;</button>
  <button class="btn" onmousedown="fmt(event,'removeFormat')" style="font-size:11px">&#10005; Fmt</button>
  <div class="sep"></div>
  <button class="btn" id="srcBtn" onmousedown="toggleSrc(event)" title="Edit raw HTML source">&lt;/&gt;</button>
</div>
<div id="ed" class="ed" contenteditable="true" data-ph="Use toolbar above, or click &lt;/&gt; to paste HTML" oninput="notify()" onkeyup="upd()" onmouseup="upd()"></div>
<textarea id="srcArea" placeholder="Paste or type your HTML here, then click &lt;/&gt; again to preview&#10;&#10;Example:&#10;&lt;h3&gt;Your Name&lt;/h3&gt;&#10;&lt;p&gt;Title | Company&lt;/p&gt;&#10;&lt;img src=&quot;https://...&quot; width=&quot;120&quot;&gt;" oninput="notifySrc()"></textarea>
<script>
var ed=document.getElementById('ed');
var srcArea=document.getElementById('srcArea');
var srcMode=false;

function send(msg){
  if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(msg);}
  else{window.parent.postMessage(msg,'*');}
}
function fmt(e,c){e.preventDefault();document.execCommand(c);notify();upd();}
function clr(e,c){e.preventDefault();document.execCommand('foreColor',false,c);notify();}
function sz(v){if(!v)return;document.execCommand('fontSize',false,v);notify();}
function lnk(e){e.preventDefault();var u=prompt('URL:','https://');if(u){document.execCommand('createLink',false,u);notify();}}

function notify(){send(JSON.stringify({t:'ch',h:ed.innerHTML}));}
function notifySrc(){send(JSON.stringify({t:'ch',h:srcArea.value}));}

function toggleSrc(e){
  e.preventDefault();
  srcMode=!srcMode;
  document.getElementById('srcBtn').classList.toggle('on',srcMode);
  if(srcMode){
    // Rich → Source: show the current HTML in the textarea
    srcArea.value=ed.innerHTML;
    ed.style.display='none';
    srcArea.style.display='block';
    srcArea.focus();
  } else {
    // Source → Rich: parse the raw HTML into the editor
    var raw=srcArea.value||'';
    ed.innerHTML=raw;
    srcArea.style.display='none';
    ed.style.display='block';
    notify();
  }
}

function upd(){
  ['bB','bI','bU'].forEach(function(id){
    var cmd={bB:'bold',bI:'italic',bU:'underline'}[id];
    var el=document.getElementById(id);
    if(el)el.classList.toggle('on',document.queryCommandState(cmd));
  });
}

// Unescape HTML entities so stored escaped HTML renders correctly
function unescapeHtml(str){
  var ta=document.createElement('textarea');
  ta.innerHTML=str;
  return ta.value;
}

function handleSet(d){
  try{
    var p=JSON.parse(d);
    if(p.t==='set'){
      var html=p.h||'';
      // If value looks like escaped HTML (typed as text), unescape it first
      if(html.indexOf('&lt;')!==-1||html.indexOf('&#60;')!==-1){
        html=unescapeHtml(html);
      }
      if(srcMode){srcArea.value=html;}
      else{ed.innerHTML=html;}
    }
  }catch(x){}
}

window.addEventListener('message',function(e){
  var raw=typeof e.data==='string'?e.data:JSON.stringify(e.data);
  handleSet(raw);
});
document.addEventListener('message',function(e){handleSet(e.data);});
<\/script>
</body>
</html>`;
