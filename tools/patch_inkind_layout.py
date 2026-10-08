from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")
marker = "/* JAMEYAT-IN-KIND-LAYOUT-V1 */"

if marker in s:
    print("Patch already present; nothing to do.")
    raise SystemExit(0)

patch = r"""
<style>
/* JAMEYAT-IN-KIND-LAYOUT-V1 */
.jw-inkind-summary-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;align-items:stretch!important;width:100%!important}
.jw-inkind-summary-row>*{min-width:0!important}
.jw-inkind-separator{width:100%!important;border-top:2px dashed rgba(100,116,139,.42)!important;margin:18px 0!important;height:0!important}
.jw-inkind-unreceived-actions{display:flex!important;flex-direction:row!important;gap:8px!important;align-items:center!important;justify-content:stretch!important;flex-wrap:wrap!important}
.jw-inkind-unreceived-actions a,.jw-inkind-unreceived-actions button{flex:1 1 0!important;min-width:110px!important;margin:0!important}
@media(max-width:700px){.jw-inkind-summary-row{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}.jw-inkind-unreceived-actions a,.jw-inkind-unreceived-actions button{min-width:90px!important}}
</style>
<script>
(function(){
'use strict';
function txt(e){return(e&&(e.textContent||'')).replace(/\s+/g,' ').trim()}
function vis(e){if(!e)return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'}
function exact(t){return Array.from(document.querySelectorAll('body *')).find(e=>vis(e)&&txt(e)===t&&e.children.length===0)}
function card(e){let c=e;for(let i=0;i<7&&c;i++,c=c.parentElement){const x=((c.className||'')+' '+(c.id||'')).toLowerCase();if(/card|stat|summary|metric|kpi|tile|panel/.test(x))return c}return e.parentElement||e}
function actions(c){if(!c)return;const ns=Array.from(c.querySelectorAll('a,button'));const as=ns.filter(n=>{const t=txt(n).toLowerCase(),h=(n.getAttribute('href')||'').toLowerCase();return /واتساب|whatsapp|هاتف|اتصال|phone|call/.test(t)||h.startsWith('tel:')||h.includes('wa.me')||h.includes('whatsapp')});if(as.length<2)return;let b=as[0].parentElement;while(b&&b!==c){if(Array.from(b.querySelectorAll('a,button')).filter(n=>as.includes(n)).length===as.length)break;b=b.parentElement}if(b&&b!==c)b.classList.add('jw-inkind-unreceived-actions')}
function apply(){
 const total=exact('إجمالي الكميات');let sp=null;
 if(total){const tc=card(total);sp=tc.parentElement;tc.remove()}
 if(sp&&Array.from(sp.children).filter(vis).length>=3)sp.classList.add('jw-inkind-summary-row');
 const title=exact('التبرعات العينية');
 if(title){let sec=title;for(let i=0;i<6&&sec.parentElement;i++){const p=sec.parentElement;if(p.querySelectorAll('button,a').length>2){sec=p;break}sec=p}
 const cs=Array.from(sec.querySelectorAll('div,section')).filter(e=>{if(!vis(e))return false;const k=Array.from(e.children).filter(vis);return k.length===3&&k.every(x=>/card|stat|summary|metric|kpi|tile|panel/i.test((x.className||'').toString()))});
 if(cs.length)cs[cs.length-1].classList.add('jw-inkind-summary-row')}
 const un=exact('التبرعات العينية غير المستلمة')||exact('غير المستلمة');
 if(un){let t=card(un);for(let i=0;i<4&&t.parentElement;i++){const p=t.parentElement;if(p.querySelectorAll('a,button').length>=2){t=p;break}}
 if(t&&!t.previousElementSibling?.classList?.contains('jw-inkind-separator')){const d=document.createElement('div');d.className='jw-inkind-separator';t.parentElement&&t.parentElement.insertBefore(d,t)}}
 Array.from(document.querySelectorAll('body *')).forEach(e=>{const t=txt(e);if(t.includes('غير مستلمة')||t.includes('غير المستلمة'))actions(card(e))})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,350));else setTimeout(apply,350);
let last=0;new MutationObserver(()=>{const n=Date.now();if(n-last<300)return;last=n;setTimeout(apply,100)}).observe(document.body,{childList:true,subtree:true});
})();
</script>
"""

if "</body>" not in s.lower():
    raise SystemExit("Could not find </body> in index.html")

pos = s.lower().rfind("</body>")
p.write_text(s[:pos] + patch + s[pos:], encoding="utf-8")
print("Patched index.html successfully.")
