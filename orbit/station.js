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
  // nebula sky dome
  { const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'#05061a'); g.addColorStop(0.55,'#0b0f33'); g.addColorStop(1,'#141448'); x.fillStyle=g; x.fillRect(0,0,1024,512);
    let q=5; const rq=()=>{ q=(q*16807)%2147483647; return q/2147483647; };
    const cols=[accent,accent2,'#6f5cff','#3a7bff'];
    for(let i=0;i<26;i++){ const cx=rq()*1024, cy=120+rq()*300, rr=60+rq()*170; const gg=x.createRadialGradient(cx,cy,0,cx,cy,rr); const col=cols[i%4];
      gg.addColorStop(0,col+'66'); gg.addColorStop(0.5,col+'26'); gg.addColorStop(1,col+'00'); x.fillStyle=gg; x.fillRect(cx-rr,cy-rr,rr*2,rr*2); }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(300,48,24), new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,depthWrite:false}))); }
  scene.add(new THREE.HemisphereLight('#bcd2ff','#2a1c4a',1.4));
  const sun=new THREE.DirectionalLight('#ffffff',2.4); sun.position.set(8,12,10); scene.add(sun);
  // stars
  const sg=new THREE.BufferGeometry(); const N=1800, pos=new Float32Array(N*3);
  let s=7; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  for(let i=0;i<N;i++){ const th=r()*Math.PI*2, ph=Math.acos(2*r()-1), R=180+r()*60; pos[i*3]=R*Math.sin(ph)*Math.cos(th); pos[i*3+1]=R*Math.cos(ph); pos[i*3+2]=R*Math.sin(ph)*Math.sin(th); }
  sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:'#dfe6ff',size:1.1,sizeAttenuation:true})); scene.add(stars);
  const sg2=new THREE.BufferGeometry(); const N2=260, p2=new Float32Array(N2*3), c2=new Float32Array(N2*3); const tint=[[1,0.85,0.7],[0.75,0.85,1],[1,1,1],[1,0.75,0.95]];
  for(let i=0;i<N2;i++){ const th=r()*Math.PI*2, ph=Math.acos(2*r()-1), R=200+r()*50; p2[i*3]=R*Math.sin(ph)*Math.cos(th); p2[i*3+1]=R*Math.cos(ph); p2[i*3+2]=R*Math.sin(ph)*Math.sin(th); const tc=tint[i%4]; c2.set(tc,i*3); }
  sg2.setAttribute('position',new THREE.BufferAttribute(p2,3)); sg2.setAttribute('color',new THREE.BufferAttribute(c2,3));
  const dotC=document.createElement('canvas'); dotC.width=dotC.height=64; { const x=dotC.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); }
  const dotT=new THREE.CanvasTexture(dotC);
  const bigStars=new THREE.Points(sg2,new THREE.PointsMaterial({size:3.4,map:dotT,vertexColors:true,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); stars.add(bigStars);
  stars.material.map=dotT; stars.material.transparent=true; stars.material.depthWrite=false; stars.material.size=1.6;
  const sunGlow=glow('rgba(255,236,200,1)',70); sunGlow.position.set(120,90,-180); scene.add(sunGlow);
  const sunCore=glow('rgba(255,255,255,1)',22); sunCore.position.copy(sunGlow.position); scene.add(sunCore);
  // earth
  const earth=new THREE.Group(); earth.position.set(0,-62,-10); scene.add(earth);
  const ocean=M(new THREE.SphereGeometry(48,48,32),'#2350c4',0.012); earth.add(ocean);
  let rs=11; const rr=()=>{ rs=(rs*16807)%2147483647; return rs/2147483647; };
  for(let i=0;i<26;i++){ const th=rr()*Math.PI*2, ph=rr()*Math.PI; const land=M(new THREE.SphereGeometry(6+rr()*9,16,12),'#3fae7a',0.03);
    land.position.setFromSphericalCoords(44.5,ph,th); land.scale.set(1,0.25,1); land.lookAt(0,0,0); land.rotateX(Math.PI/2); earth.add(land); }
  for(let i=0;i<18;i++){ const th=rr()*Math.PI*2, ph=rr()*Math.PI; const cl=new THREE.Mesh(new THREE.SphereGeometry(4+rr()*5,12,10), toon('#ffffff',{transparent:true,opacity:0.85}));
    cl.position.setFromSphericalCoords(49.2,ph,th); cl.scale.set(1.6,0.3,1); cl.lookAt(0,0,0); cl.rotateX(Math.PI/2); earth.add(cl); }
  const atmMat=new THREE.ShaderMaterial({ transparent:true, side:THREE.BackSide, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ c:{value:new THREE.Color(accent2)} },
    vertexShader:'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vP=mv.xyz; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 c; varying vec3 vN; varying vec3 vP; void main(){ float f=pow(1.0-abs(dot(normalize(-vP),vN)),3.5); gl_FragColor=vec4(c,f*0.55); }' });
  const atm=new THREE.Mesh(new THREE.SphereGeometry(53,64,40), atmMat); earth.add(atm);
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
  // hub details: window rows, radiator fins, dish antenna, beacons
  for(const y of [-1.0,-1.6]) for(let i=0;i<16;i++){ const a=i/16*Math.PI*2+0.1; const w=new THREE.Mesh(new THREE.CircleGeometry(0.11,10), new THREE.MeshBasicMaterial({color:i%3?'#ffd166':'#9fe7ff',side:THREE.DoubleSide}));
    w.position.set(Math.sin(a)*1.82,y,Math.cos(a)*1.82); w.lookAt(Math.sin(a)*4,y,Math.cos(a)*4); st.add(w); }
  for(const side of [0,Math.PI]){ const fin=new THREE.Group(); fin.rotation.y=side+Math.PI/2; st.add(fin);
    const arm=M(new THREE.BoxGeometry(0.14,0.14,1.0),'#c9cfe3',0.12); arm.position.set(0,-0.6,2.3); fin.add(arm);
    const pan=M(new THREE.BoxGeometry(0.05,1.5,1.0),'#f4f6fb',0.1); pan.position.set(0,-0.6,3.25); fin.add(pan);
    for(let k=0;k<4;k++){ const ln=new THREE.Mesh(new THREE.BoxGeometry(0.06,1.4,0.03), new THREE.MeshBasicMaterial({color:'#b9c0ce'})); ln.position.set(0,-0.6,2.85+k*0.27); fin.add(ln); } }
  const dish=new THREE.Group(); dish.position.set(-1.2,3.1,0.9); dish.rotation.set(-0.6,0,0.5); st.add(dish);
  dish.add(M(new THREE.CylinderGeometry(0.05,0.05,0.7,6),'#c9cfe3',0.15));
  const bowl=M(new THREE.SphereGeometry(0.55,20,10,0,Math.PI*2,0,Math.PI*0.32),'#f4f6fb',0.06,{side:THREE.DoubleSide}); bowl.position.y=0.55; bowl.rotation.x=Math.PI; dish.add(bowl);
  const feed=M(new THREE.SphereGeometry(0.07,8,6),accent,0.1); feed.position.y=0.25; dish.add(feed);
  const beacons=[]; for(let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4; const b=glow(i%2?'rgba(255,90,90,1)':'rgba(120,255,170,1)',0.9); b.position.set(Math.sin(a)*1.9,2.25,Math.cos(a)*1.9); st.add(b); beacons.push(b); }
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
  // ---- go-kart track under the station ----
  let kart=null, trackR=0;
  if((cfg.features||[]).includes('gokart')){ kart=buildKartTrack(st, minY, accent, accent2, {pool:(cfg.features||[]).includes('ranchpool')}); trackR=kart.outer; }
  let pool=null;
  if((cfg.features||[]).includes('ranchpool') && kart){ pool=buildRanchPool(kart.group, accent, accent2, cfg.poolCredit||''); }
  let nug=null;
  if((cfg.features||[]).includes('nuggethand') && pool){ nug=buildNuggetHand(pool.group, cfg.handCredit||''); }
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
    st.position.y=Math.sin(t*0.7)*0.15;
    beacons.forEach((b,i)=>b.material.opacity=((t*0.9+i*0.25)%1)<0.3?1:0.15);
    if(kart) kart.update(t);
    if(pool) pool.update(t);
    if(nug) nug.update(t); }
  function podWorld(i){ const v=new THREE.Vector3(); pods[i].getWorldPosition(v); return v; }
  function dockWorld(){ const v=new THREE.Vector3(0,dockY,0); return st.localToWorld(v); }
  const size=Math.max(trackR, ...layout.map(L=>L.r))+Math.max(Math.abs(minY)+(kart?4:0),maxY);
  return { THREE, scene, camera, update, pods, podWorld, dockWorld, rocket, crew, station:st, earth, setOccupied, setSelected, selGlow, kart, pool, nug, size, capacity:pods.length };
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

// ---------- go-kart track (built from follower comments) ----------
function stripeTex(a,b,n){ const c=document.createElement('canvas'); c.width=512; c.height=32; const x=c.getContext('2d');
  for(let i=0;i<n;i++){ x.fillStyle=i%2?b:a; x.fillRect(i*512/n,0,512/n+1,32); } const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; return t; }
function asphaltTex(){ const c=document.createElement('canvas'); c.width=1024; c.height=64; const x=c.getContext('2d');
  x.fillStyle='#2c3142'; x.fillRect(0,0,1024,64); for(let i=0;i<600;i++){ x.fillStyle=`rgba(255,255,255,${Math.random()*0.05})`; x.fillRect(Math.random()*1024,Math.random()*64,2,2); }
  x.fillStyle='#e8ecf4'; for(let i=0;i<32;i++) x.fillRect(i*32+4,30,16,4); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; return t; }
function makeKart(color, suit){ const g=new THREE.Group();
  const body=M(new THREE.BoxGeometry(0.9,0.22,0.55),color,0.08); body.position.y=0.22; g.add(body);
  const nose=M(new THREE.BoxGeometry(0.3,0.16,0.5),color,0.08); nose.position.set(0.55,0.2,0); g.add(nose);
  const seat=M(new THREE.BoxGeometry(0.28,0.3,0.4),'#2a2f40',0.08); seat.position.set(-0.18,0.42,0); g.add(seat);
  const wing=M(new THREE.BoxGeometry(0.12,0.05,0.7),'#2a2f40',0.1); wing.position.set(-0.52,0.48,0); g.add(wing);
  for(const [x,z] of [[0.33,0.32],[0.33,-0.32],[-0.33,0.34],[-0.33,-0.34]]){ const w=M(new THREE.CylinderGeometry(0.14,0.14,0.12,14),'#1b1e29',0.1); w.rotation.x=Math.PI/2; w.position.set(x,0.14,z); g.add(w); }
  const torso=M(new THREE.CapsuleGeometry(0.13,0.12,4,10),suit,0.08); torso.position.set(-0.05,0.52,0); g.add(torso);
  const helm=M(new THREE.SphereGeometry(0.15,14,10),'#f4f6fb',0.08); helm.position.set(0,0.75,0); g.add(helm);
  const vis=new THREE.Mesh(new THREE.SphereGeometry(0.12,14,10,-Math.PI*0.5,Math.PI,Math.PI*0.3,Math.PI*0.4), new THREE.MeshPhongMaterial({color:'#1b2350',shininess:80,specular:new THREE.Color('#ffffff')}));
  vis.rotation.y=Math.PI/2; vis.position.set(0.03,0.76,0); g.add(vis);
  const tail=glow('rgba(255,80,80,1)',0.5); tail.position.set(-0.6,0.25,0); g.add(tail);
  return g; }
function buildKartTrack(st, minY, accent, accent2, opts={}){
  const y=minY-4.6, inner=8.0, outer=11.2, mid=(inner+outer)/2, T=new THREE.Group(); T.position.y=y; st.add(T);
  // deck + surface
  const deck=M(new THREE.CylinderGeometry(outer+0.5,outer+0.5,0.45,96,1,false),'#c9cfe3',0.03); deck.position.y=-0.3; T.add(deck);
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(inner-0.5,inner-0.5,0.5,64), new THREE.MeshToonMaterial({color:'#3a4058',gradientMap:GM})); hole.position.y=-0.28; T.add(hole);
  const at=asphaltTex(); at.repeat.set(3,1);
  const surf=new THREE.Mesh(new THREE.RingGeometry(inner,outer,128,1), new THREE.MeshToonMaterial({map:at,gradientMap:GM,side:THREE.DoubleSide}));
  surf.rotation.x=-Math.PI/2; surf.position.y=-0.05; T.add(surf);
  // ring UVs: map angle to u so the dashed line follows the track
  { const pos=surf.geometry.attributes.position, uv=surf.geometry.attributes.uv; for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getY(i); const a=Math.atan2(z,x); const rr=Math.hypot(x,z); uv.setXY(i,(a/(Math.PI*2)+0.5), (rr-inner)/(outer-inner)); } uv.needsUpdate=true; }
  // walls with red/white stripes
  const st1=stripeTex('#ff4d6d','#ffffff',48); st1.repeat.set(6,1);
  for(const [R,h] of [[outer,0.45],[inner,0.3]]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(R,R,h,128,1,true), new THREE.MeshToonMaterial({map:st1,gradientMap:GM,side:THREE.DoubleSide})); w.position.y=h/2-0.05; T.add(w);
    const rim=M(new THREE.TorusGeometry(R,0.05,6,128),'#0b0a1f',0); rim.rotation.x=Math.PI/2; rim.position.y=h-0.05; T.add(rim); }
  // start/finish line + arch
  const ck=document.createElement('canvas'); ck.width=128; ck.height=32; const cx=ck.getContext('2d'); for(let i=0;i<16;i++) for(let j=0;j<4;j++){ cx.fillStyle=(i+j)%2?'#111':'#fff'; cx.fillRect(i*8,j*8,8,8); }
  const ckt=new THREE.CanvasTexture(ck); ckt.magFilter=THREE.NearestFilter;
  const line=new THREE.Mesh(new THREE.PlaneGeometry(outer-inner,0.7), new THREE.MeshBasicMaterial({map:ckt})); line.rotation.x=-Math.PI/2; line.position.set(mid,0.0,0); T.add(line);
  const arch=new THREE.Group(); arch.position.set(mid,0,0); T.add(arch);
  for(const z of [-1,1]){ const post=M(new THREE.CylinderGeometry(0.1,0.1,2.4,8),'#c9cfe3',0.1); post.position.set(z*(outer-inner)/2+0.0,1.2,0); arch.add(post); }
  const sc=document.createElement('canvas'); sc.width=512; sc.height=128; const sx=sc.getContext('2d'); sx.fillStyle='#0b0a1f'; sx.fillRect(0,0,512,128);
  sx.strokeStyle=accent; sx.lineWidth=10; sx.strokeRect(6,6,500,116); sx.font='900 70px "Inter Display", Inter, sans-serif'; sx.textAlign='center'; sx.textBaseline='middle'; sx.fillStyle='#ffffff'; sx.fillText('🏁 ORBIT GP 🏁',256,68);
  const stx=new THREE.CanvasTexture(sc); stx.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.BoxGeometry(outer-inner+0.4,0.75,0.12), [toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),new THREE.MeshBasicMaterial({map:stx}),new THREE.MeshBasicMaterial({map:stx})]);
  sign.position.y=2.45; arch.add(sign);
  // support pylon + spokes
  if(!opts.pool){ const py=M(new THREE.CylinderGeometry(0.7,0.9,Math.abs(y)-Math.abs(minY)+2,16),'#dfe3f0',0.04); py.position.y=(Math.abs(y)-Math.abs(minY)+2)/2-0.3; T.add(py);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const sp=M(new THREE.CylinderGeometry(0.16,0.16,inner-0.8,8),'#c9cfe3',0.1); sp.rotation.z=Math.PI/2; sp.rotation.y=a; sp.position.set(Math.cos(a)*(inner)/2,-0.25,-Math.sin(a)*(inner)/2); T.add(sp); } }
  else { // support cables from the station down to the inner wall
    const top=new THREE.Vector3(0,Math.abs(y)-Math.abs(minY)-0.2,0);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2+0.5; const bot=new THREE.Vector3(Math.cos(a)*(inner-0.2),0.3,-Math.sin(a)*(inner-0.2)); const tp=new THREE.Vector3(Math.cos(a)*1.4,top.y,-Math.sin(a)*1.4);
      const len=bot.distanceTo(tp); const c=M(new THREE.CylinderGeometry(0.06,0.06,len,6),'#c9cfe3',0.15); c.position.copy(bot.clone().add(tp).multiplyScalar(0.5)); c.lookAt(tp); c.rotateX(Math.PI/2); T.add(c); } }
  // floodlights
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2+0.3; const pole=M(new THREE.CylinderGeometry(0.06,0.06,1.8,6),'#9aa3b5',0.1); pole.position.set(Math.cos(a)*(outer+0.3),0.9,Math.sin(a)*(outer+0.3)); T.add(pole);
    const l=glow('rgba(255,240,200,1)',1.6); l.position.set(Math.cos(a)*(outer+0.3),1.85,Math.sin(a)*(outer+0.3)); T.add(l); }
  // karts
  const cols=[accent,accent2,'#ffd166','#6fb6ff','#8ef08a','#ff8a3d','#b39cff'];
  const karts=cols.map((c,i)=>{ const k=makeKart(c,SUITS[(i*3+1)%SUITS.length]); T.add(k); return {k,off:i/cols.length*Math.PI*2+(i%2)*0.2,sp:0.55+((i*37)%10)/40,lane:inner+0.7+((i*5)%3)*0.85}; });
  function update(t){ karts.forEach((o,i)=>{ const a=o.off+t*o.sp; const lane=o.lane+Math.sin(t*0.9+i)*0.35; o.k.position.set(Math.cos(a)*lane,0.02+Math.abs(Math.sin(t*12+i))*0.02,-Math.sin(a)*lane); o.k.rotation.y=a+Math.PI/2+Math.cos(t*0.9+i)*0.08; }); }
  return { group:T, update, y, outer, karts };
}

// ---------- Olympic pool full of ranch (built from follower comments) ----------
function ranchTex(){ return canvasTex(512,256,(x,w,h)=>{ x.fillStyle='#f4f0de'; x.fillRect(0,0,w,h);
  for(let i=0;i<60;i++){ x.fillStyle=`rgba(235,226,196,${0.5+Math.random()*0.5})`; x.beginPath(); x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*30,4+Math.random()*10,Math.random()*3,0,7); x.fill(); }
  for(let i=0;i<260;i++){ x.fillStyle=['#5aa04a','#3f7f35','#7cbf55'][i%3]; x.save(); x.translate(Math.random()*w,Math.random()*h); x.rotate(Math.random()*3); x.fillRect(-3,-1.2,6,2.4); x.restore(); }
  for(let i=0;i<60;i++){ x.fillStyle='rgba(40,40,30,0.55)'; x.beginPath(); x.arc(Math.random()*w,Math.random()*h,1.3,0,7); x.fill(); } }); }
function tileTex(){ return canvasTex(256,256,(x,w,h)=>{ x.fillStyle='#e9f2f8'; x.fillRect(0,0,w,h); x.strokeStyle='#b8cbd8'; x.lineWidth=3; for(let i=0;i<=8;i++){ x.beginPath(); x.moveTo(i*32,0); x.lineTo(i*32,h); x.stroke(); x.beginPath(); x.moveTo(0,i*32); x.lineTo(w,i*32); x.stroke(); } }); }
function buildRanchPool(T, accent, accent2, credit){
  const P=new THREE.Group(); P.position.y=0.02; T.add(P);
  const L=10.4, Wd=5.0;
  const tt=tileTex(); tt.wrapS=tt.wrapT=THREE.RepeatWrapping; tt.repeat.set(4,2);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(L+2.0,0.3,Wd+2.0), [toon('#d9e6ee'),toon('#d9e6ee'),new THREE.MeshToonMaterial({map:tt,gradientMap:GM}),toon('#d9e6ee'),toon('#d9e6ee'),toon('#d9e6ee')]); deck.position.y=0.05; P.add(deck);
  for(const [sx,sz,px,pz] of [[L+0.5,0.25,0,Wd/2+0.12],[L+0.5,0.25,0,-Wd/2-0.12],[0.25,Wd,L/2+0.12,0],[0.25,Wd,-L/2-0.12,0]]){ const b=M(new THREE.BoxGeometry(sx,0.22,sz),'#ffffff',0.06); b.position.set(px,0.3,pz); P.add(b); }
  const rt=ranchTex(); rt.wrapS=rt.wrapT=THREE.RepeatWrapping; rt.repeat.set(3,1.5);
  const sg=new THREE.PlaneGeometry(L,Wd,40,20); const surf=new THREE.Mesh(sg,new THREE.MeshToonMaterial({map:rt,gradientMap:GM})); surf.rotation.x=-Math.PI/2; surf.position.y=0.26; P.add(surf);
  const base=sg.attributes.position.array.slice();
  for(let k=1;k<6;k++){ const z=-Wd/2+k*Wd/6; for(let i=0;i<26;i++){ const f=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6), new THREE.MeshBasicMaterial({color:i%2?'#ff4d6d':'#ffffff'})); f.position.set(-L/2+0.2+i*(L-0.4)/25,0.31,z); P.add(f); } }
  for(let k=0;k<6;k++){ const z=-Wd/2+(k+0.5)*Wd/6; const bl=M(new THREE.BoxGeometry(0.35,0.3,0.45),k%2?accent:accent2,0.08); bl.position.set(-L/2-0.45,0.4,z); P.add(bl); }
  const board=M(new THREE.BoxGeometry(1.6,0.08,0.45),'#3a7bff',0.08); board.position.set(L/2+0.2,0.75,Wd/2-0.6); P.add(board);
  const boardBase=M(new THREE.BoxGeometry(0.4,0.55,0.4),'#c9cfe3',0.08); boardBase.position.set(L/2+0.85,0.45,Wd/2-0.6); P.add(boardBase);
  const bottle=new THREE.Group(); bottle.position.set(L/2+0.7,2.3,-Wd/2+0.7); bottle.rotation.z=2.2; P.add(bottle);
  bottle.add(M(new THREE.CylinderGeometry(0.62,0.62,2.0,24),'#fbfaf3',0.05));
  const sh=M(new THREE.CylinderGeometry(0.3,0.62,0.55,24),'#fbfaf3',0.05); sh.position.y=1.27; bottle.add(sh);
  const capM=M(new THREE.CylinderGeometry(0.31,0.31,0.3,16),'#3fae5a',0.08); capM.position.y=1.68; bottle.add(capM);
  const lab=canvasTex(512,256,(x,w,h)=>{ x.fillStyle='#3fae5a'; x.fillRect(0,0,w,h); x.fillStyle='#ffffff'; x.fillRect(0,30,w,196); x.fillStyle='#2f7d42'; x.font='900 120px "Inter Display", Inter, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('RANCH',w/2,130); });
  const label=new THREE.Mesh(new THREE.CylinderGeometry(0.635,0.635,1.1,24,1,true), new THREE.MeshBasicMaterial({map:lab})); bottle.add(label);
  const stream=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.2,1.0,12), toon('#f4f0de')); P.add(stream);
  const swim=[]; for(let i=0;i<4;i++){ const a=makeAstronaut({suit:SUITS[(i*2+3)%SUITS.length],visor:VISORS[(i+1)%VISORS.length]}); a.scale.setScalar(0.38); a.position.set(-3.5+i*2.3,0.25,-1.2+(i%2)*2.0); a.rotation.x=-0.9; P.add(a); swim.push(a); }
  const tube=M(new THREE.TorusGeometry(0.42,0.17,10,20),accent,0.08); tube.rotation.x=Math.PI/2; tube.position.set(2.2,0.32,1.2); P.add(tube);
  const chair=new THREE.Group(); chair.position.set(-L/2+1.2,0.2,Wd/2+0.75); P.add(chair);
  for(const [x,z] of [[-0.25,-0.2],[0.25,-0.2],[-0.25,0.2],[0.25,0.2]]){ const l=M(new THREE.CylinderGeometry(0.04,0.04,1.4,6),'#ffffff',0.12); l.position.set(x,0.7,z); chair.add(l); }
  const seat=M(new THREE.BoxGeometry(0.6,0.08,0.5),'#ff4d6d',0.08); seat.position.y=1.42; chair.add(seat);
  const umb=new THREE.Group(); umb.position.set(L/2-1.5,0.2,Wd/2+0.75); P.add(umb);
  const ump=M(new THREE.CylinderGeometry(0.04,0.04,1.8,6),'#ffffff',0.12); ump.position.y=0.9; umb.add(ump);
  const canopy=M(new THREE.ConeGeometry(0.95,0.45,8,1,true),accent2,0.06,{side:THREE.DoubleSide}); canopy.position.y=1.9; umb.add(canopy);
  const sgn=canvasTex(1024,256,(x,w,h)=>{ x.fillStyle='#0b0a1f'; x.fillRect(0,0,w,h); x.strokeStyle='#3fae5a'; x.lineWidth=16; x.strokeRect(8,8,w-16,h-16);
    x.font='900 110px "Inter Display", Inter, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#ffffff'; x.fillText('RANCH POOL',w/2,105);
    x.font='700 52px "Inter Display", Inter, sans-serif'; x.fillStyle='#8ee0a8'; x.fillText(credit?('Olympic size · idea: @'+credit):'Olympic size',w/2,190); });
  const sign=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.9,0.1), [toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),new THREE.MeshBasicMaterial({map:sgn}),new THREE.MeshBasicMaterial({map:sgn})]);
  sign.position.set(0,1.7,-Wd/2-0.9); P.add(sign);
  for(const x of [-1.6,1.6]){ const post=M(new THREE.CylinderGeometry(0.05,0.05,1.3,6),'#c9cfe3',0.12); post.position.set(x,0.85,-Wd/2-0.9); P.add(post); }
  for(let i=0;i<6;i++){ const g=glow('rgba(160,255,190,0.9)',1.1); g.position.set(-L/2+1+i*(L-2)/5,0.45,(i%2?1:-1)*(Wd/2+0.25)); P.add(g); }
  const mouth=new THREE.Vector3(), end=new THREE.Vector3(), wp=new THREE.Vector3();
  function update(t){
    const pa=sg.attributes.position; for(let i=0;i<pa.count;i++){ const x=base[i*3], y=base[i*3+1]; pa.array[i*3+2]=Math.sin(x*1.3+t*1.6)*0.04+Math.cos(y*1.7+t*1.2)*0.03; } pa.needsUpdate=true;
    rt.offset.x=t*0.01; rt.offset.y=Math.sin(t*0.2)*0.02;
    bottle.rotation.z=2.2+Math.sin(t*0.9)*0.04; bottle.updateMatrixWorld(true);
    mouth.set(0,1.85,0); bottle.localToWorld(mouth); P.worldToLocal(mouth); end.set(mouth.x-0.25,0.28,mouth.z);
    stream.position.copy(mouth).add(end).multiplyScalar(0.5); stream.scale.set(1,Math.max(0.2,mouth.distanceTo(end)),1);
    wp.copy(end); P.localToWorld(wp); stream.lookAt(wp); stream.rotateX(Math.PI/2);
    swim.forEach((a,i)=>{ a.position.y=0.25+Math.sin(t*1.5+i)*0.05; a.rotation.z=Math.sin(t*0.8+i)*0.3; a.position.x=-3.5+i*2.3+Math.sin(t*0.4+i)*0.4; if(a.userData.animate) a.userData.animate(t*1.4+i,i===1); });
    tube.position.y=0.32+Math.sin(t*1.3)*0.04; tube.rotation.z=t*0.2;
  }
  return { group:P, update };
}

// ---------- giant hand dipping chicken nuggets into the ranch pool (follower idea) ----------
function nuggetMesh(r){ const g=new THREE.IcosahedronGeometry(r,2); const p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)); const n=1+0.18*Math.sin(v.x*9.1+v.y*4.3)+0.12*Math.cos(v.z*11.7-v.x*3.1); v.multiplyScalar(n); p.setXYZ(i,v.x*1.25,v.y*0.8,v.z); }
  g.computeVertexNormals(); return M(g,'#d99a3c',0.06); }
function buildNuggetHand(P, credit){
  const G=new THREE.Group(); P.add(G);
  const L=10.4, Wd=5.0, px=1.2, pz=Wd/2+1.5;
  // pedestal + arm
  const ped=M(new THREE.CylinderGeometry(0.45,0.65,4.4,16),'#c9cfe3',0.05); ped.position.set(px,2.2,pz); G.add(ped);
  const cap=M(new THREE.SphereGeometry(0.6,16,12),'#9aa3b5',0.06); cap.position.set(px,4.45,pz); G.add(cap);
  const arm=M(new THREE.CylinderGeometry(0.42,0.48,1,14),'#f4f6fb',0.05); G.add(arm);
  const stripe=M(new THREE.CylinderGeometry(0.5,0.5,0.3,14),'#ffd166',0.05); G.add(stripe);
  // hand (pointing down, pinching a nugget)
  const H=new THREE.Group(); H.scale.setScalar(1.7); G.add(H);
  const cuff=M(new THREE.CylinderGeometry(0.42,0.42,0.35,16),'#f4f6fb',0.05); cuff.position.y=0.45; H.add(cuff);
  const palm=M(new THREE.SphereGeometry(0.5,18,14),'#f2c19b',0.05); palm.scale.set(1,0.9,0.55); H.add(palm);
  const fingers=[];
  for(let i=0;i<4;i++){ const f=new THREE.Group(); f.position.set(-0.3+i*0.2,-0.35,0.08); H.add(f);
    const seg1=M(new THREE.CapsuleGeometry(0.1,0.32,4,10),'#f2c19b',0.08); seg1.position.y=-0.22; f.add(seg1);
    const k=new THREE.Group(); k.position.y=-0.44; f.add(k); const seg2=M(new THREE.CapsuleGeometry(0.09,0.22,4,10),'#f2c19b',0.08); seg2.position.y=-0.16; k.add(seg2);
    f.rotation.x=0.25; k.rotation.x=0.55; fingers.push({f,k}); }
  const th=new THREE.Group(); th.position.set(0.42,-0.15,0.18); H.add(th); const ts=M(new THREE.CapsuleGeometry(0.11,0.34,4,10),'#f2c19b',0.08); ts.position.y=-0.25; th.add(ts); th.rotation.set(0.6,0,0.7);
  const nug=new THREE.Group(); nug.position.set(0,-1.05,0.32); H.add(nug); nug.add(nuggetMesh(0.38));
  const coat=new THREE.Mesh(new THREE.SphereGeometry(0.44,14,10,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45), toon('#f4f0de')); coat.scale.set(1.2,0.85,1); nug.add(coat); coat.visible=false;
  const drip=M(new THREE.SphereGeometry(0.07,8,6),'#f4f0de',0.02); nug.add(drip); drip.visible=false;
  // splash ring on the ranch
  const splash=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.06,6,24), new THREE.MeshBasicMaterial({color:'#fffbea',transparent:true,opacity:0})); splash.rotation.x=Math.PI/2; G.add(splash);
  // nugget box
  const box=new THREE.Group(); box.position.set(px+1.3,0.2,pz-0.1); G.add(box);
  const bx=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.75,0.7), [toon('#e23b3b'),toon('#e23b3b'),toon('#c92f2f'),toon('#e23b3b'),new THREE.MeshBasicMaterial({map:canvasTex(256,256,(x,w,h)=>{ x.fillStyle='#e23b3b'; x.fillRect(0,0,w,h); x.fillStyle='#ffd166'; x.font='900 74px "Inter Display", Inter, sans-serif'; x.textAlign='center'; x.fillText('NUGS',w/2,150); })}),toon('#e23b3b')]);
  bx.position.y=0.38; box.add(bx); for(let i=0;i<5;i++){ const n=nuggetMesh(0.17); n.position.set(-0.25+(i%3)*0.25,0.82+(i>2?0.1:0),-0.1+(i%2)*0.18); n.rotation.set(i,i*2,0); box.add(n); }
  // credit sign
  const sg=canvasTex(1024,256,(x,w,h)=>{ x.fillStyle='#0b0a1f'; x.fillRect(0,0,w,h); x.strokeStyle='#ffd166'; x.lineWidth=16; x.strokeRect(8,8,w-16,h-16);
    x.font='900 100px "Inter Display", Inter, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#ffffff'; x.fillText('NUGGET HAND',w/2,100);
    x.font='700 50px "Inter Display", Inter, sans-serif'; x.fillStyle='#ffd166'; x.fillText(credit?('idea: @'+credit):'dip responsibly',w/2,190); });
  const sign=new THREE.Mesh(new THREE.BoxGeometry(3.0,0.75,0.1),[toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),toon('#0b0a1f'),new THREE.MeshBasicMaterial({map:sg}),new THREE.MeshBasicMaterial({map:sg})]);
  sign.position.set(px-2.3,1.35,pz+0.2); G.add(sign); for(const x of [-1.3,1.3]){ const po=M(new THREE.CylinderGeometry(0.05,0.05,1.1,6),'#c9cfe3',0.12); po.position.set(px-2.3+x,0.75,pz+0.2); G.add(po); }
  const top=new THREE.Vector3(px,4.45,pz), wrist=new THREE.Vector3(), mid=new THREE.Vector3(), tmp=new THREE.Vector3();
  const surfY=0.28, dipX=px-0.6, dipZ=Wd/2-1.3;
  function update(t){
    const per=4.0, c=t%per; let d;
    if(c<1.1) d=Math.sin(c/1.1*Math.PI/2)**2; else if(c<1.7) d=1; else if(c<2.9) d=1-Math.sin((c-1.7)/1.2*Math.PI/2)**2; else d=0;
    const handY=surfY+2.25+(1-d)*1.7;
    H.position.set(dipX+Math.sin(t*0.7)*0.15, handY, dipZ); H.rotation.z=Math.sin(t*1.3)*0.05;
    wrist.set(H.position.x,H.position.y+0.62*1.7,H.position.z);
    mid.copy(top).add(wrist).multiplyScalar(0.5); arm.position.copy(mid); arm.scale.set(1,top.distanceTo(wrist),1);
    tmp.copy(wrist); G.localToWorld(tmp); arm.lookAt(tmp); arm.rotateX(Math.PI/2);
    stripe.position.copy(top).lerp(wrist,0.5); stripe.quaternion.copy(arm.quaternion);
    fingers.forEach((o,i)=>{ o.f.rotation.x=0.25+0.05*Math.sin(t*2+i); });
    const dipped=t>1.0; coat.visible=dipped; drip.visible=dipped && c>1.7 && c<3.6; drip.position.set(0,-0.42-((c-1.7)%0.9)*1.2,0);
    const sp=(c-1.0); if(sp>0&&sp<0.9){ splash.position.set(dipX,surfY+0.04,dipZ+0.32*1.7); const k=sp/0.9; splash.scale.setScalar(0.6+2.2*k); splash.material.opacity=0.85*(1-k); } else splash.material.opacity=0;
  }
  return { group:G, update, hand:H };
}
