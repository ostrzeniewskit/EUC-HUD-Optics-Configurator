var canvas=document.getElementById('c3d');
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.sortObjects=true;
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(45,2,0.1,2000);
scene.add(new THREE.AmbientLight(0xffffff,0.5));
var dl=new THREE.DirectionalLight(0xffffff,0.9); dl.position.set(60,110,70); dl.castShadow=true; scene.add(dl);
var dl2=new THREE.DirectionalLight(0xffffff,0.3); dl2.position.set(-50,-20,-70); scene.add(dl2);

function mp(c,o){var m=new THREE.MeshPhongMaterial({color:c});if(o)Object.assign(m,o);return m;}
var MAT={
  shell:   mp(0xCC4A18,{shininess:40,transparent:true,opacity:0.72,depthWrite:false}),
  pcb:     mp(0x1a4420,{shininess:55}),
  chip:    mp(0x111111,{shininess:80}),
  usb:     mp(0x555555,{shininess:80}),
  led:     mp(0x00ff55,{emissive:0x00bb33,emissiveIntensity:1.0}),
  oledBg:  mp(0x050510,{shininess:150}),
  oledPx:  mp(0xffffff,{emissive:0xffffff,emissiveIntensity:1.0,transparent:true,opacity:0.95}),
  oledRow: mp(0xaaccff,{emissive:0x5588ff,emissiveIntensity:0.7,transparent:true,opacity:0.5}),
  prism:   mp(0x99ddff,{shininess:280,transparent:true,opacity:0.35,side:THREE.DoubleSide,depthWrite:false}),
  lens:    mp(0x88ccee,{shininess:260,transparent:true,opacity:0.45,depthWrite:false}),
  lensRim: mp(0x222222,{shininess:70}),
  spl:     mp(0xaaccee,{shininess:260,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false}),
  splEdge: mp(0x88aacc,{shininess:140,transparent:true,opacity:0.5,depthWrite:false}),
  fpc:     mp(0xccaa22,{transparent:true,opacity:0.8}),
};

var groups={};
var root=new THREE.Group(); scene.add(root);
function clearScene(){while(root.children.length)root.remove(root.children[0]);groups={};}
function addM(name,mesh){mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);if(!groups[name])groups[name]=[];groups[name].push(mesh);return mesh;}
function B(n,x,y,z,w,h,d,m){var mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);return addM(n,mesh);}
function Ln(n,pts,col,op){var geo=new THREE.BufferGeometry().setFromPoints(pts.map(function(p){return new THREE.Vector3(p[0],p[1],p[2]);}));return addM(n,new THREE.Line(geo,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op||0.85})));}

var mode='prism'; // 'prism' or 'noprism'
var params={lD:30,lF:12,lH:7,dW:10.5,dH:8.5,dP:40,pcbW:42,dPS:6,prismS:15,splS:30,splT:1.1,sUL:10,sLS:12,sVD:2000};

function setMode(m){
  mode=m;
  document.getElementById('btn-prism').classList.toggle('active', m==='prism');
  document.getElementById('btn-noprism').classList.toggle('active', m==='noprism');
  document.getElementById('row-prismS').classList.toggle('hidden', m==='noprism');
  document.getElementById('rc-prism').style.opacity = m==='prism'?'1':'0.3';
  document.querySelector('h1').textContent = m==='prism'
    ? 'HUD 3D Configurator v4 — 90° prism (flat OLED)'
    : 'HUD 3D Configurator v4 — vertical OLED (no prism)';
  buildScene(params); updateResults(params);
}

// ── PRISM MODE SCENE ──────────────────────────────────────────────────────
function buildScenePrism(p){
  var WW=2.0;
  var lD=p.lD,lF=p.lF,lH=p.lH;
  var dW=p.dW,dH=p.dH;
  var dP=p.dP,pcbW=p.pcbW,dPS=p.dPS;
  var PS=p.prismS;
  var UL=p.sUL,LS=p.sLS;
  var splS=p.splS,splT=p.splT;

  var pcbTopY    = WW + dPS;
  var prismExitX = WW + dP;
  var prismCX    = prismExitX - PS/2;
  var prismCY    = pcbTopY + PS/2;
  var tCY        = prismCY;

  var lensX      = prismExitX + UL + lH/2;
  var splX       = lensX + lH/2 + LS;

  var tIH  = pcbTopY + PS + 3;
  var tOH  = tIH + WW;
  var tIW  = Math.max(pcbW, PS+4, lD+4);
  var tOW  = tIW + WW*2;
  var ZC   = tOW/2;
  var lensEndX = lensX + lH/2 + WW;

  // PCB
  B('pcb', WW+1+dP/2, WW+dPS/2, ZC, dP, dPS, pcbW, MAT.pcb);
  B('pcb', WW+1+dP*0.3, WW+dPS+1, ZC, Math.min(dP*0.28,14), 2, Math.min(pcbW*0.4,12), MAT.chip);
  B('pcb', WW-0.5, WW+dPS+1, ZC, 2.5, 3, 8, MAT.usb);
  B('pcb', WW+dP-3, WW+dPS+1, ZC+Math.min(pcbW,tIW)/2-3, 2, 2, 2, MAT.led);

  // OLED flat on PCB (face up)
  B('oled', prismCX, pcbTopY+0.9, ZC, PS+1, 1.2, PS+1, MAT.oledBg);
  B('oled', prismCX, pcbTopY+1.6, ZC, dW, 0.4, dH, MAT.oledPx);
  for(var ri=0;ri<5;ri++){
    var rz=ZC-dH/2+(ri+0.5)*(dH/5);
    var rowM=new THREE.Mesh(new THREE.BoxGeometry(dW-1,0.3,0.25),MAT.oledRow);
    rowM.position.set(prismCX,pcbTopY+1.9,rz);addM('oled',rowM);
  }

  // 90° prism (triangular)
  var pX0=prismCX-PS/2,pX1=prismCX+PS/2;
  var pY0=pcbTopY+2,pY1=pcbTopY+2+PS;
  var pZ0=ZC-PS/2,pZ1=ZC+PS/2;
  var verts=new Float32Array([
    pX0,pY0,pZ0,pX1,pY0,pZ0,pX1,pY1,pZ0,
    pX0,pY0,pZ1,pX1,pY0,pZ1,pX1,pY1,pZ1,
  ]);
  var idx=[0,1,2,5,4,3,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0];
  var prismGeo=new THREE.BufferGeometry();
  prismGeo.setAttribute('position',new THREE.BufferAttribute(verts,3));
  prismGeo.setIndex(idx);prismGeo.computeVertexNormals();
  addM('prism',new THREE.Mesh(prismGeo,MAT.prism));
  Ln('prism',[[pX0,pY0,pZ0],[pX1,pY0,pZ0],[pX1,pY1,pZ0],[pX0,pY0,pZ0]],0x88ccff,0.85);
  Ln('prism',[[pX0,pY0,pZ1],[pX1,pY0,pZ1],[pX1,pY1,pZ1],[pX0,pY0,pZ1]],0x88ccff,0.85);
  Ln('prism',[[pX0,pY0,pZ0],[pX0,pY0,pZ1]],0x88ccff,0.65);
  Ln('prism',[[pX1,pY0,pZ0],[pX1,pY0,pZ1]],0x88ccff,0.65);
  Ln('prism',[[pX1,pY1,pZ0],[pX1,pY1,pZ1]],0x88ccff,0.65);

  // Lens
  var lMesh=new THREE.Mesh(new THREE.CylinderGeometry(lD/2,lD/2,lH,40),MAT.lens);
  lMesh.rotation.z=Math.PI/2;lMesh.position.set(lensX,tCY,ZC);addM('lens',lMesh);
  var lRim=new THREE.Mesh(new THREE.TorusGeometry(lD/2+0.6,1.1,8,40),MAT.lensRim);
  lRim.rotation.y=Math.PI/2;lRim.position.set(lensX,tCY,ZC);addM('lens',lRim);

  // Beam splitter
  var sM=new THREE.Mesh(new THREE.BoxGeometry(splT,splS,splS),MAT.spl);
  sM.rotation.z=Math.PI/4+Math.PI/2;sM.position.set(splX,tCY,ZC);addM('splitter',sM);
  var sE=new THREE.Mesh(new THREE.BoxGeometry(splT+0.5,splS+0.5,splS+0.5),MAT.splEdge);
  sE.rotation.z=Math.PI/4+Math.PI/2;sE.position.set(splX,tCY,ZC);addM('splitter',sE);

  // Light rays
  Ln('rays',[[prismCX,pcbTopY+2,ZC],[prismCX,tCY,ZC]],0xffee22,0.65);
  Ln('rays',[[prismExitX,tCY,ZC],[lensX,tCY,ZC],[splX,tCY,ZC]],0xffee22,0.9);
  Ln('rays',[[splX,tCY,ZC],[splX,tCY+50,ZC]],0xffee22,0.9);
  Ln('rays',[[splX-50,tCY,ZC],[splX,tCY,ZC]],0x55aaff,0.5);
  Ln('rays',[[splX,tCY,ZC],[splX+50,tCY,ZC]],0x55aaff,0.25);

  camTarget.set((lensEndX+splX)/2,(tOH)/2,ZC);
  camRadius=Math.max(lensEndX+splX,tOH,tOW)*1.5;
}

// ── NO-PRISM MODE SCENE ────────────────────────────────────────────────────
function buildSceneNoPrism(p){
  var WW=2.0;
  var lD=p.lD,lF=p.lF,lH=p.lH;
  var dW=p.dW,dH=p.dH;
  var dP=p.dP,pcbW=p.pcbW,dPS=p.dPS;
  var UL=p.sUL,LS=p.sLS;
  var splS=p.splS,splT=p.splT;

  var pcbTopY   = WW+dPS;
  var oledFaceX = WW+dP;
  var oledH     = dW;
  var tIH       = Math.max(pcbTopY+4, oledH+8, lD+4);
  var tOH       = tIH+WW*2;
  var tCY       = tOH/2;
  var tIW       = Math.max(pcbW,lD+4);
  var tOW       = tIW+WW*2;
  var ZC        = tOW/2;
  var lensX     = oledFaceX+UL+lH/2;
  var splX      = lensX+lH/2+LS;
  var lensEndX  = lensX+lH/2+WW;

  // PCB
  B('pcb', WW+1+dP/2, WW+dPS/2, ZC, dP, dPS, pcbW, MAT.pcb);
  B('pcb', WW+1+dP*0.3, WW+dPS+1, ZC, Math.min(dP*0.28,14), 2, Math.min(pcbW*0.4,12), MAT.chip);
  B('pcb', WW-0.5, WW+dPS+1, ZC, 2.5, 3, 8, MAT.usb);
  B('pcb', WW+dP-3, WW+dPS+1, ZC+Math.min(pcbW,tIW)/2-3, 2, 2, 2, MAT.led);

  // OLED vertical, face toward lens (+X)
  var oledModT=3.5, oledModH=dW+4, oledModD=dH+4;
  B('oled', oledFaceX-oledModT/2, tCY, ZC, oledModT, oledModH, oledModD, MAT.oledBg);
  var oledFaceM=new THREE.Mesh(new THREE.BoxGeometry(0.4,dW,dH),MAT.oledPx);
  oledFaceM.position.set(oledFaceX+0.2,tCY,ZC);addM('oled',oledFaceM);
  for(var ri=0;ri<5;ri++){
    var ry=tCY-dW/2+(ri+0.5)*(dW/5);
    var rowM=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.35,dH-1),MAT.oledRow);
    rowM.position.set(oledFaceX+0.35,ry,ZC);addM('oled',rowM);
  }
  var fpcH=tCY-oledModH/2-(WW+dPS);
  if(fpcH>0.5)B('oled',oledFaceX-oledModT/2,tCY-oledModH/2-fpcH/2,ZC,2,fpcH,5,MAT.fpc);

  // Lens
  var lMesh=new THREE.Mesh(new THREE.CylinderGeometry(lD/2,lD/2,lH,40),MAT.lens);
  lMesh.rotation.z=Math.PI/2;lMesh.position.set(lensX,tCY,ZC);addM('lens',lMesh);
  var lRim=new THREE.Mesh(new THREE.TorusGeometry(lD/2+0.6,1.1,8,40),MAT.lensRim);
  lRim.rotation.y=Math.PI/2;lRim.position.set(lensX,tCY,ZC);addM('lens',lRim);

  // Beam splitter
  var sM=new THREE.Mesh(new THREE.BoxGeometry(splT,splS,splS),MAT.spl);
  sM.rotation.z=Math.PI/4+Math.PI/2;sM.position.set(splX,tCY,ZC);addM('splitter',sM);
  var sE=new THREE.Mesh(new THREE.BoxGeometry(splT+0.5,splS+0.5,splS+0.5),MAT.splEdge);
  sE.rotation.z=Math.PI/4+Math.PI/2;sE.position.set(splX,tCY,ZC);addM('splitter',sE);

  // Light rays
  Ln('rays',[[oledFaceX,tCY,ZC],[lensX-lH/2,tCY,ZC],[splX,tCY,ZC]],0xffee22,0.9);
  Ln('rays',[[splX,tCY,ZC],[splX,tCY+50,ZC]],0xffee22,0.9);
  Ln('rays',[[splX-50,tCY,ZC],[splX,tCY,ZC]],0x55aaff,0.5);
  Ln('rays',[[splX,tCY,ZC],[splX+50,tCY,ZC]],0x55aaff,0.25);

  camTarget.set((lensEndX+splX)/2,tOH/2,ZC);
  camRadius=Math.max(lensEndX+splX,tOH,tOW)*1.5;
}

function buildScene(p){
  clearScene();
  if(mode==='prism') buildScenePrism(p);
  else               buildSceneNoPrism(p);
  updateCamera(); applyVis();
}

function updateResults(p){
  var f=p.lF, vi=p.sVD, dW=p.dW, dH=p.dH, u=p.sUL;
  var PS=p.prismS;

  var uOpt=f*vi/(vi-f);
  var diff=u-uOpt;
  var inv_v=1/f-1/u;
  var imgDist,mag,imgW,imgH,focusLabel,focusClass;
  if(Math.abs(inv_v)<0.0001){
    imgDist=Infinity;mag=Infinity;imgW=Infinity;imgH=Infinity;
    focusLabel='∞ (infinity)';focusClass='good';
  } else if(inv_v<0){
    imgDist=Math.abs(1/inv_v);mag=imgDist/u;imgW=dW*mag;imgH=dH*mag;
    if(imgDist<300)      {focusLabel='very close';focusClass='bad';}
    else if(imgDist<800) {focusLabel='arm length';focusClass='warn';}
    else if(imgDist<3000){focusLabel='relaxed ✓'; focusClass='good';}
    else                 {focusLabel='far/∞ ✓';   focusClass='good';}
  } else {
    imgDist=1/inv_v;mag=imgDist/u;imgW=dW*mag;imgH=dH*mag;
    focusLabel='real img!';focusClass='bad';
  }

  var fovW=2*Math.atan(dW/2/f)*180/Math.PI;
  var fovH=2*Math.atan(dH/2/f)*180/Math.PI;
  var tot=u+p.lH+p.sLS;
  var vign=(dW>p.lD),gapBad=(Math.abs(diff)>3);
  var allGood=!vign&&!gapBad;

  document.getElementById('r-opt').textContent=uOpt.toFixed(1);
  document.getElementById('r-opt').className='rv '+(Math.abs(diff)>3?'warn':(Math.abs(diff)>1?'':'good'));
  var deltaEl=document.getElementById('r-delta');
  deltaEl.textContent=(diff>=0?'+':'')+diff.toFixed(1);
  deltaEl.className='rv '+(Math.abs(diff)>3?'bad':(Math.abs(diff)>1?'warn':'good'));
  var imgdEl=document.getElementById('r-imgd');
  imgdEl.textContent=imgDist===Infinity?'∞':imgDist.toFixed(0);
  imgdEl.className='rv '+(focusClass==='good'?'good':(focusClass==='warn'?'warn':'bad'));
  var magEl=document.getElementById('r-mag');
  magEl.textContent=mag===Infinity?'∞':mag.toFixed(1);
  magEl.className='rv '+(mag<3?'good':(mag<10?'warn':'bad'));
  var imgsEl=document.getElementById('r-imgs');
  imgsEl.textContent=imgW===Infinity?'∞':(imgW.toFixed(0)+'×'+imgH.toFixed(0));
  imgsEl.className='rv';
  document.getElementById('r-fov').textContent=fovW.toFixed(0)+'×'+fovH.toFixed(0);
  document.getElementById('r-ls').textContent=p.sLS.toFixed(1);
  document.getElementById('r-tot').textContent=tot.toFixed(0);
  document.getElementById('r-focus').textContent=focusLabel;
  document.getElementById('r-focus').className='rv '+focusClass;

  if(mode==='prism'){
    document.getElementById('r-prism').textContent=(PS*2).toFixed(0);
    document.getElementById('r-prism').className='rv';
  } else {
    document.getElementById('r-prism').textContent='—';
    document.getElementById('r-prism').className='rv';
  }

  function al(id,show){document.getElementById(id).classList.toggle('show',show);}
  al('al-vign',vign); al('al-gap',gapBad); al('al-good',allGood);
  if(gapBad){
    var dir=diff>0?' (move screen closer to lens)':(diff<0?' (move screen further from lens)':'');
    document.getElementById('al-gap').textContent=
      'Screen→lens is '+u.toFixed(1)+'mm, optimal is '+uOpt.toFixed(1)+'mm (Δ='+diff.toFixed(1)+'mm)'+dir+'.';
  }
}

// Visibility toggles
var tdefs=[
  {k:'oled',    l:'Display'},
  {k:'pcb',     l:'PCB'},
  {k:'prism',   l:'Prism'},
  {k:'lens',    l:'Lens'},
  {k:'splitter',l:'Splitter'},
  {k:'openzone',l:'Open zone'},
  {k:'rays',    l:'Rays'},
];
var vis={};tdefs.forEach(function(d){vis[d.k]=true;});
var tb=document.getElementById('tb');
tdefs.forEach(function(d){
  var b=document.createElement('button');b.className='b on';b.textContent=d.l;
  b.onclick=function(){vis[d.k]=!vis[d.k];b.classList.toggle('on',vis[d.k]);applyVis();};
  tb.appendChild(b);
});
function applyVis(){
  Object.keys(vis).forEach(function(k){
    (groups[k]||[]).forEach(function(m){m.visible=vis[k];});
  });
  var prismBtn=Array.from(document.querySelectorAll('.b')).find(function(b){return b.textContent==='Prism';});
  if(prismBtn) prismBtn.style.opacity=mode==='noprism'?'0.3':'1';
}

var camTarget=new THREE.Vector3(40,20,15);
var camRadius=200,theta=-0.5,phi=0.78,pX=0,pY=0;
function updateCamera(){
  camera.position.set(
    camTarget.x+pX+camRadius*Math.sin(phi)*Math.sin(theta),
    camTarget.y+pY+camRadius*Math.cos(phi),
    camTarget.z+camRadius*Math.sin(phi)*Math.cos(theta));
  camera.lookAt(camTarget.x+pX,camTarget.y+pY,camTarget.z);
}
var drag=false,rgt=false,lx=0,ly=0;
canvas.addEventListener('mousedown',function(e){drag=true;rgt=e.button===2;lx=e.clientX;ly=e.clientY;});
canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
window.addEventListener('mouseup',function(){drag=false;});
window.addEventListener('mousemove',function(e){
  if(!drag)return;
  var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;
  if(rgt){pX-=dx*0.1;pY+=dy*0.1;}
  else{theta-=dx*0.007;phi=Math.max(0.08,Math.min(3.06,phi+dy*0.007));}
  updateCamera();
});
canvas.addEventListener('wheel',function(e){
  camRadius=Math.max(20,Math.min(700,camRadius+e.deltaY*0.25));
  updateCamera();e.preventDefault();
},{passive:false});
var ltd=0;
canvas.addEventListener('touchstart',function(e){
  if(e.touches.length===1){drag=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
  if(e.touches.length===2)ltd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
});
canvas.addEventListener('touchend',function(){drag=false;});
canvas.addEventListener('touchmove',function(e){
  if(e.touches.length===1&&drag){
    var dx=e.touches[0].clientX-lx,dy=e.touches[0].clientY-ly;
    lx=e.touches[0].clientX;ly=e.touches[0].clientY;
    theta-=dx*0.007;phi=Math.max(0.08,Math.min(3.06,phi+dy*0.007));updateCamera();
  }
  if(e.touches.length===2){
    var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    camRadius=Math.max(20,Math.min(700,camRadius-(d-ltd)*0.35));ltd=d;updateCamera();
  }
  e.preventDefault();
},{passive:false});

var sliders=[
  {id:'lD',key:'lD',dec:0},{id:'lF',key:'lF',dec:0},{id:'lH',key:'lH',dec:1},
  {id:'dW',key:'dW',dec:1},{id:'dH',key:'dH',dec:1},
  {id:'dP',key:'dP',dec:0},{id:'pcbW',key:'pcbW',dec:0},{id:'dPS',key:'dPS',dec:1},
  {id:'splS',key:'splS',dec:0},{id:'splT',key:'splT',dec:1},
  {id:'sUL',key:'sUL',dec:1},{id:'sLS',key:'sLS',dec:1},{id:'sVD',key:'sVD',dec:0},
];
sliders.forEach(function(s){
  var el=document.getElementById(s.id),vEl=document.getElementById(s.id+'-v');
  el.addEventListener('input',function(){
    params[s.key]=+el.value;vEl.textContent=(+el.value).toFixed(s.dec);
    buildScene(params);updateResults(params);
  });
});
document.getElementById('prismS').addEventListener('change',function(){
  params.prismS=+this.value;buildScene(params);updateResults(params);
});

function resize(){
  var w=canvas.clientWidth;
  renderer.setSize(w,420,false);
  camera.aspect=w/420;camera.updateProjectionMatrix();
}
resize(); new ResizeObserver(resize).observe(canvas);
function loop(){requestAnimationFrame(loop);renderer.render(scene,camera);}

setMode('prism');
buildScene(params); updateResults(params); loop();
