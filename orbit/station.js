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

export function makeAstronaut(look){ look=look||{suit:'#ffffff',visor:'#1b2350',flag:0};
  const g=new THREE.Group();
  const body=M(new THREE.CapsuleGeometry(0.42,0.55,6,16), look.suit); body.position.y=0; g.add(body);
  const pack=M(new THREE.BoxGeometry(0.62,0.7,0.3), '#c9cfe3'); pack.position.set(0,0.05,-0.42); g.add(pack);
  const panel=M(new THREE.BoxGeometry(0.34,0.22,0.06), '#5fe0d0', 0.08); panel.position.set(0,0.12,0.42); g.add(panel);
  const head=M(new THREE.SphereGeometry(0.52,24,18), '#ffffff'); head.position.y=0.95; g.add(head);
  const visor=M(new THREE.SphereGeometry(0.4,24,16,-Math.PI*0.55,Math.PI*1.1,Math.PI*0.25,Math.PI*0.45), look.visor, 0.04, {side:THREE.DoubleSide}); visor.position.set(0,0.98,0.18); g.add(visor);
  const shine=new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8), new THREE.MeshBasicMaterial({color:'#ffffff'})); shine.position.set(-0.17,1.12,0.5); g.add(shine);
  const armL=M(new THREE.CapsuleGeometry(0.15,0.42,4,10), look.suit); armL.position.set(-0.55,0.15,0); armL.rotation.z=0.5; g.add(armL);
  const armR=M(new THREE.CapsuleGeometry(0.15,0.42,4,10), look.suit); armR.position.set(0.55,0.25,0); armR.rotation.z=-0.9; g.add(armR);
  const legL=M(new THREE.CapsuleGeometry(0.17,0.36,4,10), look.suit); legL.position.set(-0.2,-0.75,0); g.add(legL);
  const legR=M(new THREE.CapsuleGeometry(0.17,0.36,4,10), look.suit); legR.position.set(0.2,-0.75,0); legR.rotation.z=0.15; g.add(legR);
  const f=FLAG_COLORS[look.flag%FLAG_COLORS.length]; const fl=new THREE.Group();
  f.forEach((c,i)=>{ const s=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.06,0.02), new THREE.MeshBasicMaterial({color:c})); s.position.y=-i*0.06; fl.add(s); });
  fl.position.set(-0.36,0.38,0.33); fl.rotation.y=-0.4; g.add(fl);
  g.userData.armR=armR; g.userData.armL=armL;
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
  const pods=[], rings=[]; const EMPTY='#4a5175';
  let minY=0,maxY=0;
  layout.forEach((L,li)=>{ const ringR=L.r, y=L.y; minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    const ring=new THREE.Group(); ring.position.y=y; st.add(ring); rings.push(ring);
    ring.add(M(new THREE.TorusGeometry(ringR,0.32,12,Math.max(96,L.n*4)),'#c9cfe3',0.08).rotateX(Math.PI/2));
    const hubR=y===0&&ringR<8?1.8:1.2;
    for(let i=0;i<4;i++){ const a=i*Math.PI/2+(li%2)*Math.PI/4; const len=ringR-hubR; const sp=M(new THREE.CylinderGeometry(0.18,0.18,len,10),'#c9cfe3',0.1); sp.rotation.z=Math.PI/2; sp.rotation.y=a; sp.position.set(Math.cos(a)*(ringR+hubR)/2,0,-Math.sin(a)*(ringR+hubR)/2); ring.add(sp); }
    for(let i=0;i<L.n;i++){ const a=i/L.n*Math.PI*2; const pod=new THREE.Group(); const k=pods.length;
      const col=k%3===0?accent:(k%3===1?'#eef1f8':accent2);
      const shell=M(new THREE.CapsuleGeometry(0.55,0.55,6,16), col); shell.rotation.z=Math.PI/2; pod.add(shell);
      const w=M(new THREE.CircleGeometry(0.22,16),'#ffd166',0,{side:THREE.DoubleSide, emissive:new THREE.Color('#ffb84d'), emissiveIntensity:0.5}); w.position.set(0,0,0.6); pod.add(w);
      const gl=glow('rgba(255,209,102,0.95)',3.2); gl.visible=false; pod.add(gl); pod.userData.glow=gl; pod.userData.win=w; pod.userData.shell=shell; pod.userData.col=col;
      pod.position.set(Math.cos(a)*ringR,0,-Math.sin(a)*ringR); pod.rotation.y=a+Math.PI/2; ring.add(pod); pods.push(pod); } });
  if(maxY-minY>0){ const spine=M(new THREE.CylinderGeometry(1.2,1.2,maxY-minY+2,24),'#dfe3f0'); spine.position.y=(maxY+minY)/2; st.add(spine); }
  const topY=Math.max(4.3, maxY+1.6); port.position.y=topY; portR.position.y=topY+0.45; const dockY=topY+0.5;
  function setOccupied(n){ pods.forEach((p,i)=>{ const on=typeof n==='function'?n(i):i<n; p.userData.shell.userData.mesh.material.color.set(on?p.userData.col:EMPTY);
    const wm=p.userData.win.userData.mesh.material; wm.color.set(on?'#ffd166':'#2a2f4a'); wm.emissiveIntensity=on?0.5:0; }); }
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
  return { THREE, scene, camera, update, pods, podWorld, dockWorld, rocket, crew, station:st, earth, setOccupied, size, capacity:pods.length };
}

// small cabin interior for the "your cabin" card
export function buildCabin(look, accent){
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#1a1f4a');
  scene.add(new THREE.HemisphereLight('#d6e2ff','#3a2a5a',1.6)); const d=new THREE.DirectionalLight('#fff',2); d.position.set(3,5,6); scene.add(d);
  const room=new THREE.Group(); scene.add(room);
  const wall=M(new THREE.CylinderGeometry(4,4,6,32,1,true),'#e3e7f3',0,{side:THREE.BackSide}); wall.rotation.z=Math.PI/2; room.add(wall);
  const win=M(new THREE.CircleGeometry(1.5,32),'#0b1238',0,{side:THREE.DoubleSide}); win.position.set(0,0.6,-3.6); room.add(win);
  const winR=M(new THREE.TorusGeometry(1.55,0.18,10,32),'#c9cfe3',0.1); winR.position.set(0,0.6,-3.58); room.add(winR);
  const earthMini=M(new THREE.SphereGeometry(0.9,24,16),'#2350c4',0.04); earthMini.position.set(0.4,-0.1,-3.75); room.add(earthMini);
  const l1=M(new THREE.SphereGeometry(0.4,12,8),'#3fae7a',0.05); l1.position.set(0.2,0.2,-3.1); l1.scale.set(1,0.5,0.3); room.add(l1);
  const bunk=M(new THREE.BoxGeometry(2.6,0.4,1.1),accent); bunk.position.set(-1.6,-2.2,-1.6); room.add(bunk);
  const pillow=M(new THREE.BoxGeometry(0.7,0.25,0.8),'#ffffff'); pillow.position.set(-2.5,-1.88,-1.6); room.add(pillow);
  const plant=M(new THREE.CylinderGeometry(0.3,0.24,0.5,12),'#c99a5b'); plant.position.set(2.2,-2.1,-2); room.add(plant);
  const leaf=M(new THREE.SphereGeometry(0.45,12,8),'#3fae7a'); leaf.position.set(2.2,-1.55,-2); room.add(leaf);
  const lamp=M(new THREE.SphereGeometry(0.22,12,8),'#ffd166',0.1,{emissive:new THREE.Color('#ffb84d'),emissiveIntensity:0.8}); lamp.position.set(-2.4,1.6,-2.4); room.add(lamp);
  const astro=makeAstronaut(look); astro.position.set(0.3,-0.3,-0.5); scene.add(astro);
  const cam=new THREE.PerspectiveCamera(50,1,0.1,50); cam.position.set(0,0,5.2); cam.lookAt(0,-0.2,-1);
  const obj={ scene, camera:cam, astro };
  obj.update=function(t){ const a=obj.astro; a.position.y=-0.3+Math.sin(t*1.4)*0.18; a.rotation.z=Math.sin(t*0.8)*0.12; a.rotation.y=Math.sin(t*0.5)*0.4; if(a.userData.armR) a.userData.armR.rotation.z=-0.9-Math.sin(t*5)*0.5; earthMini.rotation.y=t*0.2; };
  obj.setLook=function(l){ scene.remove(obj.astro); const a=makeAstronaut(l); a.position.copy(obj.astro.position); scene.add(a); obj.astro=a; };
  return obj;
}
