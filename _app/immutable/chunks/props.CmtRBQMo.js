import{Z as A,_ as Q,$ as k,a0 as y,a1 as ee,a2 as g,a3 as v,a4 as m,g as h,x as C,a5 as re,a6 as ne,B as ie,W as se,T as B,J as te,X as ae,a7 as ue,a8 as fe,I as le,G as Y,a9 as M,S as U,aa as G,K as ce,n as F,b as K,y as oe,ab as V,ac as de,ad as _e,ae as W,af as ve,ag as Z,ah as T,ai as X,aj as be,ak as pe,v as $,al as he,l as ge,am as we,an as ye,f as H,ao as Pe,ap as Re}from"./runtime.BTaL276m.js";function I(e,r=null,t){if(typeof e!="object"||e===null||A in e)return e;const n=ne(e);if(n!==Q&&n!==k)return e;var s=new Map,c=ie(e),b=y(0);c&&s.set("length",y(e.length));var w;return new Proxy(e,{defineProperty(l,i,a){(!("value"in a)||a.configurable===!1||a.enumerable===!1||a.writable===!1)&&ee();var f=s.get(i);return f===void 0?(f=y(a.value),s.set(i,f)):g(f,I(a.value,w)),!0},deleteProperty(l,i){var a=s.get(i);if(a===void 0)i in l&&s.set(i,y(v));else{if(c&&typeof i=="string"){var f=s.get("length"),u=Number(i);Number.isInteger(u)&&u<f.v&&g(f,u)}g(a,v),z(b)}return!0},get(l,i,a){var _;if(i===A)return e;var f=s.get(i),u=i in l;if(f===void 0&&(!u||(_=m(l,i))!=null&&_.writable)&&(f=y(I(u?l[i]:v,w)),s.set(i,f)),f!==void 0){var o=h(f);return o===v?void 0:o}return Reflect.get(l,i,a)},getOwnPropertyDescriptor(l,i){var a=Reflect.getOwnPropertyDescriptor(l,i);if(a&&"value"in a){var f=s.get(i);f&&(a.value=h(f))}else if(a===void 0){var u=s.get(i),o=u==null?void 0:u.v;if(u!==void 0&&o!==v)return{enumerable:!0,configurable:!0,value:o,writable:!0}}return a},has(l,i){var o;if(i===A)return!0;var a=s.get(i),f=a!==void 0&&a.v!==v||Reflect.has(l,i);if(a!==void 0||C!==null&&(!f||(o=m(l,i))!=null&&o.writable)){a===void 0&&(a=y(f?I(l[i],w):v),s.set(i,a));var u=h(a);if(u===v)return!1}return f},set(l,i,a,f){var R;var u=s.get(i),o=i in l;if(c&&i==="length")for(var _=a;_<u.v;_+=1){var P=s.get(_+"");P!==void 0?g(P,v):_ in l&&(P=y(v),s.set(_+"",P))}u===void 0?(!o||(R=m(l,i))!=null&&R.writable)&&(u=y(void 0),g(u,I(a,w)),s.set(i,u)):(o=u.v!==v,g(u,I(a,w)));var p=Reflect.getOwnPropertyDescriptor(l,i);if(p!=null&&p.set&&p.set.call(f,a),!o){if(c&&typeof i=="string"){var S=s.get("length"),x=Number(i);Number.isInteger(x)&&x>=S.v&&g(S,x+1)}z(b)}return!0},ownKeys(l){h(b);var i=Reflect.ownKeys(l).filter(u=>{var o=s.get(u);return o===void 0||o.v!==v});for(var[a,f]of s)f.v!==v&&!(a in l)&&i.push(a);return i},setPrototypeOf(){re()}})}function z(e,r=1){g(e,e.v+r)}function Te(e,r,t=!1){B&&te();var n=e,s=null,c=null,b=v,w=t?ae:0,l=!1;const i=(f,u=!0)=>{l=!0,a(u,f)},a=(f,u)=>{if(b===(b=f))return;let o=!1;if(B){const _=n.data===ue;!!b===_&&(n=fe(),le(n),Y(!1),o=!0)}b?(s?M(s):u&&(s=U(()=>u(n))),c&&G(c,()=>{c=null})):(c?M(c):u&&(c=U(()=>u(n))),s&&G(s,()=>{s=null})),o&&Y(!0)};se(()=>{l=!1,r(i),l||a(null,null)},w),B&&(n=ce)}function Ee(e,r,t){if(e==null)return r(void 0),F;const n=K(()=>e.subscribe(r,t));return n.unsubscribe?()=>n.unsubscribe():n}let N=!1;function Ae(e,r,t){const n=t[r]??(t[r]={store:null,source:V(void 0),unsubscribe:F});if(n.store!==e)if(n.unsubscribe(),n.store=e,e==null)n.source.v=void 0,n.unsubscribe=F;else{var s=!0;n.unsubscribe=Ee(e,c=>{s?n.source.v=c:g(n.source,c)}),s=!1}return h(n.source)}function Ne(){const e={};return oe(()=>{for(var r in e)e[r].unsubscribe()}),e}function Ie(e){var r=N;try{return N=!1,[e(),N]}finally{N=r}}const me={get(e,r){if(!e.exclude.includes(r))return h(e.version),r in e.special?e.special[r]():e.props[r]},set(e,r,t){return r in e.special||(e.special[r]=xe({get[r](){return e.props[r]}},r,W)),e.special[r](t),Z(e.version),!0},getOwnPropertyDescriptor(e,r){if(!e.exclude.includes(r)&&r in e.props)return{enumerable:!0,configurable:!0,value:e.props[r]}},deleteProperty(e,r){return e.exclude.includes(r)||(e.exclude.push(r),Z(e.version)),!0},has(e,r){return e.exclude.includes(r)?!1:r in e.props},ownKeys(e){return Reflect.ownKeys(e.props).filter(r=>!e.exclude.includes(r))}};function De(e,r){return new Proxy({props:e,exclude:r,special:{},version:y(0)},me)}const Se={get(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(T(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n)return n[r]}},set(e,r,t){let n=e.props.length;for(;n--;){let s=e.props[n];T(s)&&(s=s());const c=m(s,r);if(c&&c.set)return c.set(t),!0}return!1},getOwnPropertyDescriptor(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(T(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n){const s=m(n,r);return s&&!s.configurable&&(s.configurable=!0),s}}},has(e,r){if(r===A||r===X)return!1;for(let t of e.props)if(T(t)&&(t=t()),t!=null&&r in t)return!0;return!1},ownKeys(e){const r=[];for(let t of e.props){T(t)&&(t=t());for(const n in t)r.includes(n)||r.push(n)}return r}};function Le(...e){return new Proxy({props:e},Se)}function J(e){for(var r=C,t=C;r!==null&&!(r.f&(be|pe));)r=r.parent;try{return $(r),e()}finally{$(t)}}function xe(e,r,t,n){var q;var s=(t&he)!==0,c=!ge||(t&we)!==0,b=(t&ye)!==0,w=(t&Re)!==0,l=!1,i;b?[i,l]=Ie(()=>e[r]):i=e[r];var a=A in e||X in e,f=((q=m(e,r))==null?void 0:q.set)??(a&&b&&r in e?d=>e[r]=d:void 0),u=n,o=!0,_=!1,P=()=>(_=!0,o&&(o=!1,w?u=K(n):u=n),u);i===void 0&&n!==void 0&&(f&&c&&de(),i=P(),f&&f(i));var p;if(c)p=()=>{var d=e[r];return d===void 0?P():(o=!0,_=!1,d)};else{var S=J(()=>(s?H:Pe)(()=>e[r]));S.f|=_e,p=()=>{var d=h(S);return d!==void 0&&(u=void 0),d===void 0?u:d}}if(!(t&W))return p;if(f){var x=e.$$legacy;return function(d,E){return arguments.length>0?((!c||!E||x||l)&&f(E?p():d),d):p()}}var R=!1,j=!1,D=V(i),O=J(()=>H(()=>{var d=p(),E=h(D);return R?(R=!1,j=!0,E):(j=!1,D.v=d)}));return s||(O.equals=ve),function(d,E){if(arguments.length>0){const L=E?h(O):c&&b?I(d):d;return O.equals(L)||(R=!0,g(D,L),_&&u!==void 0&&(u=L),K(()=>h(O))),d}return h(O)}}export{I as a,Ne as b,Ae as c,Te as i,De as l,xe as p,Le as s};