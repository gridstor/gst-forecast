import{y as p,d as h,D as n,E as i,F as e,K as a,O as u,P as f,H as g,J as v,L as y,U as x}from"./chart.js-DyykkJaB.js";import{u as b,a as N,c as m,r as P,t as V,b as k,_ as S}from"./index-BJwFn-ro.js";import{N as w}from"./NoteDisplay-E6fUzxaC.js";const D=p({__name:"PresenterPrint",setup(_,{expose:r}){r(),b(`
@page {
  size: A4;
  margin-top: 1.5cm;
  margin-bottom: 1cm;
}
* {
  -webkit-print-color-adjust: exact;
}
html,
html body,
html #app,
html #page-root {
  height: auto;
  overflow: auto !important;
}
`),N({title:`Notes - ${m.title}`});const t={slidesWithNote:h(()=>P.map(s=>{var l;return(l=s.meta)==null?void 0:l.slide}).filter(s=>s!==void 0&&s.noteHTML!=="")),get configs(){return m},get themeVars(){return k},get total(){return V},NoteDisplay:w};return Object.defineProperty(t,"__isScriptSetup",{enumerable:!1,value:!0}),t}}),L={class:"m-4"},H={class:"mb-10"},T={class:"text-4xl font-bold mt-2"},W={class:"opacity-50"},B={class:"text-lg"},j={class:"font-bold flex gap-2"},z={class:"opacity-50"},C={key:0,class:"border-gray-400/50 mb-8"};function E(_,r,d,t,s,l){return i(),n("div",{id:"page-root",style:g(t.themeVars)},[e("div",L,[e("div",H,[e("h1",T,a(t.configs.title),1),e("div",W,a(new Date().toLocaleString()),1)]),(i(!0),n(u,null,f(t.slidesWithNote,(o,c)=>(i(),n("div",{key:c,class:"flex flex-col gap-4 break-inside-avoid-page"},[e("div",null,[e("h2",B,[e("div",j,[e("div",z,a(o==null?void 0:o.no)+"/"+a(t.total),1),x(" "+a(o==null?void 0:o.title)+" ",1),r[0]||(r[0]=e("div",{class:"flex-auto"},null,-1))])]),y(t.NoteDisplay,{"note-html":o.noteHTML,class:"max-w-full"},null,8,["note-html"])]),c<t.slidesWithNote.length-1?(i(),n("hr",C)):v("",!0)]))),128))])],4)}const A=S(D,[["render",E],["__file","PresenterPrint.vue"]]);export{A as default};
//# sourceMappingURL=PresenterPrint-BvOl1_Lm.js.map
