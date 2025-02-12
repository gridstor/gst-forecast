import{d as p,u,a as h,c as d,b as f,r as g,t as v,e as x,_ as y,f as n,o as i,g as e,h as a,F as b,i as N,n as k,j as P,k as V,l as S}from"./index-DqAW-_pV.js";import{N as w}from"./NoteDisplay-DmBEzrp9.js";const D=p({__name:"PresenterPrint",setup(m,{expose:r}){r(),u(`
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
`),h({title:`Notes - ${d.title}`});const t={slidesWithNote:f(()=>g.map(o=>{var l;return(l=o.meta)==null?void 0:l.slide}).filter(o=>o!==void 0&&o.noteHTML!=="")),get configs(){return d},get themeVars(){return x},get total(){return v},NoteDisplay:w};return Object.defineProperty(t,"__isScriptSetup",{enumerable:!1,value:!0}),t}}),L={class:"m-4"},B={class:"mb-10"},H={class:"text-4xl font-bold mt-2"},T={class:"opacity-50"},W={class:"text-lg"},j={class:"font-bold flex gap-2"},C={class:"opacity-50"},F={key:0,class:"border-gray-400/50 mb-8"};function z(m,r,_,t,o,l){return i(),n("div",{id:"page-root",style:k(t.themeVars)},[e("div",L,[e("div",B,[e("h1",H,a(t.configs.title),1),e("div",T,a(new Date().toLocaleString()),1)]),(i(!0),n(b,null,N(t.slidesWithNote,(s,c)=>(i(),n("div",{key:c,class:"flex flex-col gap-4 break-inside-avoid-page"},[e("div",null,[e("h2",W,[e("div",j,[e("div",C,a(s==null?void 0:s.no)+"/"+a(t.total),1),S(" "+a(s==null?void 0:s.title)+" ",1),r[0]||(r[0]=e("div",{class:"flex-auto"},null,-1))])]),V(t.NoteDisplay,{"note-html":s.noteHTML,class:"max-w-full"},null,8,["note-html"])]),c<t.slidesWithNote.length-1?(i(),n("hr",F)):P("v-if",!0)]))),128))])],4)}const E=y(D,[["render",z],["__file","C:/Users/Administrator/Documents/gst-forecast/src/presentations/Hidden_Lakes_Budget_Forecast/node_modules/@slidev/client/internals/PresenterPrint.vue"]]);export{E as default};
