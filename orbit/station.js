// Shared 3D scene for the website and the video. Cartoon (toon) look with outlines.
import * as THREE from './lib/three.module.js';

export const CABINS = 24;
// ring k: 8 rings per layer, stacked up/down; outer layers are bigger and hold more cabins
export function ringLayout(capacity){ const RY=[0,-2.4,2.4,-4.8,4.8,-7.2,7.2,-9.6]; const out=[]; let total=0, k=0;
  while(total<capacity && k<64){ const layer=Math.floor(k/8); const r=7.2+layer*4; const n=Math.round(CABINS*r/7.2/2)*2; out.push({r,y:RY[k%8],n}); total+=n; k++; }
  return out; }

function hash(str){ let h=2166136261; for(const c of String(str).toLowerCase()) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
export function cabinFor(handle){ const h=hash(handle.replace(/^@/,'')); return { pod: h%CABINS, number: 100 + (h % 9900) }; }
export const SUITS=['#ffffff','#ff8a3d','#5fe0d0','#ff6fd8','#ffd166','#6fb6ff','#8ef08a','#b39cff'];
export const VISORS=['#1b2350','#d4a017','#2bd3c4','#ff4d6d'];
let FLAG_COLORS=[['#ffffff','#d7141a','#11457e'],['#b22234','#ffffff','#3c3b6e'],['#ffd166','#ffd166','#ffd166'],['#ff6fd8','#ffffff','#5fe0d0']];
export function setFlagColors(list){ if(list) FLAG_COLORS=list; }
export function defaultLook(handle){ const h=hash(handle||'x'); return { suit: SUITS[h%SUITS.length], visor: VISORS[(h>>>3)%VISORS.length], flag: (h>>>6)%4 }; }

function gradientMap(){ const d=new Uint8Array([70,150,255]); const t=new THREE.DataTexture(d,3,1,THREE.RedFormat); t.needsUpdate=true; t.minFilter=t.magFilter=THREE.NearestFilter; return t; }
const GM = gradientMap();
const INK = new THREE.Color('#0b0a1f');
const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
export function toon(color, extra={}){ return new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(color), gradientMap: GM }, extra)); }
// mesh + outline shell
export function M(geo, color, o=0.06, extra){ const g=new THREE.Group(); const m=new THREE.Mesh(geo, toon(color, extra)); g.add(m);
  if(o>0){ const s=new THREE.Mesh(geo, outlineMat); s.scale.setScalar(1+o); g.add(s); } g.userData.mesh=m; return g; }
function glow(color, size){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,color); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })); sp.scale.setScalar(size); return sp; }

function panelTexture(){ const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d');
  x.fillStyle='#2d4aa8'; x.fillRect(0,0,256,128); x.strokeStyle='#5f7fe0'; x.lineWidth=4;
  for(let i=1;i<8;i++){ x.beginPath(); x.moveTo(i*32,0); x.lineTo(i*32,128); x.stroke(); } x.beginPath(); x.moveTo(0,64); x.lineTo(256,64); x.stroke();
  x.strokeStyle='#0b0a1f'; x.lineWidth=10; x.strokeRect(0,0,256,128); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }

// glossy material for helmet glass
function glass(color){ return new THREE.MeshPhongMaterial({ color: new THREE.Color(color), specular: new THREE.Color('#ffffff'), shininess: 60 }); }
function limb(r, len, color, o=0.05){ const g=M(new THREE.CapsuleGeometry(r,len,4,12), color, o); g.position.y=-(len/2+r*0.6); return g; }
export function makeAstronaut(look){ look=look||{suit:'#ffffff',visor:'#1b2350'};
  const suit=look.suit, trim='#c9cfe3', dark='#4a5168', glove='#eef1f8';
  const g=new THREE.Group();
  // torso
  const torso=M(new THREE.CapsuleGeometry(0.34,0.44,6,16), suit); torso.scale.set(1.08,1,0.86); g.add(torso);
  const belt=M(new THREE.TorusGeometry(0.335,0.055,8,24), dark, 0.06); belt.rotation.x=Math.PI/2; belt.position.y=-0.3; belt.scale.set(1.08,0.86,1); g.add(belt);
  const chest=M(new THREE.BoxGeometry(0.4,0.24,0.09), '#e8ecf4', 0.08); chest.position.set(0,0.13,0.3); g.add(chest);
  [['#ff5d5d',-0.11],['#5fe08a',0],['#6fb6ff',0.11]].forEach(([c,x])=>{ const l=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6), new THREE.MeshBasicMaterial({color:c})); l.position.set(x,0.16,0.35); g.add(l); });
  const sw=M(new THREE.BoxGeometry(0.22,0.04,0.02), dark, 0); sw.position.set(0,0.07,0.35); g.add(sw);
  // backpack with tanks
  const pack=M(new THREE.BoxGeometry(0.58,0.7,0.26), '#d5dae6'); pack.position.set(0,0.06,-0.38); g.add(pack);
  for(const x of [-0.16,0.16]){ const tk=M(new THREE.CylinderGeometry(0.085,0.085,0.6,12), trim, 0.08); tk.position.set(x,0.06,-0.55); g.add(tk); }
  // collar + helmet
  const collar=M(new THREE.TorusGeometry(0.23,0.07,10,24), trim, 0.06); collar.rotation.x=Math.PI/2; collar.position.y=0.5; g.add(collar);
  const head=new THREE.Group(); head.position.y=0.86; g.add(head);
  const shell=M(new THREE.SphereGeometry(0.42,28,20), '#f4f6fb'); head.add(shell);
  const vg=new THREE.SphereGeometry(0.4,28,18,-Math.PI*0.5,Math.PI,Math.PI*0.24,Math.PI*0.48);
  const visor=new THREE.Mesh(vg, glass(look.visor)); visor.position.set(0,0.0,0.05); head.add(visor);
  const vo=new THREE.Mesh(vg, outlineMat); vo.scale.setScalar(1.04); visor.add(vo);
  const hl=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.025,6,16,Math.PI*0.45), new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.85}));
  hl.position.set(-0.04,0.08,0.43); hl.rotation.z=Math.PI*0.55; head.add(hl);
    const lamp=M(new THREE.CylinderGeometry(0.06,0.06,0.08,12), trim, 0.08); lamp.rotation.x=Math.PI/2; lamp.position.set(0.28,0.24,0.24); head.add(lamp);
  // arms: shoulder -> elbow -> glove
  function arm(side){ const sh=new THREE.Group(); sh.position.set(side*0.42,0.28,0); g.add(sh);
    const pad=M(new THREE.SphereGeometry(0.15,14,10), suit); sh.add(pad);
    const up=limb(0.12,0.24,suit); sh.add(up);
    const el=new THREE.Group(); el.position.y=-0.42; sh.add(el);
    const fo=limb(0.11,0.22,suit); el.add(fo);
    const cuff=M(new THREE.CylinderGeometry(0.12,0.12,0.06,12), dark, 0.06); cuff.position.y=-0.38; el.add(cuff);
    const gl=M(new THREE.SphereGeometry(0.12,12,10), glove); gl.position.y=-0.48; gl.scale.set(1,1.1,0.85); el.add(gl);
    sh.rotation.z=side*0.42; el.rotation.z=side*0.35; el.rotation.x=-0.35; return {sh,el}; }
  function leg(side){ const hp=new THREE.Group(); hp.position.set(side*0.17,-0.44,0); g.add(hp);
    const th=limb(0.14,0.26,suit); hp.add(th);
    const kn=new THREE.Group(); kn.position.y=-0.44; hp.add(kn);
    const kp=M(new THREE.SphereGeometry(0.1,10,8), trim, 0.06); kp.position.set(0,0.02,0.1); kn.add(kp);
    const sh=limb(0.13,0.24,suit); kn.add(sh);
    const boot=M(new THREE.BoxGeometry(0.24,0.17,0.34), dark); boot.position.set(0,-0.46,0.05); kn.add(boot);
    hp.rotation.z=side*0.08; hp.rotation.x=side>0?-0.25:0.15; kn.rotation.x=side>0?0.45:0.3; return {hp,kn}; }
  const aL=arm(-1), aR=arm(1), lL=leg(-1), lR=leg(1);
  g.userData={ armR:aR.sh, armL:aL.sh, elR:aR.el, elL:aL.el, legL:lL, legR:lR, head };
  // relaxed zero-g idle; wave=true raises right hand
  g.userData.animate=function(t,wave){ const s=Math.sin;
    aL.sh.rotation.z=-0.42-s(t*1.1)*0.12; aL.el.rotation.x=-0.35-s(t*1.3+1)*0.15;
    if(wave){ aR.sh.rotation.z=2.5+s(t*2)*0.08; aR.el.rotation.z=0.5+s(t*6)*0.45; aR.el.rotation.x=0; }
    else { aR.sh.rotation.z=0.42+s(t*1.2+2)*0.12; aR.el.rotation.z=0.35; aR.el.rotation.x=-0.35-s(t*1.4)*0.15; }
    lL.hp.rotation.x=0.15+s(t*0.9)*0.12; lR.hp.rotation.x=-0.25+s(t*0.9+1.5)*0.12; lL.kn.rotation.x=0.3+s(t*1.1)*0.1; lR.kn.rotation.x=0.45+s(t*1.1+2)*0.1;
    head.rotation.z=s(t*0.7)*0.08; head.rotation.y=s(t*0.5)*0.15; };
  g.userData.animate(0,false);
  return g; }

export function makeRocket(accent){ const g=new THREE.Group();
  const body=M(new THREE.CylinderGeometry(0.75,0.85,3.2,24), '#eef1f8'); g.add(body);
  const nose=M(new THREE.ConeGeometry(0.75,1.6,24), accent); nose.position.y=2.4; g.add(nose);
  const win=M(new THREE.CircleGeometry(0.38,24), '#6fb6ff', 0.0, {side:THREE.DoubleSide}); win.position.set(0,0.6,0.84); g.add(win);
  const ring=M(new THREE.TorusGeometry(0.4,0.08,8,24), '#c9cfe3'); ring.position.set(0,0.6,0.83); g.add(ring);
  for(let i=0;i<3;i++){ const fin=M(new THREE.BoxGeometry(0.12,1.2,0.9), accent); const a=i*Math.PI*2/3; fin.position.set(Math.sin(a)*0.85,-1.3,Math.cos(a)*0.85); fin.rotation.y=a; g.add(fin); }
  const flame=new THREE.Group(); const f1=new THREE.Mesh(new THREE.ConeGeometry(0.6,2.2,16), new THREE.MeshBasicMaterial({color:'#ff8a3d'})); f1.rotation.x=Math.PI; f1.position.y=-2.7; flame.add(f1);
  const f2=new THREE.Mesh(new THREE.ConeGeometry(0.35,1.4,16), new THREE.MeshBasicMaterial({color:'#ffd166'})); f2.rotation.x=Math.PI; f2.position.y=-2.4; flame.add(f2);
  const gl=glow('rgba(255,170,80,0.9)',4); gl.position.y=-2.8; flame.add(gl); g.add(flame); g.userData.flame=flame;
  return g; }

export function buildStation(cfg){
  const accent=cfg.accent||'#ff6fd8', accent2=cfg.accent2||'#5fe0d0';
  const scene=new THREE.Scene(); scene.background=new THREE.Color(cfg.sky||'#070a24');
  scene.add(new THREE.HemisphereLight('#bcd2ff','#2a1c4a',1.4));
  const sun=new THREE.DirectionalLight('#ffffff',2.4); sun.position.set(8,12,10); scene.add(sun);
  // stars
  const sg=new THREE.BufferGeometry(); const N=1800, pos=new Float32Array(N*3);
  let s=7; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  for(let i=0;i<N;i++){ const th=r()*Math.PI*2, ph=Math.acos(2*r()-1), R=180+r()*60; pos[i*3]=R*Math.sin(ph)*Math.cos(th); pos[i*3+1]=R*Math.cos(ph); pos[i*3+2]=R*Math.sin(ph)*Math.sin(th); }
  sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:'#dfe6ff',size:1.1,sizeAttenuation:true})); scene.add(stars);
  // earth
  const earth=new THREE.Group(); earth.position.set(0,-62,-10); scene.add(earth);
  const ocean=M(new THREE.SphereGeometry(48,48,32),'#2350c4',0.012); earth.add(ocean);
  let rs=11; const rr=()=>{ rs=(rs*16807)%2147483647; return rs/2147483647; };
  for(let i=0;i<26;i++){ const th=rr()*Math.PI*2, ph=rr()*Math.PI; const land=M(new THREE.SphereGeometry(6+rr()*9,16,12),'#3fae7a',0.03);
    land.position.setFromSphericalCoords(44.5,ph,th); land.scale.set(1,0.25,1); land.lookAt(0,0,0); land.rotateX(Math.PI/2); earth.add(land); }
  for(let i=0;i<18;i++){ const th=rr()*Math.PI*2, ph=rr()*Math.PI; const cl=new THREE.Mesh(new THREE.SphereGeometry(4+rr()*5,12,10), toon('#ffffff',{transparent:true,opacity:0.85}));
    cl.position.setFromSphericalCoords(49.2,ph,th); cl.scale.set(1.6,0.3,1); cl.lookAt(0,0,0); cl.rotateX(Math.PI/2); earth.add(cl); }
  const atm=new THREE.Mesh(new THREE.SphereGeometry(51,48,32), new THREE.MeshBasicMaterial({color:accent2,transparent:true,opacity:0.13,side:THREE.BackSide})); earth.add(atm);
  // station
  const st=new THREE.Group(); scene.add(st);
  const hub=M(new THREE.CylinderGeometry(1.8,1.8,4.4,32),'#eef1f8'); st.add(hub);
  const band=M(new THREE.CylinderGeometry(1.86,1.86,0.9,32),'#c9cfe3'); st.add(band);
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; const w=M(new THREE.CircleGeometry(0.28,16),'#ffd166',0.0,{side:THREE.DoubleSide, emissive:new THREE.Color('#ffb84d'), emissiveIntensity:0.6});
    w.position.set(Math.sin(a)*1.88,1.2,Math.cos(a)*1.88); w.lookAt(Math.sin(a)*4,1.2,Math.cos(a)*4); st.add(w); }
  const cap=M(new THREE.SphereGeometry(1.8,32,16,0,Math.PI*2,0,Math.PI/2),'#eef1f8'); cap.position.y=2.2; st.add(cap);
  const port=M(new THREE.CylinderGeometry(0.75,0.75,0.9,24),'#c9cfe3'); port.position.y=4.3; st.add(port);
  const portR=M(new THREE.TorusGeometry(0.8,0.16,10,24),accent); portR.position.y=4.75; portR.rotation.x=Math.PI/2; st.add(portR);
  const bottom=M(new THREE.SphereGeometry(1.8,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2),'#eef1f8'); bottom.position.y=-2.2; st.add(bottom);
  // label
  const lc=document.createElement('canvas'); lc.width=512; lc.height=128; const lx=lc.getContext('2d'); lx.fillStyle='#c9cfe3'; lx.fillRect(0,0,512,128);
  lx.font='900 84px "Inter Display", Inter, sans-serif'; lx.fillStyle='#0b0a1f'; lx.textAlign='center'; lx.textBaseline='middle'; lx.fillText(cfg.hubLabel||'ORBIT-1',256,68);
  const lt=new THREE.CanvasTexture(lc); lt.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.CylinderGeometry(1.87,1.87,0.88,32,1,true,-0.7,1.4), new THREE.MeshBasicMaterial({map:lt})); st.add(label);
  // rings with cabins: the station grows ring by ring
  const capacity=Math.max(CABINS, cfg.capacity||CABINS);
  const layout=ringLayout(capacity);
  const pods=[], rings=[]; const EMPTY=new THREE.Color('#4a5175');
  // cabins are drawn with instancing (3 draw calls per ring), so thousands of cabins stay smooth on phones
  const shellGeo=new THREE.CapsuleGeometry(0.55,0.55,3,10).rotateZ(Math.PI/2);
  const winGeo=new THREE.CircleGeometry(0.22,10).translate(0,0,0.6);
  const shellMat=toon('#ffffff'); const winMat=new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide});
  const dummy=new THREE.Object3D(); const inst=[];
  let minY=0,maxY=0;
  layout.forEach((L,li)=>{ const ringR=L.r, y=L.y; minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    const ring=new THREE.Group(); ring.position.y=y; st.add(ring); rings.push(ring);
    ring.add(M(new THREE.TorusGeometry(ringR,0.32,8,Math.max(72,L.n*2)),'#c9cfe3',0.08).rotateX(Math.PI/2));
    const hubR=y===0&&ringR<8?1.8:1.2;
    for(let i=0;i<4;i++){ const a=i*Math.PI/2+(li%2)*Math.PI/4; const len=ringR-hubR; const sp=M(new THREE.CylinderGeometry(0.18,0.18,len,10),'#c9cfe3',0.1); sp.rotation.z=Math.PI/2; sp.rotation.y=a; sp.position.set(Math.cos(a)*(ringR+hubR)/2,0,-Math.sin(a)*(ringR+hubR)/2); ring.add(sp); }
    const sh=new THREE.InstancedMesh(shellGeo,shellMat,L.n), ol=new THREE.InstancedMesh(shellGeo,outlineMat,L.n), wn=new THREE.InstancedMesh(winGeo,winMat,L.n);
    for(let i=0;i<L.n;i++){ const a=i/L.n*Math.PI*2; const k=pods.length;
      dummy.position.set(Math.cos(a)*ringR,0,-Math.sin(a)*ringR); dummy.rotation.set(0,a+Math.PI/2,0); dummy.scale.setScalar(1); dummy.updateMatrix();
      sh.setMatrixAt(i,dummy.matrix); wn.setMatrixAt(i,dummy.matrix); dummy.scale.setScalar(1.06); dummy.updateMatrix(); ol.setMatrixAt(i,dummy.matrix);
      const anchor=new THREE.Object3D(); anchor.position.set(Math.cos(a)*ringR,0,-Math.sin(a)*ringR); ring.add(anchor);
      anchor.userData={col:new THREE.Color(k%3===0?accent:(k%3===1?'#eef1f8':accent2)), ring:li, i}; pods.push(anchor); }
    ring.add(sh); ring.add(ol); ring.add(wn); inst.push({sh,wn}); });
  const selGlow=glow('rgba(255,209,102,0.95)',3.2); selGlow.visible=false;
  function setSelected(i){ if(i<0||!pods[i]){ selGlow.visible=false; if(selGlow.parent) selGlow.parent.remove(selGlow); return; } pods[i].add(selGlow); selGlow.visible=true; }
  if(maxY-minY>0){ const spine=M(new THREE.CylinderGeometry(1.2,1.2,maxY-minY+2,24),'#dfe3f0'); spine.position.y=(maxY+minY)/2; st.add(spine); }
  const topY=Math.max(4.3, maxY+1.6); port.position.y=topY; portR.position.y=topY+0.45; const dockY=topY+0.5;
  const WIN_ON=new THREE.Color('#ffd166'), WIN_OFF=new THREE.Color('#2a2f4a');
  function setOccupied(n){ pods.forEach((p,i)=>{ const on=typeof n==='function'?n(i):i<n; const I=inst[p.userData.ring];
      I.sh.setColorAt(p.userData.i,on?p.userData.col:EMPTY); I.wn.setColorAt(p.userData.i,on?WIN_ON:WIN_OFF); });
    inst.forEach(I=>{ I.sh.instanceColor.needsUpdate=true; I.wn.instanceColor.needsUpdate=true; }); }
  setOccupied(cfg.occupied==null?capacity:cfg.occupied);
  // solar wings
  const tex=panelTexture();
  for(const side of [-1,1]){ const arm=M(new THREE.CylinderGeometry(0.14,0.14,3.2,8),'#c9cfe3',0.1); arm.rotation.z=Math.PI/2; arm.position.set(side*3.4,1.6,0); st.add(arm);
    for(let k=0;k<2;k++){ const p=new THREE.Mesh(new THREE.BoxGeometry(3.8,0.08,1.9), [toon('#c9cfe3'),toon('#c9cfe3'),new THREE.MeshToonMaterial({map:tex,gradientMap:GM}),new THREE.MeshToonMaterial({map:tex,gradientMap:GM}),toon('#c9cfe3'),toon('#c9cfe3')]);
      const o=new THREE.Mesh(new THREE.BoxGeometry(3.8,0.08,1.9),outlineMat); o.scale.set(1.02,1.6,1.04); const g=new THREE.Group(); g.add(p); g.add(o);
      g.position.set(side*(6.9+k*0.0),1.6,k===0?1.05:-1.05); g.rotation.z=0.0; st.add(g); } }
  // antenna + blink lights
  const ant=M(new THREE.CylinderGeometry(0.06,0.06,1.6,6),'#c9cfe3',0.15); ant.position.set(1.1,3.6,0.6); ant.rotation.z=-0.4; st.add(ant);
  const blinkA=glow('rgba(255,111,216,1)',1.4); blinkA.position.set(1.45,4.35,0.6); st.add(blinkA);
  const blinkB=glow('rgba(95,224,208,1)',1.2); blinkB.position.set(-1.9,0,0); st.add(blinkB);
  st.rotation.x=0.18;
  // rocket + astronauts
  const rocket=makeRocket(accent); rocket.visible=false; scene.add(rocket);
  const crew=[]; for(let i=0;i<12;i++){ const a=makeAstronaut({suit:SUITS[i%SUITS.length],visor:VISORS[i%VISORS.length],flag:i%4}); a.visible=false; a.scale.setScalar(0.42); scene.add(a); crew.push(a); }
  const camera=new THREE.PerspectiveCamera(42,9/16,0.1,600);
  function update(t){ earth.rotation.y=t*0.01; stars.rotation.y=t*0.002; rings.forEach((r,i)=>r.rotation.y=t*0.05*(i%2?-1:1));
    blinkA.material.opacity=((t*1.4)%1)<0.5?1:0.15; blinkB.material.opacity=((t*1.4+0.5)%1)<0.5?1:0.15;
    st.position.y=Math.sin(t*0.7)*0.15; }
  function podWorld(i){ const v=new THREE.Vector3(); pods[i].getWorldPosition(v); return v; }
  function dockWorld(){ const v=new THREE.Vector3(0,dockY,0); return st.localToWorld(v); }
  const size=Math.max(...layout.map(L=>L.r))+Math.max(Math.abs(minY),maxY);
  return { THREE, scene, camera, update, pods, podWorld, dockWorld, rocket, crew, station:st, earth, setOccupied, setSelected, selGlow, size, capacity:pods.length };
}

function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
function wallTexture(){ return canvasTex(1024,512,(x,w,h)=>{
  x.fillStyle='#e4e8f0'; x.fillRect(0,0,w,h);
  const cols=8, rows=3, pw=w/cols, ph=h/rows;
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){ const px=i*pw, py=j*ph;
    x.fillStyle=(i+j)%3===0?'#d9dee8':((i*7+j)%5===0?'#eef1f6':'#e2e6ee'); x.fillRect(px+6,py+6,pw-12,ph-12);
    x.strokeStyle='#b9c0ce'; x.lineWidth=4; x.strokeRect(px+6,py+6,pw-12,ph-12);
    x.fillStyle='#a9b1c1'; for(const [bx,by] of [[14,14],[pw-14,14],[14,ph-14],[pw-14,ph-14]]){ x.beginPath(); x.arc(px+bx,py+by,4,0,7); x.fill(); }
    if((i*3+j)%4===1){ x.fillStyle=['#ffd166','#6fb6ff','#ff8a8a','#8ee0a8'][(i+j)%4]; x.fillRect(px+20,py+ph-46,pw*0.35,16); }
    if((i+j*2)%5===2){ x.strokeStyle='#9aa3b5'; x.lineWidth=3; x.beginPath(); x.arc(px+pw/2,py+ph/2,22,0,7); x.stroke(); x.fillStyle='#c4cad6'; x.beginPath(); x.arc(px+pw/2,py+ph/2,10,0,7); x.fill(); }
  }
  x.strokeStyle='#7d8597'; x.lineWidth=6; for(let k=0;k<3;k++){ x.beginPath(); x.moveTo(0,ph*0.5+k*14); x.bezierCurveTo(w*0.3,ph*0.5+40+k*14,w*0.6,ph*0.5-30+k*14,w,ph*0.5+k*14); x.stroke(); }
}); }
function screenTexture(accent){ return canvasTex(512,320,(x,w,h)=>{
  x.fillStyle='#0d1530'; x.fillRect(0,0,w,h); x.strokeStyle=accent; x.lineWidth=3;
  x.beginPath(); for(let i=0;i<=40;i++){ const px=20+i*(w-40)/40, py=h*0.55+Math.sin(i*0.6)*30+Math.sin(i*1.7)*12; i?x.lineTo(px,py):x.moveTo(px,py); } x.stroke();
  x.fillStyle='#5fe0d0'; for(let i=0;i<6;i++) x.fillRect(24+i*30,h-60+(i%3)*-14,18,40-(i%3)*-14);
  x.fillStyle='#ffffff'; x.globalAlpha=0.8; x.fillRect(24,24,160,10); x.fillRect(24,44,110,10); x.globalAlpha=1;
  x.strokeStyle='#ffd166'; x.lineWidth=4; x.beginPath(); x.arc(w-80,80,44,-Math.PI/2,Math.PI*0.9); x.stroke();
}); }
function photoTexture(seed){ return canvasTex(160,200,(x,w,h)=>{
  x.fillStyle='#ffffff'; x.fillRect(0,0,w,h); const cs=[['#6fb6ff','#3fae7a'],['#ff8a3d','#ffd166'],['#b39cff','#ff6fd8']][seed%3];
  const g=x.createLinearGradient(0,0,0,150); g.addColorStop(0,cs[0]); g.addColorStop(1,cs[1]); x.fillStyle=g; x.fillRect(12,12,w-24,150);
  x.fillStyle='rgba(255,255,255,0.8)'; x.beginPath(); x.arc(w*0.65,60,18,0,7); x.fill();
  x.fillStyle='rgba(0,0,0,0.25)'; x.beginPath(); x.moveTo(12,162); x.lineTo(60,100); x.lineTo(100,140); x.lineTo(130,110); x.lineTo(w-12,162); x.fill();
}); }
export function buildCabin(look, accent){
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#05071a');
  scene.add(new THREE.HemisphereLight('#eef2ff','#4a4060',1.25));
  const win=new THREE.DirectionalLight('#cfe0ff',2.2); win.position.set(0.5,1.5,-6); scene.add(win);
  const key=new THREE.DirectionalLight('#fff3e0',1.4); key.position.set(-3,3,6); scene.add(key);
  const room=new THREE.Group(); scene.add(room);
  const R=3, L=10;
  // module walls (cylinder along z)
  const wt=wallTexture(); wt.wrapS=wt.wrapT=THREE.RepeatWrapping; wt.repeat.set(2,2);
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(R,R,L,48,1,true), new THREE.MeshToonMaterial({map:wt,gradientMap:GM,side:THREE.BackSide}));
  wall.rotation.x=Math.PI/2; wall.position.z=0; room.add(wall);
  // ribs
  for(const z of [-3.2,-0.8,1.6,4]){ const rib=M(new THREE.TorusGeometry(R-0.05,0.09,8,48),'#c4cad6',0.06); rib.position.z=z; room.add(rib); }
  // end wall with round window
  const end=M(new THREE.RingGeometry(2.05,R,48),'#d9dee8',0,{side:THREE.DoubleSide}); end.position.z=-L/2+0.4; room.add(end);
  const frame=M(new THREE.TorusGeometry(2.1,0.18,12,48),'#9aa3b5',0.06); frame.position.z=-L/2+0.45; room.add(frame);
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; const b=M(new THREE.SphereGeometry(0.05,6,4),'#7d8597',0); b.position.set(Math.cos(a)*2.1,Math.sin(a)*2.1,-L/2+0.62); room.add(b); }
  const glassM=new THREE.Mesh(new THREE.CircleGeometry(2.06,48), new THREE.MeshBasicMaterial({color:'#9fd0ff',transparent:true,opacity:0.08})); glassM.position.z=-L/2+0.42; room.add(glassM);
  // outside: stars + earth
  const sg=new THREE.BufferGeometry(); const N=400, pos=new Float32Array(N*3); let s=3; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  for(let i=0;i<N;i++){ pos[i*3]=(r()-0.5)*30; pos[i*3+1]=(r()-0.5)*30; pos[i*3+2]=-20-r()*5; }
  sg.setAttribute('position',new THREE.BufferAttribute(pos,3)); scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:'#ffffff',size:0.08})));
  const earth=new THREE.Group(); earth.position.set(1.5,-8.2,-19); scene.add(earth);
  earth.add(M(new THREE.SphereGeometry(7,40,30),'#2a63d4',0));
  let rs=5; const rr=()=>{ rs=(rs*16807)%2147483647; return rs/2147483647; };
  for(let i=0;i<26;i++){ const land=M(new THREE.SphereGeometry(0.7+rr()*1.1,12,10),'#43b37c',0); land.position.setFromSphericalCoords(6.93,rr()*Math.PI*0.6,rr()*Math.PI*2); land.scale.set(1,0.1,1); land.lookAt(0,0,0); earth.add(land); }
  for(let i=0;i<14;i++){ const cl=new THREE.Mesh(new THREE.SphereGeometry(0.8+rr(),10,8), toon('#ffffff',{transparent:true,opacity:0.85})); cl.position.setFromSphericalCoords(7.15,rr()*Math.PI*0.6,rr()*Math.PI*2); cl.scale.set(1.8,0.3,1); cl.lookAt(0,0,0); earth.add(cl); }
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(7.5,40,30), new THREE.MeshBasicMaterial({color:'#7fc4ff',transparent:true,opacity:0.18,side:THREE.BackSide})));
  // ceiling light strips
  for(const a of [Math.PI*0.62, Math.PI*0.38]){ const st=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.06,6), new THREE.MeshBasicMaterial({color:'#fff6dc'})); st.position.set(Math.cos(a)*(R-0.06),Math.sin(a)*(R-0.06),0); st.rotation.z=a+Math.PI/2; room.add(st); }
  // handrails
  for(const a of [Math.PI*0.15, Math.PI*0.85, Math.PI*1.2, Math.PI*1.8]){ const hr=M(new THREE.CylinderGeometry(0.05,0.05,4.2,8),'#ffd166',0.15); hr.rotation.x=Math.PI/2; hr.position.set(Math.cos(a)*(R-0.25),Math.sin(a)*(R-0.25),-0.4); room.add(hr);
    for(const z of [-2.3,1.5]){ const ft=M(new THREE.CylinderGeometry(0.04,0.04,0.25,6),'#9aa3b5',0.1); ft.position.set(Math.cos(a)*(R-0.13),Math.sin(a)*(R-0.13),z); ft.rotation.z=a+Math.PI/2; room.add(ft); } }
  // sleeping bag strapped to left wall
  const bag=new THREE.Group(); bag.position.set(-2.55,0.1,-1.8); bag.rotation.y=Math.PI/2; bag.rotation.z=0.05; room.add(bag);
  const bagBody=M(new THREE.CapsuleGeometry(0.5,1.6,6,16),accent); bagBody.scale.set(1,1,0.45); bag.add(bagBody);
  const bagIn=M(new THREE.SphereGeometry(0.32,14,10),'#f4f6fb',0.05); bagIn.position.set(0,0.95,0.08); bagIn.scale.set(1,0.8,0.5); bag.add(bagIn);
  for(const y of [-0.5,0.3]){ const strap=M(new THREE.BoxGeometry(1.08,0.1,0.5),'#4a5168',0.05); strap.position.y=y; bag.add(strap); }
  // screen on right wall
  const scr=new THREE.Group(); scr.position.set(2.6,0.5,-1.6); scr.rotation.y=-Math.PI/2+0.25; room.add(scr);
  const bez=M(new THREE.BoxGeometry(1.5,1.0,0.1),'#3a4258'); scr.add(bez);
  const disp=new THREE.Mesh(new THREE.PlaneGeometry(1.36,0.86), new THREE.MeshBasicMaterial({map:screenTexture(accent)})); disp.position.z=0.056; scr.add(disp);
  // laptop arm + keyboard
  const kb=M(new THREE.BoxGeometry(1.1,0.06,0.5),'#5b6478'); kb.position.set(2.35,-0.35,-1.3); kb.rotation.z=0.5; room.add(kb);
  // photos + sticky notes on right wall near screen
  [[2.75,1.5,-0.4,0],[2.72,1.35,0.25,1],[2.78,-0.9,-0.6,2]].forEach(([xx,yy,zz,k])=>{ const ph=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.52), new THREE.MeshBasicMaterial({map:photoTexture(k)})); ph.position.set(xx,yy,zz); ph.rotation.y=-Math.PI/2; ph.rotation.x=(k-1)*0.12; room.add(ph); });
  for(const [yy,zz,c] of [[1.95,-1.1,'#ffe066'],[1.75,-0.85,'#8ee0a8']]){ const n=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.28), new THREE.MeshBasicMaterial({color:c})); n.position.set(2.62,yy,zz); n.rotation.y=-Math.PI/2+0.25; room.add(n); }
  // plant strapped near window (bottom right)
  const plant=new THREE.Group(); plant.position.set(1.7,-2.2,-3.6); room.add(plant);
  const pot=M(new THREE.CylinderGeometry(0.28,0.22,0.42,14),'#e07a4a'); plant.add(pot);
  for(let i=0;i<7;i++){ const lf=M(new THREE.SphereGeometry(0.2,10,8),i%2?'#3fae7a':'#56c48a',0.05); const a=i/7*Math.PI*2; lf.position.set(Math.cos(a)*0.18,0.35+(i%3)*0.12,Math.sin(a)*0.18); lf.scale.set(0.6,1.3,0.35); lf.rotation.z=Math.cos(a)*0.6; plant.add(lf); }
  // floating items (zero g)
  const floaters=[];
  const cup=new THREE.Group(); const cb=M(new THREE.CylinderGeometry(0.16,0.14,0.36,14),'#ffffff'); cup.add(cb); const lid=M(new THREE.CylinderGeometry(0.17,0.17,0.06,14),accent); lid.position.y=0.2; cup.add(lid); const straw=M(new THREE.CylinderGeometry(0.025,0.025,0.3,6),'#ff6b6b',0.1); straw.position.set(0.05,0.36,0); cup.add(straw);
  cup.position.set(-1.3,1.3,-0.4); room.add(cup); floaters.push([cup,0]);
  const pen=M(new THREE.CylinderGeometry(0.035,0.035,0.5,8),'#2f6fdb',0.12); pen.position.set(1.1,1.6,0.6); room.add(pen); floaters.push([pen,1]);
  const book=M(new THREE.BoxGeometry(0.42,0.06,0.32),'#ff8a3d',0.08); book.position.set(-1.6,-1.5,0.5); room.add(book); floaters.push([book,2]);
  const astro=makeAstronaut(look); astro.scale.setScalar(1.05); astro.position.set(-0.55,-0.35,0.7); scene.add(astro);
  const cam=new THREE.PerspectiveCamera(56,1,0.1,60); cam.position.set(0,0.2,4.6); cam.lookAt(0,-0.1,-2);
  const obj={ scene, camera:cam, astro };
  obj.update=function(t){ const a=obj.astro; a.position.y=-0.35+Math.sin(t*1.2)*0.14; a.position.x=-0.55+Math.sin(t*0.6)*0.08;
    a.rotation.z=Math.sin(t*0.7)*0.1; a.rotation.y=-0.25+Math.sin(t*0.45)*0.35; a.rotation.x=Math.sin(t*0.5)*0.06;
    if(a.userData.animate) a.userData.animate(t, (t%9)<2.6);
    earth.rotation.y=t*0.03; floaters.forEach(([f,k])=>{ f.position.y+=Math.sin(t*0.9+k*2)*0.0015; f.rotation.x=t*(0.15+k*0.05); f.rotation.z=t*(0.1+k*0.07); }); };
  obj.setLook=function(l){ scene.remove(obj.astro); const a=makeAstronaut(l); a.scale.copy(obj.astro.scale); a.position.copy(obj.astro.position); a.rotation.copy(obj.astro.rotation); scene.add(a); obj.astro=a; };
  return obj;
}
