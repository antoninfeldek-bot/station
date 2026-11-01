import * as THREE from './lib/three.module.js';
import { buildStation, buildCabin, cabinFor, defaultLook, makeAstronaut, SUITS, VISORS, CABINS, setFlagColors } from './station.js';

const CFG = await (await fetch('./config.json')).json();
const T = CFG.t;
setFlagColors(CFG.flagColors);
document.documentElement.lang = CFG.lang;
document.title = CFG.title;
document.documentElement.style.setProperty('--accent', CFG.accent);
document.documentElement.style.setProperty('--accent2', CFG.accent2);
const $ = s => document.querySelector(s);
const fmt = n => CFG.lang === 'en' ? n.toLocaleString('en-US') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const store = { get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };

// ---------- texts ----------
$('#name').textContent = CFG.name;
$('#crewLabel').textContent = T.crew;
$('#crew').textContent = fmt(CFG.crew);
$('#dayLabel').textContent = `${T.day} ${CFG.day}`;
$('#find').textContent = T.find;
$('#tag').innerHTML = T.tagline;
$('#follow').textContent = T.follow;
$('#follow').href = CFG.instagram;
$('#modalTitle').textContent = T.modalTitle;
$('#handle').placeholder = T.placeholder;
$('#go').textContent = T.go;
$('#modalNote').textContent = T.note;
$('#suitL').textContent = T.suit; $('#visorL').textContent = T.visor; $('#flagL').textContent = T.flag;
$('#dl').textContent = T.download; $('#share').textContent = T.share; $('#close').textContent = T.back;
$('#cabinHint').textContent = T.cabinHint;
$('#next').textContent = T.nextRocket;

// ---------- main 3D ----------
const canvas = $('#scene');
const R = new THREE.WebGLRenderer({ canvas, antialias: true });
R.outputColorSpace = THREE.SRGBColorSpace;
R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
const S = buildStation(CFG);
const cam = S.camera;
function resize(){ const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w/h; cam.fov = w < h ? 55 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let yaw = 0.6, pitch = 0.32, dist = 30, target = new THREE.Vector3(0, 0.5, 0);
let fly = null; // {from:{yaw,pitch,dist,target}, to:{...}, t0, dur}
let dragging = false, lx = 0, ly = 0, idle = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; idle = 0; fly = null; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if(!dragging) return; yaw -= (e.clientX - lx) * 0.006; pitch = Math.max(-0.3, Math.min(1.2, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('wheel', e => { dist = Math.max(10, Math.min(60, dist + e.deltaY * 0.02)); idle = 0; }, { passive: true });
let pinch = null;
canvas.addEventListener('touchmove', e => { if(e.touches.length === 2){ const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if(pinch) dist = Math.max(10, Math.min(60, dist * pinch / d)); pinch = d; } }, { passive: true });
canvas.addEventListener('touchend', () => pinch = null);

const ease = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3) / 2;
function flyTo(to, dur=2.2){ fly = { from: { yaw, pitch, dist, target: target.clone() }, to, t0: clock, dur }; }

// rocket that arrives every 45 s
let nextRocket = 6;
function rocketAt(t){ const u = (t - nextRocket) / 7; S.rocket.visible = u > 0 && u < 1.25; if(!S.rocket.visible){ if(u >= 1.25) nextRocket += 45; return; }
  const k = Math.min(1, u); const e = 1 - Math.pow(1 - k, 3); const dock = S.dockWorld().add(new THREE.Vector3(0, 2.6, 0));
  const p0 = new THREE.Vector3(-30, -20, 10), p1 = new THREE.Vector3(-14, 22, 8);
  const b = (u) => p0.clone().multiplyScalar((1-u)*(1-u)).add(p1.clone().multiplyScalar(2*(1-u)*u)).add(dock.clone().multiplyScalar(u*u));
  const p = b(e), p2 = b(Math.min(1, e + 0.02)); S.rocket.position.copy(p);
  if(e < 0.97){ S.rocket.lookAt(p.clone().add(p2.sub(p))); S.rocket.rotateX(Math.PI/2); }
  const flip = Math.max(0, Math.min(1, (k - 0.7) / 0.3)); if(flip > 0){ const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0)); S.rocket.quaternion.slerp(q2, ease(flip)); }
  S.rocket.scale.setScalar(0.75); S.rocket.userData.flame.visible = k < 1; S.rocket.userData.flame.scale.y = 1 + 0.15*Math.sin(t*40);
  if(u > 1.2) S.rocket.visible = false;
}
setInterval(() => { const s = Math.max(0, Math.round(nextRocket - clock)); $('#nextT').textContent = s > 0 ? `${s}s` : '🚀'; }, 500);

// floating crew around the station (decor)
const decor = []; for(let i = 0; i < Math.min(12, Math.max(1, CFG.crew)); i++){ const a = S.crew[i]; a.visible = true; a.scale.setScalar(0.42); decor.push(a); }

let selectedPod = -1;
let clock = 0, last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; idle += dt;
  S.update(clock); rocketAt(clock);
  decor.forEach((a, i) => { const ang = clock*0.12 + i/decor.length*Math.PI*2; const r = 10 + (i%3)*1.5; a.position.set(Math.cos(ang)*r, 2.5 + Math.sin(clock*0.8 + i)*0.8 + (i%2)*1.2, Math.sin(ang)*r); a.rotation.set(Math.sin(clock + i)*0.3, clock*0.5 + i, 0.2); });
  if(fly){ const u = Math.min(1, (clock - fly.t0) / fly.dur), e = ease(u); yaw = fly.from.yaw + (fly.to.yaw - fly.from.yaw)*e; pitch = fly.from.pitch + (fly.to.pitch - fly.from.pitch)*e; dist = fly.from.dist + (fly.to.dist - fly.from.dist)*e; target.lerpVectors(fly.from.target, fly.to.target, e); if(u >= 1) fly = null; }
  else if(!dragging && idle > 4 && selectedPod < 0) yaw += dt*0.05;
  if(selectedPod >= 0){ const w = S.podWorld(selectedPod); target.lerp(w, 0.08); }
  cam.position.set(target.x + Math.sin(yaw)*Math.cos(pitch)*dist, target.y + Math.sin(pitch)*dist, target.z + Math.cos(yaw)*Math.cos(pitch)*dist);
  cam.lookAt(target);
  S.pods.forEach((p, i) => { p.userData.glow.visible = i === selectedPod; if(i === selectedPod) p.userData.glow.material.opacity = 0.6 + 0.4*Math.sin(clock*4); });
  R.render(S.scene, cam);
  if(cabin && $('#card').classList.contains('open')){ cabin.update(clock); CR.render(cabin.scene, cabin.camera); }
  requestAnimationFrame(loop);
}

// ---------- cabin card ----------
const ccv = $('#cabinCanvas');
const CR = new THREE.WebGLRenderer({ canvas: ccv, antialias: true, preserveDrawingBuffer: true });
CR.outputColorSpace = THREE.SRGBColorSpace; CR.setPixelRatio(1); CR.setSize(720, 720, false);
let cabin = null, me = null;
function chips(el, list, key, render){ el.innerHTML = ''; list.forEach((v, i) => { const b = document.createElement('button'); b.className = 'chip'; render(b, v, i);
  b.onclick = () => { me.look[key] = key === 'flag' ? i : v; store.set('look:' + me.handle, me.look); cabin.setLook(me.look); markChips(); }; el.appendChild(b); }); }
function markChips(){ document.querySelectorAll('#suits .chip').forEach((b,i)=>b.classList.toggle('on', SUITS[i]===me.look.suit)); document.querySelectorAll('#visors .chip').forEach((b,i)=>b.classList.toggle('on', VISORS[i]===me.look.visor)); document.querySelectorAll('#flags .chip').forEach((b,i)=>b.classList.toggle('on', i===me.look.flag)); }
const FLAGS = CFG.flags;
function openCabin(handle){
  handle = handle.trim().replace(/^@+/, '').replace(/\s+/g, '').slice(0, 30); if(!handle) return;
  const c = cabinFor(handle); const look = store.get('look:' + handle) || defaultLook(handle);
  me = { handle, ...c, look };
  store.set('me', handle);
  selectedPod = c.pod; idle = 0;
  const a = Math.atan2(S.podWorld(c.pod).x, S.podWorld(c.pod).z);
  flyTo({ yaw: a, pitch: 0.35, dist: 9, target: S.podWorld(c.pod) }, 2.4);
  $('#modal').classList.remove('open');
  setTimeout(() => {
    if(!cabin) cabin = buildCabin(look, CFG.accent); else cabin.setLook(look);
    $('#cabinNo').textContent = `${T.cabin} ${CFG.prefix}-${String(c.number).padStart(4, '0')}`;
    $('#cabinWho').textContent = '@' + handle;
    chips($('#suits'), SUITS, 'suit', (b, v) => { b.style.background = v; });
    chips($('#visors'), VISORS, 'visor', (b, v) => { b.style.background = v; });
    chips($('#flags'), FLAGS, 'flag', (b, v) => { b.textContent = v; });
    markChips();
    $('#card').classList.add('open');
    history.replaceState(null, '', '?u=' + encodeURIComponent(handle));
  }, 1900);
}
$('#find').onclick = () => { $('#modal').classList.add('open'); const m = store.get('me'); if(m) $('#handle').value = m; setTimeout(() => $('#handle').focus(), 50); };
$('#go').onclick = () => openCabin($('#handle').value);
$('#handle').addEventListener('keydown', e => { if(e.key === 'Enter') openCabin($('#handle').value); });
$('#modal').addEventListener('click', e => { if(e.target.id === 'modal') $('#modal').classList.remove('open'); });
$('#close').onclick = () => { $('#card').classList.remove('open'); selectedPod = -1; flyTo({ yaw, pitch: 0.32, dist: 30, target: new THREE.Vector3(0, 0.5, 0) }, 2); };
$('#share').onclick = async () => { const url = location.origin + location.pathname + '?u=' + encodeURIComponent(me.handle);
  const text = T.shareText.replace('{cabin}', $('#cabinNo').textContent).replace('{name}', CFG.name);
  try { if(navigator.share){ await navigator.share({ title: CFG.name, text, url }); return; } } catch(e){ return; }
  try { await navigator.clipboard.writeText(text + ' ' + url); $('#share').textContent = T.copied; setTimeout(() => $('#share').textContent = T.share, 1600); } catch(e){} };
$('#dl').onclick = () => {
  cabin.update(clock); CR.render(cabin.scene, cabin.camera);
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070a24'); g.addColorStop(1, '#1d2a6e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for(let i = 0; i < 160; i++){ x.fillStyle = `rgba(223,230,255,${(0.3 + (i*37%70)/100).toFixed(2)})`; x.beginPath(); x.arc((i*263)%W, (i*571)%H, 1.5 + (i%3), 0, 7); x.fill(); }
  x.textAlign = 'center'; x.lineJoin = 'round';
  const txt = (s, y, size, col) => { x.font = `900 ${size}px "Inter Display", Inter, system-ui, sans-serif`; x.lineWidth = size*0.18; x.strokeStyle = '#0b0a1f'; x.strokeText(s, W/2, y); x.fillStyle = col; x.fillText(s, W/2, y); };
  txt(CFG.name, 250, 64, CFG.accent2);
  txt(T.storyTitle, 360, 92, '#ffffff');
  x.save(); x.beginPath(); x.roundRect(120, 450, 840, 840, 48); x.clip(); x.drawImage(ccv, 120, 450, 840, 840); x.restore();
  x.lineWidth = 14; x.strokeStyle = '#0b0a1f'; x.beginPath(); x.roundRect(120, 450, 840, 840, 48); x.stroke();
  txt($('#cabinNo').textContent, 1420, 96, '#ffd166');
  txt('@' + me.handle, 1520, 64, '#ffffff');
  txt(T.storyCta, 1680, 50, '#ffffff');
  txt(CFG.handle, 1760, 50, CFG.accent2);
  const a = document.createElement('a'); a.download = `${CFG.prefix}-${me.number}.png`; a.href = c.toDataURL('image/png'); a.click();
};

const u = new URLSearchParams(location.search).get('u');
if(u) setTimeout(() => openCabin(u), 900);
requestAnimationFrame(loop);
