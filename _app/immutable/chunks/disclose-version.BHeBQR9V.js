import{W as v,J as i,C as m,X as p,Y as T,x as f,y as d,P as w,O as y}from"./runtime.CICtYj8j.js";function h(r){var t=document.createElement("template");return t.innerHTML=r,t.content}function a(r,t){var e=m;e.nodes_start===null&&(e.nodes_start=r,e.nodes_end=t)}function x(r,t){var e=(t&p)!==0,l=(t&T)!==0,s,_=!r.startsWith("<!>");return()=>{if(f)return a(d,null),d;s===void 0&&(s=h(_?r:"<!>"+r),e||(s=i(s)));var n=l?document.importNode(s,!0):s.cloneNode(!0);if(e){var c=i(n),o=n.lastChild;a(c,o)}else a(n,n);return n}}function M(r,t,e="svg"){var l=!r.startsWith("<!>"),s=(t&p)!==0,_=`<${e}>${l?r:"<!>"+r}</${e}>`,n;return()=>{if(f)return a(d,null),d;if(!n){var c=h(_),o=i(c);if(s)for(n=document.createDocumentFragment();i(o);)n.appendChild(i(o));else n=i(o)}var u=n.cloneNode(!0);if(s){var g=i(u),E=u.lastChild;a(g,E)}else a(u,u);return u}}function P(r=""){if(!f){var t=v(r+"");return a(t,t),t}var e=d;return e.nodeType!==3&&(e.before(e=v()),y(e)),a(e,e),e}function L(){if(f)return a(d,null),d;var r=document.createDocumentFragment(),t=document.createComment(""),e=v();return r.append(t,e),a(t,e),r}function O(r,t){if(f){m.nodes_end=d,w();return}r!==null&&r.before(t)}const C="5";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(C);export{O as a,a as b,L as c,P as d,M as n,x as t};
