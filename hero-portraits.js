/* QUEST DAY 1.4 — New fantasy hero collection. Independent vector artwork,
   not copied from the 12 original guardians. All SVGs are generated locally. */
(function(){
  "use strict";
  const styles = {
    hero_aren: {type:"knight",hair:"#39415f",skin:"#f4d9c4",main:"#6086cc",dark:"#2b3c69",aura:"#ffe2a2",trim:"#f7d28c",pose:-3},
    hero_lyra: {type:"mage",hair:"#b49df6",skin:"#ffdfd0",main:"#8f62dd",dark:"#493286",aura:"#c89dff",trim:"#ffdfb8",pose:4},
    hero_kyle: {type:"archer",hair:"#deb968",skin:"#efd5ae",main:"#4eaa6f",dark:"#274c36",aura:"#acff9e",trim:"#d9e7a0",pose:7},
    hero_sera: {type:"cleric",hair:"#f3e6c5",skin:"#ffe8d2",main:"#e9d5a5",dark:"#7485bf",aura:"#fff0a7",trim:"#fff8e4",pose:0},
    hero_zed: {type:"assassin",hair:"#222437",skin:"#e2b8b0",main:"#8d364f",dark:"#221e38",aura:"#ff557e",trim:"#ee95a2",pose:-8},
    hero_elin: {type:"spirit",hair:"#c2dd99",skin:"#ffe3c8",main:"#66b79a",dark:"#2d6e5d",aura:"#9effd1",trim:"#e2ffd3",pose:5},
    hero_rohan: {type:"gunner",hair:"#3d303b",skin:"#e7c2aa",main:"#c65e43",dark:"#513044",aura:"#ffad6c",trim:"#ffd4a2",pose:-4},
    hero_eve: {type:"swords",hair:"#d6e1fa",skin:"#f6d9ca",main:"#7098de",dark:"#343c77",aura:"#79cdff",trim:"#e9f1ff",pose:4},
    hero_baruk: {type:"guardian",hair:"#6c5c56",skin:"#f4d0ac",main:"#b79359",dark:"#36456d",aura:"#ffdd91",trim:"#fff2c4",pose:0},
    hero_nia: {type:"summon",hair:"#ffbad4",skin:"#ffe1cd",main:"#e48fb9",dark:"#a04b7e",aura:"#ffbaf1",trim:"#ffecf7",pose:6},
    hero_sion: {type:"darkmage",hair:"#dad4ee",skin:"#e5cee6",main:"#7552b9",dark:"#292344",aura:"#b37aff",trim:"#f0d8ff",pose:0},
    hero_lumi: {type:"druid",hair:"#d2c99b",skin:"#f2deca",main:"#83b577",dark:"#41634b",aura:"#d4ff9a",trim:"#f5e6ad",pose:-2}
  };
  const cache = new Map();
  function path(d,fill,stroke,width,extra){
    return '<path d="'+d+'" fill="'+(fill||"none")+'" stroke="'+(stroke||"none")+'" stroke-width="'+(width||0)+'" stroke-linejoin="round" stroke-linecap="round" '+(extra||"")+'/>';
  }
  function circ(x,y,r,fill,stroke,w,extra){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+(stroke||"none")+'" stroke-width="'+(w||0)+'" '+(extra||"")+'/>';}
  function ellipse(x,y,rx,ry,fill,extra){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+(extra||"")+'/>';}
  function poly(points,fill,stroke,w){return '<polygon points="'+points+'" fill="'+fill+'" stroke="'+(stroke||"none")+'" stroke-width="'+(w||0)+'" stroke-linejoin="round"/>';}
  function sparkle(x,y,r,color){
    return path("M"+x+" "+(y-r)+" Q"+(x+r*.2)+" "+(y-r*.2)+" "+(x+r)+" "+y+" Q"+(x+r*.2)+" "+(y+r*.2)+" "+x+" "+(y+r)+" Q"+(x-r*.2)+" "+(y+r*.2)+" "+(x-r)+" "+y+" Q"+(x-r*.2)+" "+(y-r*.2)+" "+x+" "+(y-r)+"Z",color);
  }
  function wing(side,c,stage) {
    const s=side===0?-1:1;
    const x=255+s*56;
    return '<g transform="translate('+x+',248) scale('+s+',1)">' +
      path("M0 15 Q60 -70 116 -67 Q87 -32 78 -5 Q131 -35 153 -13 Q122 10 100 26 Q140 13 149 42 Q96 66 14 83Z",stage===3?"url(#feather)":"url(#cape)",c.dark,5,'opacity="'+(stage===3?.97:.74)+'"')+
      (stage===3?path("M11 35Q96 -44 130 -47M14 49Q96 1 129 11","none",c.aura,5):"")+
      '</g>';
  }
  function aura(c,stage,type) {
    let out=ellipse(250,285,stage===3?203:stage===2?172:140,stage===3?218:174,"url(#mist)",'opacity="'+(stage===3?.79:.49)+'"');
    if(stage>=2){
      out+='<g filter="url(#soft)">'+circ(250,265,stage===3?175:140,"none",c.aura,stage===3?9:5,'opacity=".43"')+'</g>';
      out+=circ(250,265,stage===3?174:143,"none",c.aura,stage===3?4:2,'stroke-dasharray="'+(stage===3?"36 12 7 15":"30 16")+'" opacity=".81"');
      for(let i=0;i<(stage===3?18:9);i++){const a=i*2.39996,rx=stage===3?190:152;const x=Math.round(250+Math.cos(a)*rx),y=Math.round(264+Math.sin(a)*rx*1.12);out+=sparkle(x,y,stage===3?7:4,i%3===0?c.trim:c.aura);}
    }
    if(stage===3){
      out+=path("M66 343 Q250 439 435 322M84 189Q250 32 421 172","none",c.aura,8,'opacity=".4" filter="url(#soft)"');
      if(["cleric","spirit","summon","druid"].includes(type)) out+=wing(0,c,3)+wing(1,c,3);
      if(["mage","darkmage","swords"].includes(type)) {
        out+=ellipse(250,265,204,60,"none",'stroke="'+c.aura+'" stroke-width="5" transform="rotate(-28 250 265)" opacity=".7"');
      }
      if(["guardian","knight"].includes(type)){
        out+=circ(250,267,199,"none",c.trim,4,'stroke-dasharray="5 19" opacity=".72"');
      }
    }
    return out;
  }
  function costume(c,stage,type){
    const robe=["mage","cleric","spirit","summon","darkmage","druid"].includes(type);
    let out="";
    // Fully visible legs / boots, each independently shaded
    out+=path("M204 367Q220 348 248 367L243 453Q238 480 214 486L188 478L199 427Z","url(#pants)",c.dark,6);
    out+=path("M267 363Q287 350 309 370L324 450Q340 479 312 487L279 482L273 428Z","url(#pants)",c.dark,6);
    out+=path("M186 455Q219 463 246 452L246 482Q213 500 181 481Z","url(#armor)",c.dark,5);
    out+=path("M282 453Q309 463 334 451L346 482Q310 502 277 481Z","url(#armor)",c.dark,5);
    if(stage>=2)out+=path("M208 425L238 429M291 429L322 425","none",c.trim,5);
    // Cape silhouette length actually changes with evolution
    out+=path(stage===1?"M214 232Q139 235 150 354L177 409L203 357L288 356L334 414Q355 333 309 229Z":
      stage===2?"M209 225Q118 213 112 368L150 460L196 390L298 387L350 463Q388 302 305 226Z":
      "M209 221Q103 196 78 387L136 496L194 413L299 415L373 498Q406 299 305 221Z",
      "url(#cape)",c.dark,6);
    if(stage>=2)out+=path("M136 416Q167 434 193 391M310 385Q341 444 359 422","none",c.trim,stage===3?6:3,'opacity=".75"');
    // Torso & waist armor, robe or tunic
    out+=path(robe?"M203 231Q257 214 313 234L330 344Q341 370 368 410Q254 441 135 410Q172 365 179 339Z":
      "M204 230Q252 212 310 234L321 356Q278 389 186 355Z",
      "url(#outfit)",c.dark,7);
    if(robe)out+=path("M252 262L251 414M192 359Q252 379 313 359","none",c.trim,4,'opacity=".7"');
    if(stage>=2){
      out+=path("M207 257Q251 289 304 256L315 275Q258 313 193 275Z","url(#armor)",c.trim,3);
      out+=path("M185 349Q247 374 321 349","none",c.trim,6);
    }
    if(stage===3){
      out+=poly("255,282 268,300 255,319 242,300",c.aura,c.trim,3);
      out+=path("M195 327Q254 351 315 326M218 236L255 264L287 236","none",c.aura,4);
      out+=sparkle(254,298,18,c.trim);
    } else {
      out+=poly("254,277 263,290 254,303 245,290",c.trim,c.dark,2);
    }
    // Shoulder & sleeves
    for(const side of [-1,1]){
      out+='<g transform="translate(255 0) scale('+side+' 1) translate(-255 0)">';
      out+=path("M207 236Q166 235 155 270L184 315L211 285Z","url(#armor)",c.dark,6);
      out+=path("M178 279Q156 309 147 346L164 363Q185 336 199 303Z","url(#outfit)",c.dark,5);
      out+=ellipse(154,360,18,16,c.skin);
      if(stage>=2)out+=path("M167 249L210 238L205 273L178 286Z","url(#armor)",c.trim,3);
      if(stage===3)out+=poly("174,248 188,222 207,238 195,260",c.trim,c.dark,3);
      out+='</g>';
    }
    return out;
  }
  function face(c,stage,type){
    let out="";
    out+=ellipse(255,184,74,75,c.skin,'stroke="'+c.dark+'" stroke-width="5"');
    out+=ellipse(183,188,11,21,c.skin);out+=ellipse(327,188,11,21,c.skin);
    // Hair styles are faction-specific, not recolors of the same cut
    if(["knight","guardian","gunner"].includes(type)){
      out+=path("M181 160Q184 93 248 98Q317 90 332 155L315 162L301 136L281 149L256 129L231 155L205 139Z",c.hair,c.dark,5);
      if(stage>=2)out+=poly("204,111 251,79 298,112 293,132 257,120 210,136","url(#armor)",c.trim,5);
    }else if(["mage","darkmage","swords","assassin"].includes(type)){
      out+=path("M180 178Q162 98 220 93Q296 69 331 142Q356 192 324 263L312 223Q329 173 302 142L275 154L255 126L214 163L190 234Z",c.hair,c.dark,5);
      out+=path("M220 111Q269 73 314 130L292 146L258 124L220 152Z",c.hair,c.dark,4);
      if(stage===3)out+=poly("225,107 254,65 286,110 267,113 250,94 240,116",c.trim,c.dark,3);
    }else{
      out+=path("M171 177Q165 101 231 90Q302 82 332 144L348 217L319 201L311 146Q285 167 267 138Q246 167 225 147Q207 180 176 189Z",c.hair,c.dark,5);
      out+=path("M185 196Q157 270 180 304L201 250L209 173M319 174Q338 248 329 295L300 235","none",c.hair,17);
      if(stage>=2)out+=path("M208 109Q255 73 298 108","none",c.trim,7);
    }
    // Face / expression: stoic and cheerful templates
    const serious=["knight","assassin","gunner","swords","guardian","darkmage"].includes(type);
    out+=ellipse(224,188,12,17,serious?"#293145":"#35304b");
    out+=ellipse(283,188,12,17,serious?"#293145":"#35304b");
    out+=circ(227,182,4,"#ffffff");
    out+=circ(286,182,4,"#ffffff");
    out+=path(serious?"M211 172L238 168M273 168L297 173":"M210 167Q224 160 238 170M269 170Q284 160 297 167","none",c.dark,4);
    out+=path(serious?"M245 220Q254 215 264 220":"M241 216Q254 231 270 216","none","#a75b69",3);
    if(!serious){out+=ellipse(202,210,10,6,"#f6acb1",'opacity=".45"');out+=ellipse(308,210,10,6,"#f6acb1",'opacity=".45"');}
    if(["assassin","darkmage"].includes(type))out+=path("M184 222Q255 242 326 216L315 252Q256 269 196 247Z",c.dark,c.dark,4,'opacity=".83"');
    return out;
  }
  function crown(c,stage,type){
    let out="";
    if(stage===1)return out;
    if(["knight","guardian"].includes(type)){
      out+=path("M207 113L214 83L238 94L254 65L271 94L296 83L303 113Z","url(#armor)",c.dark,5);
    }else if(["mage","darkmage","swords"].includes(type)){
      out+=poly("219,109 234,83 251,103 270,72 290,111",c.trim,c.dark,4);
    }else if(["spirit","druid","archer"].includes(type)){
      out+=path("M194 115Q253 58 319 117","none",c.trim,stage===3?10:6);
      for(let i=0;i<5;i++)out+=ellipse(208+i*24,98-Math.sin(i/4*Math.PI)*17,7,14,c.aura,'transform="rotate('+(-35+i*18)+' '+(208+i*24)+' '+(98-Math.sin(i/4*Math.PI)*17)+')"');
    }else if(["cleric","summon"].includes(type)){
      out+=circ(255,95,stage===3?51:38,"none",c.trim,stage===3?8:4,'opacity=".85"');
      out+=sparkle(255,68,12,c.trim);
    }else{
      out+=poly("211,113 234,93 256,107 280,91 301,115",c.trim,c.dark,4);
    }
    if(stage===3)out+=sparkle(255,54,13,c.aura);
    return out;
  }
  function accessory(c,stage,type){
    let out="";
    if(type==="knight"||type==="guardian"){
      out+=path("M335 278Q405 263 409 309L403 395Q368 425 339 393L328 327Z","url(#armor)",c.dark,9);
      out+=path("M354 320L370 300L392 322L383 379L368 390L347 374Z","none",c.trim,6);
      out+=path("M130 358L129 200","none",c.trim,11);
      out+=poly("119,200 129,123 139,200",c.trim,c.dark,4);
    } else if(type==="archer"){
      out+=path("M108 369Q26 245 116 143Q180 203 108 369Z","none",c.trim,9);
      out+=path("M116 143L108 369M93 272L290 217","none",c.aura,3);
      out+=poly("80,268 98,257 93,275",c.trim);
    } else if(type==="assassin"||type==="swords"){
      for(let side of [-1,1]){
        out+='<g transform="translate(255 0) scale('+side+' 1) translate(-255 0)">';
        out+=path("M143 377L125 209","none",c.trim,11);
        out+=poly("113,221 125,143 138,221","url(#armor)",c.dark,5);
        out+='</g>';
      }
    } else if(type==="mage"||type==="darkmage"||type==="spirit"||type==="druid"||type==="cleric"){
      out+=path("M120 390L138 179","none",c.trim,11);
      out+=circ(139,159,stage===3?31:23,"url(#gem)",c.trim,5);
      if(stage>=2)out+=circ(139,159,45,"none",c.aura,4,'stroke-dasharray="6 9" opacity=".7"');
      if(stage===3)out+=sparkle(137,112,17,c.aura);
    } else if(type==="gunner"){
      // Fantasy-only arcane device, no real-world mechanism.
      out+=ellipse(368,307,44,31,"url(#armor)",'stroke="'+c.trim+'" stroke-width="8"');
      out+=circ(378,307,18,"url(#gem)",c.trim,5);
      out+=path("M330 287L404 273L421 282L416 328L337 334Z","none",c.dark,5);
      if(stage>=2)out+=circ(378,307,37,"none",c.aura,3);
    } else if(type==="summon"){
      out+=path("M96 333Q106 255 179 260L197 334Q140 370 96 333Z","url(#gem)",c.trim,6);
      out+=sparkle(146,292,16,c.trim);
    }
    if(["spirit","druid","summon"].includes(type)&&stage>=2){
      out+=circ(369,154,stage===3?35:26,"url(#gem)",c.trim,3);
      out+=ellipse(352,143,12,17,c.trim,'opacity=".75"');
      out+=ellipse(386,143,12,17,c.trim,'opacity=".75"');
      out+=circ(365,164,3,c.dark);
      if(stage===3){out+=path("M351 184Q370 204 390 186","none",c.trim,4);out+=sparkle(401,117,14,c.aura);}
    }
    return out;
  }
  function draw(id,stage){
    if(!styles[id])return "";
    stage=Math.max(1,Math.min(3,Number(stage)||1));
    const key=id+":"+stage;if(cache.has(key))return cache.get(key);
    const c=styles[id],t=c.type;
    const headRing=stage===3?'<circle cx="255" cy="161" r="104" fill="none" stroke="'+c.aura+'" stroke-width="3" opacity=".27"/>':"";
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560" width="500" height="560" role="img" aria-label="fantasy hero evolution stage '+stage+'">' +
      '<defs>'+
        '<linearGradient id="outfit" x2=".9" y2="1"><stop stop-color="'+c.main+'"/><stop offset=".53" stop-color="'+c.dark+'"/><stop offset="1" stop-color="'+c.main+'"/></linearGradient>'+
        '<linearGradient id="cape" x2="1" y2="1"><stop stop-color="'+c.dark+'"/><stop offset=".68" stop-color="'+c.main+'"/><stop offset="1" stop-color="'+c.dark+'"/></linearGradient>'+
        '<linearGradient id="armor" x2="1" y2=".9"><stop stop-color="#fffdf2"/><stop offset=".37" stop-color="'+c.trim+'"/><stop offset=".65" stop-color="'+c.main+'"/><stop offset="1" stop-color="'+c.dark+'"/></linearGradient>'+
        '<linearGradient id="pants" x2=".9" y2="1"><stop stop-color="'+c.dark+'"/><stop offset=".6" stop-color="'+c.main+'"/><stop offset="1" stop-color="'+c.dark+'"/></linearGradient>'+
        '<radialGradient id="mist"><stop stop-color="'+c.aura+'" stop-opacity=".44"/><stop offset=".7" stop-color="'+c.aura+'" stop-opacity=".13"/><stop offset="1" stop-color="'+c.aura+'" stop-opacity="0"/></radialGradient>'+
        '<radialGradient id="gem"><stop stop-color="#ffffff"/><stop offset=".35" stop-color="'+c.aura+'"/><stop offset="1" stop-color="'+c.main+'"/></radialGradient>'+
        '<linearGradient id="feather" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".5" stop-color="'+c.aura+'"/><stop offset="1" stop-color="'+c.main+'"/></linearGradient>'+
        '<filter id="soft" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="7"/></filter>'+
      '</defs>'+
      '<g>'+aura(c,stage,t)+headRing+'</g>'+
      '<g transform="rotate('+c.pose+' 255 288)">'+
        costume(c,stage,t)+face(c,stage,t)+crown(c,stage,t)+accessory(c,stage,t)+
      '</g>'+
      (stage===3?sparkle(397,89,15,c.trim)+sparkle(75,310,11,c.aura):"")+
      '</svg>';
    cache.set(key,svg);
    return svg;
  }
  window.QuestDayHeroArt = Object.freeze({draw,has(id){return !!styles[id]}});
})();