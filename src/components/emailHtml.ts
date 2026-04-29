export function looksLikeHtml(body: string): boolean {
  return /<(html|body|div|table|p|br|span|a|img|h[1-6])\b/i.test(body);
}

function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n').map((line) => {
    if (line.startsWith('&gt;&gt;') || line.startsWith('&gt; &gt;')) {
      return `<span class="q2">${line}</span>`;
    }
    if (line.startsWith('&gt;')) {
      return `<blockquote>${line.replace(/^&gt;\s?/, '')}</blockquote>`;
    }
    return line || '<br>';
  });

  const withLinks = lines
    .join('\n')
    .replace(/(https?:\/\/[^\s<>"&]+)/g, '<a href="$1" target="_blank">$1</a>');

  return `<pre>${withLinks}</pre>`;
}

export function buildEmailHtmlPage(body: string): string {
  const isHtml = looksLikeHtml(body);
  const content = isHtml ? body : plainTextToHtml(body);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=2">
<style>
*{box-sizing:border-box;}
html,body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.65;color:#1E293B;background:#fff;word-break:break-word;overflow-wrap:break-word;}
body{padding:4px 0;}
img{max-width:100%;height:auto;display:block;}
a{color:#6366F1;word-break:break-all;}
pre{white-space:pre-wrap;font-family:inherit;font-size:inherit;margin:0;}
blockquote{border-left:3px solid #C7D2FE;margin:6px 0;padding:4px 12px;color:#64748B;background:#F8FAFF;border-radius:0 6px 6px 0;}
.q2{color:#94A3B8;}
table{max-width:100%;border-collapse:collapse;}
td,th{padding:4px 8px;}
p{margin:0 0 8px 0;}
h1,h2,h3{margin:12px 0 6px 0;}
</style>
</head>
<body>${content}<script>
function rh(){var h=document.documentElement.scrollHeight;if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',value:h}));}else{window.parent.postMessage(JSON.stringify({type:'height',value:h}),'*');}}
window.addEventListener('load',function(){setTimeout(rh,80);});
document.querySelectorAll('img').forEach(function(i){i.addEventListener('load',rh);});
<\/script></body>
</html>`;
}
