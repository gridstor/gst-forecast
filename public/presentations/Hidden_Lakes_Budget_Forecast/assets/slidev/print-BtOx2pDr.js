import{d as _,$ as u,y as h,b as n,e as t,x as s,A as r,F as f,Z as g,o as l,a0 as v,l as x,g as b}from"../modules/vue-DUIs0fbu.js";import{u as y,h as N,c as m}from"../index-7vEf53fr.js";import{_ as k}from"./NoteDisplay.vue_vue_type_style_index_0_lang-B4jFl2wo.js";import"../modules/shiki-Dfhzjfbi.js";const w={id:"page-root"},L={class:"m-4"},T={class:"mb-10"},V={class:"text-4xl font-bold mt-2"},B={class:"opacity-50"},H={class:"text-lg"},S={class:"font-bold flex gap-2"},$={class:"opacity-50"},A={key:0,class:"border-main mb-8"},z=_({__name:"print",setup(C){const{slides:d,total:p}=y();u(`
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
`),N({title:`Notes - ${m.title}`});const i=h(()=>d.value.map(o=>{var a;return(a=o.meta)==null?void 0:a.slide}).filter(o=>o!==void 0&&o.noteHTML!==""));return(o,a)=>(l(),n("div",w,[t("div",L,[t("div",T,[t("h1",V,s(r(m).title),1),t("div",B,s(new Date().toLocaleString()),1)]),(l(!0),n(f,null,g(i.value,(e,c)=>(l(),n("div",{key:c,class:"flex flex-col gap-4 break-inside-avoid-page"},[t("div",null,[t("h2",H,[t("div",S,[t("div",$,s(e==null?void 0:e.no)+"/"+s(r(p)),1),v(" "+s(e==null?void 0:e.title)+" ",1),a[0]||(a[0]=t("div",{class:"flex-auto"},null,-1))])]),x(k,{"note-html":e.noteHTML,class:"max-w-full"},null,8,["note-html"])]),c<i.value.length-1?(l(),n("hr",A)):b("",!0)]))),128))])]))}});export{z as default};
