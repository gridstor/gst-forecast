import{d as p,u,a as h,c as d,b as f,r as g,t as v,e as x,_ as y,f as n,o as i,g as e,h as a,F as b,i as N,j as k,k as P,l as V,n as S}from"./index-M870vsgP.js";import{N as w}from"./NoteDisplay-DqOH2xhw.js";const D=p({__name:"PresenterPrint",setup(m,{expose:r}){r(),u(`
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
`),h({title:`Notes - ${d.title}`});const t={slidesWithNote:f(()=>g.map(s=>{var l;return(l=s.meta)==null?void 0:l.slide}).filter(s=>s!==void 0&&s.noteHTML!=="")),get configs(){return d},get themeVars(){return x},get total(){return v},NoteDisplay:w};return Object.defineProperty(t,"__isScriptSetup",{enumerable:!1,value:!0}),t}}),B={class:"m-4"},L={class:"mb-10"},T={class:"text-4xl font-bold mt-2"},W={class:"opacity-50"},j={class:"text-lg"},C={class:"font-bold flex gap-2"},F={class:"opacity-50"},H={key:0,class:"border-gray-400/50 mb-8"};function z(m,r,_,t,s,l){return i(),n("div",{id:"page-root",style:S(t.themeVars)},[e("div",B,[e("div",L,[e("h1",T,a(t.configs.title),1),e("div",W,a(new Date().toLocaleString()),1)]),(i(!0),n(b,null,N(t.slidesWithNote,(o,c)=>(i(),n("div",{key:c,class:"flex flex-col gap-4 break-inside-avoid-page"},[e("div",null,[e("h2",j,[e("div",C,[e("div",F,a(o==null?void 0:o.no)+"/"+a(t.total),1),V(" "+a(o==null?void 0:o.title)+" ",1),r[0]||(r[0]=e("div",{class:"flex-auto"},null,-1))])]),P(t.NoteDisplay,{"note-html":o.noteHTML,class:"max-w-full"},null,8,["note-html"])]),c<t.slidesWithNote.length-1?(i(),n("hr",H)):k("v-if",!0)]))),128))])],4)}const E=y(D,[["render",z],["__file","C:/Users/Administrator/Documents/gst-forecast/src/presentations/Goleta_Budget_Forecast/node_modules/@slidev/client/internals/PresenterPrint.vue"]]);export{E as default};
