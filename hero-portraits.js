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
  // 36 separately encoded WebP paintings, not a 3×3 shared sprite.
  // Original characters, unlocks, quests and user data are untouched.
  const paintedRoster = Object.freeze([
    "hero_aren","hero_lyra","hero_kyle","hero_sera","hero_zed",
    "hero_elin","hero_rohan","hero_eve","hero_baruk","hero_nia",
    "hero_sion","hero_lumi"
  ]);
  const PAINTED_ART_VERSION = "20261115-11";
  function paintedPortrait(id,stage){
    if(!paintedRoster.includes(id))return "";
    stage=Math.max(1,Math.min(3,Number(stage)||1));
    const src="./art/painted/individual/"+id+"-stage"+stage+".webp?v="+PAINTED_ART_VERSION;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 450" '+
      'role="img" aria-label="'+id+' 진화 '+stage+'단계 독립 원화" class="qd-painted-stage" '+
      'data-painted-hero="'+id+'" data-painted-stage="'+stage+'" '+
      'style="overflow:hidden" overflow="hidden">'+
      '<image href="'+src+'" x="0" y="0" width="360" height="450" '+
      'preserveAspectRatio="xMidYMid meet"/></svg>';
  }
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

  // 12 distinctive vanguard silhouettes, evolved clothing and class magic.
  function specialtyBack(id,c,st){
    if(st<2)return "";
    let o="",a=c.aura,g=c.trim;
    const loop=(n,fn)=>{for(let i=0;i<n;i++)o+=fn(i)};
    switch(id){
      case "hero_aren": case "hero_baruk":
        o+=circ(255,250,st===3?192:155,"none",g,st===3?8:4,'stroke-dasharray="25 8 4 12" opacity=".75"');
        loop(st===3?15:7,i=>{const v=i*6.28318/(st===3?15:7);return sparkle(Math.round(255+Math.cos(v)*(st===3?193:156)),Math.round(250+Math.sin(v)*(st===3?193:156)),st===3?8:5,g)});
        if(st===3&&id==="hero_aren")o+=wing(0,c,3)+wing(1,c,3);
        break;
      case "hero_lyra": case "hero_sion":
        o+=circ(255,227,st===3?185:148,"none",a,4,'stroke-dasharray="8 15"');
        o+=poly("255,42 423,324 86,324","none",g,st===3?5:3);
        if(st===3)o+=poly("255,53 427,334 80,334","none",a,2)+circ(255,223,138,"none",g,2);
        if(id==="hero_sion")o+=circ(255,134,st===3?108:78,"#211c38",a,st===3?9:5);
        break;
      case "hero_kyle": case "hero_elin": case "hero_lumi":
        loop(st===3?17:9,i=>{const v=i*2.399,x=Math.round(255+Math.cos(v)*174),y=Math.round(264+Math.sin(v)*179);return ellipse(x,y,7+i%4,15+i%7,i%2?g:a,'transform="rotate('+(i*31)+' '+x+' '+y+')" opacity=".67"')});
        if(st===3)o+=path("M80 381Q170 61 415 167M92 404Q270 83 419 293","none",a,5,'opacity=".75"');
        break;
      case "hero_sera":
        o+=circ(255,122,st===3?116:91,"none",g,st===3?10:5,'opacity=".75"');
        if(st===3)o+=wing(0,c,3)+wing(1,c,3);
        break;
      case "hero_zed": case "hero_eve":
        o+=path("M48 389Q221 136 441 268M65 425Q250 175 449 347","none",a,st===3?18:9,'filter="url(#soft)" opacity=".7"');
        if(st===3)o+=path("M52 390Q234 131 447 273","none",g,5);
        break;
      case "hero_rohan":
        o+=path("M90 375Q37 231 148 138Q76 247 194 290M404 377Q473 243 385 142Q436 274 318 295","none",a,st===3?26:14,'filter="url(#soft)" opacity=".6"');
        break;
      case "hero_nia":
        loop(st===3?10:5,i=>{const v=i*2.399,x=255+Math.cos(v)*170,y=247+Math.sin(v)*169;return sparkle(Math.round(x),Math.round(y),st===3?10:6,i%2?g:a)});
        if(st===3)o+=circ(255,245,173,"none",g,4,'stroke-dasharray="7 12"');
        break;
    }
    return o;
  }
  function specialtyFront(id,c,st){
    let o="",g=c.trim,a=c.aura,d=c.dark;
    const advanced=st>=2,final=st===3;
    const stroke=final?8:5;
    switch(id){
      case "hero_aren":
        o+=poly("208,244 172,223 127,258 164,300 209,279","url(#armor)",d,6);
        o+=poly("304,244 339,222 383,260 347,302 304,279","url(#armor)",d,6);
        o+=path("M220 331L250 362L284 332","none",g,advanced?9:4);
        if(final)o+=path("M184 326L146 426M316 326L356 426","none",a,11);
        break;
      case "hero_lyra":
        o+=path(advanced?"M166 128Q204 70 250 48Q315 76 344 128L318 143Q247 111 185 145Z":"M178 131Q211 89 248 79Q298 93 327 131Z","url(#outfit)",g,6);
        o+=ellipse(251,138,advanced?118:94,15,"url(#outfit)",'stroke="'+g+'" stroke-width="5"');
        o+=sparkle(271,111,advanced?20:10,a);
        if(final)o+=path("M183 366Q125 428 91 464M322 362Q377 429 405 457","none",g,7);
        break;
      case "hero_kyle":
        o+=path("M193 164Q166 105 215 94L235 124L204 159Z","url(#outfit)",g,5);
        o+=path("M181 237L147 252L129 310L183 319L212 284Z","url(#armor)",d,5);
        if(final)o+=path("M90 372Q50 243 134 146","none",a,16,'opacity=".82"');
        break;
      case "hero_sera":
        o+=path("M219 278L252 303L284 276L285 327L256 350L223 326Z","url(#armor)",g,5);
        o+=path("M189 355Q169 399 122 445M323 356Q346 401 385 443","none",g,advanced?9:5);
        if(final)o+=circ(255,83,55,"none",a,7);
        break;
      case "hero_zed":
        o+=path("M182 176Q161 98 224 81Q289 69 335 137L306 177L281 130L225 158L192 212Z","url(#cape)",d,7);
        o+=path("M326 279Q393 292 419 333Q371 334 319 305","none",a,advanced?13:6);
        if(final)o+=path("M160 327Q92 381 62 459","none",a,15);
        break;
      case "hero_elin":
        o+=path("M188 118L170 80L219 107M312 118L335 78L289 105","none",g,advanced?12:6);
        o+=path("M212 287Q249 315 297 286","none",a,8);
        if(final)o+=path("M175 349Q118 409 108 449M332 348Q388 403 407 455","none",g,11);
        break;
      case "hero_rohan":
        o+=path("M198 261L160 291L138 422L191 449M311 258L347 292L365 426L312 454","none",g,advanced?8:4);
        o+=ellipse(379,308,advanced?49:30,advanced?43:26,"none",'stroke="'+a+'" stroke-width="6"');
        if(final)o+=path("M422 258Q462 307 419 364","none",a,13);
        break;
      case "hero_eve":
        o+=path("M175 106Q146 178 167 269M319 106Q349 176 334 282","none",c.hair,advanced?26:18);
        o+=path("M216 262L252 303L296 266M218 338L255 366L292 339","none",g,advanced?8:4);
        if(final)o+=path("M165 381L104 470M345 382L408 473","none",a,12);
        break;
      case "hero_baruk":
        o+=poly("191,240 153,218 108,277 163,322 201,285","url(#armor)",g,7);
        o+=poly("315,243 359,217 401,281 346,326 305,283","url(#armor)",g,7);
        if(advanced)o+=path("M209 368L190 423L246 447M298 365L317 426L266 448","none",g,8);
        if(final)o+=sparkle(255,298,29,a);
        break;
      case "hero_nia":
        o+=path("M187 141L164 62L222 108M307 141L345 62L288 107","url(#outfit)",g,5);
        o+=path("M195 342Q119 417 101 443M315 340Q387 416 413 444","none",advanced?a:g,advanced?13:6);
        if(final)o+=circ(372,148,32,"url(#gem)",g,4)+sparkle(395,113,16,a);
        break;
      case "hero_sion":
        o+=path("M197 250Q146 316 120 449L201 421M303 248Q357 319 388 453L302 423","none",g,advanced?10:5);
        if(advanced)for(let i=0;i<4;i++)o+=sparkle(201+i*34,339+i%2*12,10,a);
        if(final)o+=circ(386,157,31,"url(#gem)",g,5);
        break;
      case "hero_lumi":
        o+=path("M192 126L164 65M192 126L209 47M312 127L342 64M312 126L298 45","none",g,advanced?13:8);
        o+=path("M212 294Q255 328 299 295","none",g,9);
        if(final)o+=path("M177 350Q135 419 112 454M320 351Q358 409 385 455","none",a,12);
        break;
    }
    if(advanced){
      // Evolved armor embroidery and a new silhouette emblem.
      o+=path("M200 329Q252 361 306 327","none",g,stroke,'opacity=".7"');
      o+=poly("253,278 270,301 253,326 237,300","url(#gem)",g,4);
    }
    if(final){o+=sparkle(253,299,14,"#ffffff");o+=sparkle(390,104,12,a);}
    return o;
  }


  // Fine engraved highlights make the armor, robes and class crests legible
  // even at the smaller collection-card size.
  function fineIllustrationDetails(id,c,stage){
    const tint=c.trim,energy=c.aura,dark=c.dark;
    let v=path("M209 239Q255 222 296 241","none",tint,2,'opacity=".76"');
    v+=path("M214 253Q236 268 254 275Q277 267 293 250","none",tint,2,'opacity=".64"');
    v+=path("M213 351Q252 369 295 351","none",tint,2,'opacity=".6"');
    v+=path("M198 393L217 411M300 391L319 407","none",tint,2,'opacity=".51"');
    for(let side of [-1,1]){
      v+='<g transform="translate(255 0) scale('+side+' 1) translate(-255 0)">';
      v+=path("M175 254Q184 249 197 249L193 263M160 313L171 331","none",tint,2,'opacity=".84"');
      if(stage>=2)v+=path("M168 274L181 267L189 276","none",energy,2,'opacity=".74"');
      v+='</g>';
    }
    switch(id){
      case "hero_aren":case "hero_baruk":
        v+=path("M242 287L255 297L268 287M244 312L255 320L265 312","none",tint,3);
        break;
      case "hero_lyra":case "hero_sion":
        v+=sparkle(214,288,5,energy)+sparkle(293,307,6,tint);
        break;
      case "hero_kyle":case "hero_lumi":case "hero_elin":
        v+=ellipse(236,322,4,9,energy,'transform="rotate(-35 236 322)"')+ellipse(276,322,4,9,energy,'transform="rotate(35 276 322)"');
        break;
      case "hero_sera":case "hero_nia":
        v+=circ(255,300,8,"none",tint,3)+sparkle(255,287,8,energy);
        break;
      case "hero_zed":case "hero_eve":
        v+=path("M207 310L235 329M275 329L303 310","none",energy,3);
        break;
      case "hero_rohan":
        v+=circ(255,299,10,"none",energy,3)+path("M245 299H265M255 289V309","none",tint,2);
        break;
    }
    if(stage>=2){
      v+=path("M188 350L171 381M320 351L339 382","none",energy,3,'opacity=".7"');
      v+=sparkle(253,287,stage===3?11:6,tint);
    }
    if(stage===3){
      v+=path("M202 236Q256 215 307 235","none",energy,4,'opacity=".82"');
      v+=sparkle(196,256,7,energy)+sparkle(312,260,7,energy);
      v+=path("M218 371Q255 379 294 372","none","#fff8d1",2,'opacity=".78"');
    }
    return v;
  }

  function draw(id,stage){
    if(!styles[id])return "";
    stage=Math.max(1,Math.min(3,Number(stage)||1));
    const key=id+":"+stage;if(cache.has(key))return cache.get(key);
    const painted=paintedPortrait(id,stage);
    if(painted){cache.set(key,painted);return painted;}
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
      '<g>'+aura(c,stage,t)+specialtyBack(id,c,stage)+headRing+'</g>'+
      '<g transform="rotate('+c.pose+' 255 288)">'+
        costume(c,stage,t)+face(c,stage,t)+crown(c,stage,t)+accessory(c,stage,t)+specialtyFront(id,c,stage)+fineIllustrationDetails(id,c,stage)+
      '</g>'+
      (stage===3?sparkle(397,89,15,c.trim)+sparkle(75,310,11,c.aura):"")+
      '</svg>';
    // Avoid gradient collisions when 24 character cards coexist on one page.
    const prefix=id+"-s"+stage+"-";
    const scoped=svg.replace(/\bid="([^"]+)"/g,(_,v)=>'id="'+prefix+v+'"')
      .replace(/url\(#([\w-]+)\)/g,(_,v)=>'url(#'+prefix+v+')');
    cache.set(key,scoped);
    return scoped;
  }
  window.QuestDayHeroArt = Object.freeze({draw,has(id){return !!styles[id]}});
})();