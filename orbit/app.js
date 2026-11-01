import * as THREE from './lib/three.module.js';
import { buildStation, buildCabin, makeAstronaut, SUITS, VISORS, setFlagColors } from './station.js';

const CFG = await (await fetch('./config.json')).json();
const T = CFG.t;
setFlagColors(CFG.flagColors);
document.documentElement.lang = CFG.lang;
document.title = CFG.title;
document.documentElement.style.setProperty('--accent', CFG.accent);
document.documentElement.style.setProperty('--accent2', CFG.accent2);
const $ = s => document.querySelector(s);
const fmt = n => CFG.lang === 'en' ? n.toLocaleString('en-US') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const store = { get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }, del(k){ try { localStorage.removeItem(k); } catch(e){} } };
const clean = h => String(h || '').trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase().slice(0, 30);
const valid = h => /^[a-z0-9._]{1,30}$/.test(h) && !h.startsWith('.') && !h.endsWith('.') && !h.includes('..');
const cabinName = n => `${T.cabin} ${CFG.prefix}-${String(n).padStart(4, '0')}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

// ---------- admin (open the site once with ?admin=YOUR_KEY) ----------
const qs = new URLSearchParams(location.search);
if(qs.get('admin')){ store.set('admin', qs.get('admin')); qs.delete('admin'); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '')); }
let ADMIN = store.get('admin');

// ---------- crew data from the server ----------
const API = '/api/crew';
const crew = { online: false, followers: null, list: [], by: new Map() };
const toLook = (s, v, f) => ({ suit: SUITS[s] ?? SUITS[0], visor: VISORS[v] ?? VISORS[0], flag: f || 0 });
const fromLook = l => [Math.max(0, SUITS.indexOf(l.suit)), Math.max(0, VISORS.indexOf(l.visor)), l.flag | 0];
function addMember(row){ const [h, n, s, v, f, auto] = row; const m = { h, n, look: toLook(s, v, f), auto: !!auto }; const old = crew.by.get(h); if(old) Object.assign(old, m); else { crew.list.push(m); crew.by.set(h, m); } return crew.by.get(h); }
async function api(method, body, extra = ''){
  const r = await fetch(API + extra, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const j = await r.json().catch(() => ({ error: 'server' })); if(!r.ok && !j.error) j.error = 'server'; return j;
}
try { const j = await api('GET'); if(Array.isArray(j.members)){ crew.online = true; crew.followers = j.followers; j.members.forEach(addMember); } } catch(e){}
if(ADMIN && crew.online){ try { const j = await api('POST', { action: 'admin' }, '?admin=' + encodeURIComponent(ADMIN)); if(!j.ok){ ADMIN = null; store.del('admin'); } } catch(e){} }
const maxN = () => crew.list.reduce((a, m) => Math.max(a, m.n), 0);

// ---------- texts ----------
function updateHud(){
  const count = crew.followers ?? (crew.online ? crew.list.length : CFG.crew);
  $('#crew').textContent = fmt(Math.max(count, crew.list.length));
  $('#aboard').textContent = crew.online ? `${fmt(crew.list.length)} ${T.aboard}` : '';
}
let day = CFG.day;
if(CFG.startDate){ day = Math.max(1, Math.floor((Date.now() - new Date(CFG.startDate + 'T12:00:00').getTime()) / 864e5) + 1); }
$('#name').textContent = CFG.name;
$('#crewLabel').textContent = T.crew;
$('#dayLabel').textContent = `${T.day} ${day}`;
$('#find').textContent = T.find;
$('#tag').innerHTML = T.tagline;
$('#follow').textContent = T.follow;
$('#follow').href = CFG.instagram;
$('#modalTitle').textContent = T.modalTitle;
$('#handle').placeholder = T.placeholder;
$('#modalNote').textContent = T.note;
$('#suitL').textContent = T.suit; $('#visorL').textContent = T.visor;
$('#dl').textContent = T.download; $('#share').textContent = T.share; $('#close').textContent = T.back;
$('#next').textContent = T.nextRocket;
$('#claim').textContent = T.claim; $('#rm').textContent = T.remove; $('#syncBtn').textContent = T.sync;
updateHud();

// ---------- main 3D ----------
const canvas = $('#scene');
const R = new THREE.WebGLRenderer({ canvas, antialias: true });
R.outputColorSpace = THREE.SRGBColorSpace;
R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
let S;
const capacityNeeded = () => Math.max(24, maxN() + 1, crew.followers || 0);
function occupy(){ const taken = new Set(crew.list.map(m => m.n)); S.setOccupied(i => taken.has(i + 1)); }
function build(){
  if(S){ S.scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
  S = buildStation({ ...CFG, capacity: capacityNeeded(), occupied: 0 });
  occupy(); resize(); makeDecor();
}
function resize(){ if(!S) return; const w = innerWidth, h = innerHeight; R.setSize(w, h, false); S.camera.aspect = w/h; S.camera.fov = w < h ? 55 : 40; S.camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
const homeDist = () => Math.min(150, Math.max(30, S.size * (innerWidth < innerHeight ? 3.4 : 2.4)));

let yaw = 0.6, pitch = 0.32, dist = 30, target = new THREE.Vector3(0, 0.5, 0);
let fly = null;
let dragging = false, lx = 0, ly = 0, idle = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; idle = 0; fly = null; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if(!dragging) return; yaw -= (e.clientX - lx) * 0.006; pitch = Math.max(-0.3, Math.min(1.2, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('wheel', e => { dist = Math.max(8, Math.min(170, dist + e.deltaY * 0.02)); idle = 0; }, { passive: true });
let pinch = null;
canvas.addEventListener('touchmove', e => { if(e.touches.length === 2){ const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if(pinch) dist = Math.max(8, Math.min(170, dist * pinch / d)); pinch = d; } }, { passive: true });
canvas.addEventListener('touchend', () => pinch = null);

const ease = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3) / 2;
function flyTo(to, dur=2.2){ fly = { from: { yaw, pitch, dist, target: target.clone() }, to, t0: clock, dur }; }
function goHome(){ selectedPod = -1; flyTo({ yaw, pitch: 0.32, dist: homeDist(), target: new THREE.Vector3(0, 0.5, 0) }, 2); }

// rocket: arrives every 45 s, or right away when someone boards
let nextRocket = 6;
function rocketAt(t){ const u = (t - nextRocket) / 7; S.rocket.visible = u > 0 && u < 1.25; if(!S.rocket.visible){ if(u >= 1.25) nextRocket += 45; return; }
  const k = Math.min(1, u); const e = 1 - Math.pow(1 - k, 3); const dock = S.dockWorld().add(new THREE.Vector3(0, 2.6, 0));
  const p0 = new THREE.Vector3(-30, -20, 10), p1 = new THREE.Vector3(-14, 22 + S.size, 8);
  const b = (u) => p0.clone().multiplyScalar((1-u)*(1-u)).add(p1.clone().multiplyScalar(2*(1-u)*u)).add(dock.clone().multiplyScalar(u*u));
  const p = b(e), p2 = b(Math.min(1, e + 0.02)); S.rocket.position.copy(p);
  if(e < 0.97){ S.rocket.lookAt(p.clone().add(p2.sub(p))); S.rocket.rotateX(Math.PI/2); }
  const flip = Math.max(0, Math.min(1, (k - 0.7) / 0.3)); if(flip > 0){ const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0)); S.rocket.quaternion.slerp(q2, ease(flip)); }
  S.rocket.scale.setScalar(0.75); S.rocket.userData.flame.visible = k < 1; S.rocket.userData.flame.scale.y = 1 + 0.15*Math.sin(t*40);
  if(u > 1.2) S.rocket.visible = false;
}
setInterval(() => { const s = Math.max(0, Math.round(nextRocket - clock)); $('#nextT').textContent = s > 0 ? `${s}s` : '🚀'; }, 500);

// newest crew members float around the station
let decor = [];
function makeDecor(){
  decor.forEach(a => a.parent && a.parent.remove(a)); decor = [];
  const newest = [...crew.list].sort((a, b) => b.n - a.n).slice(0, 12);
  newest.forEach(m => { const a = makeAstronaut(m.look); a.scale.setScalar(0.42); S.scene.add(a); decor.push(a); });
}

let selectedPod = -1;
let clock = 0, last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; idle += dt;
  S.update(clock); rocketAt(clock);
  const rr = S.size + 3;
  decor.forEach((a, i) => { const ang = clock*0.12 + i/decor.length*Math.PI*2; const r = rr + (i%3)*1.5; a.position.set(Math.cos(ang)*r, 2.5 + Math.sin(clock*0.8 + i)*0.8 + (i%2)*1.2, Math.sin(ang)*r); a.rotation.set(Math.sin(clock + i)*0.3, clock*0.5 + i, 0.2); });
  if(fly){ const u = Math.min(1, (clock - fly.t0) / fly.dur), e = ease(u); yaw = fly.from.yaw + (fly.to.yaw - fly.from.yaw)*e; pitch = fly.from.pitch + (fly.to.pitch - fly.from.pitch)*e; dist = fly.from.dist + (fly.to.dist - fly.from.dist)*e; target.lerpVectors(fly.from.target, fly.to.target, e); if(u >= 1) fly = null; }
  else if(!dragging && idle > 4 && selectedPod < 0) yaw += dt*0.05;
  if(selectedPod >= 0){ const w = S.podWorld(selectedPod); target.lerp(w, 0.08); }
  const cam = S.camera;
  cam.position.set(target.x + Math.sin(yaw)*Math.cos(pitch)*dist, target.y + Math.sin(pitch)*dist, target.z + Math.cos(yaw)*Math.cos(pitch)*dist);
  cam.lookAt(target);
  if(S.selGlow.userData.sel !== selectedPod){ S.setSelected(selectedPod); S.selGlow.userData.sel = selectedPod; }
  if(selectedPod >= 0) S.selGlow.material.opacity = 0.6 + 0.4*Math.sin(clock*4);
  R.render(S.scene, cam);
  if(cabin && $('#card').classList.contains('open')){ cabin.update(clock); CR.render(cabin.scene, cabin.camera); }
  requestAnimationFrame(loop);
}

// ---------- search / board modal ----------
const msg = t => { $('#msg').textContent = t || ''; };
function row(m){ return `<button class="res" data-h="${esc(m.h)}"><i style="background:${m.look.suit}"></i>@${esc(m.h)}<em>${CFG.prefix}-${String(m.n).padStart(4,'0')}</em></button>`; }
function renderResults(){
  const q = clean($('#handle').value); let html = '';
  if(!q){ const newest = [...crew.list].sort((a, b) => b.n - a.n).slice(0, 8); if(newest.length) html = `<h4>${T.newest.toUpperCase()}</h4>` + newest.map(row).join(''); }
  else {
    const hits = crew.list.filter(m => m.h.includes(q)).sort((a, b) => (b.h.startsWith(q) - a.h.startsWith(q)) || a.h.length - b.h.length).slice(0, 8);
    html = hits.map(row).join('');
    if(!crew.by.has(q) && valid(q)) html += `<button class="res board" data-board="${esc(q)}">${esc(T.board.replace('{h}', '@' + q))}</button>`;
    if(!hits.length) msg(T.noMatch); else msg('');
  }
  $('#results').innerHTML = html;
}
$('#results').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; if(b.dataset.h) openCabin(crew.by.get(b.dataset.h)); else if(b.dataset.board) board(b.dataset.board); });
$('#handle').addEventListener('input', () => { if(!clean($('#handle').value)) msg(''); renderResults(); });
$('#handle').addEventListener('keydown', e => { if(e.key !== 'Enter') return; const q = clean($('#handle').value); if(crew.by.has(q)) openCabin(crew.by.get(q)); else if(!valid(q)) msg(T.badName); else { renderResults(); msg(T.noMatch); } });
$('#find').onclick = () => { $('#modal').classList.add('open'); msg(''); const m = store.get('me'); $('#handle').value = ''; renderResults(); if(m && crew.by.has(m)) $('#handle').placeholder = '@' + m; setTimeout(() => $('#handle').focus(), 50); };
$('#modal').addEventListener('click', e => { if(e.target.id === 'modal') $('#modal').classList.remove('open'); });

let boarding = false;
async function board(h){
  if(boarding) return; if(!valid(h)){ msg(T.badName); return; }
  if(!crew.online){ msg(T.offline); return; }
  boarding = true; msg(T.boarding);
  const look = fromLook(defaultLookFor(h));
  let j; try { j = await api('POST', { action: 'join', h, l: look }, ADMIN ? '?admin=' + encodeURIComponent(ADMIN) : ''); } catch(e){ j = { error: 'offline' }; }
  boarding = false;
  if(j.error === 'taken'){ const m = addMember(j.member); msg(T.taken.replace('{h}', '@' + h)); setTimeout(() => openCabin(m), 900); return; }
  if(j.error){ msg(j.error === 'limit' ? T.limit : j.error === 'bad_name' ? T.badName : T.offline); return; }
  const m = addMember(j.member); store.set('key:' + m.h, j.key); store.set('me', m.h);
  updateHud();
  if(m.n > S.pods.length) build(); else { occupy(); makeDecor(); }
  nextRocket = clock + 0.3; // rocket brings the new crew member
  openCabin(m, { welcome: true, delay: 3200 });
}
function defaultLookFor(h){ let x = 2166136261; for(const c of h){ x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } x >>>= 0; return { suit: SUITS[x % SUITS.length], visor: VISORS[(x >>> 3) % VISORS.length], flag: (x >>> 6) % 4 }; }

// ---------- cabin card ----------
const ccv = $('#cabinCanvas');
const CR = new THREE.WebGLRenderer({ canvas: ccv, antialias: true, preserveDrawingBuffer: true });
CR.outputColorSpace = THREE.SRGBColorSpace; CR.setPixelRatio(1); CR.setSize(720, 720, false);
let cabin = null, me = null; // me = currently shown member
const mine = m => !!store.get('key:' + m.h);
let saveT = null;
function chips(el, list, key, render){ el.innerHTML = ''; list.forEach((v, i) => { const b = document.createElement('button'); b.className = 'chip'; render(b, v, i);
  b.onclick = () => { if(!mine(me)) return; me.look = { ...me.look, [key]: key === 'flag' ? i : v }; cabin.setLook(me.look); markChips(); makeDecor();
    clearTimeout(saveT); const m = me; saveT = setTimeout(() => api('POST', { action: 'look', h: m.h, key: store.get('key:' + m.h), l: fromLook(m.look) }).catch(() => {}), 700); }; el.appendChild(b); }); }
function markChips(){ document.querySelectorAll('#suits .chip').forEach((b,i)=>b.classList.toggle('on', SUITS[i]===me.look.suit)); document.querySelectorAll('#visors .chip').forEach((b,i)=>b.classList.toggle('on', VISORS[i]===me.look.visor)); }
function openCabin(m, opt = {}){
  if(!m) return;
  me = m; const pod = m.n - 1;
  if(pod >= S.pods.length) build();
  selectedPod = pod; idle = 0;
  const w = S.podWorld(pod); const a = Math.atan2(w.x, w.z);
  flyTo({ yaw: a, pitch: 0.35, dist: 9, target: w }, 2.4);
  $('#modal').classList.remove('open');
  setTimeout(() => {
    if(!cabin) cabin = buildCabin(m.look, CFG.accent); else cabin.setLook(m.look);
    const own = mine(m);
    $('#cabinNo').textContent = cabinName(m.n);
    $('#cabinWho').textContent = '@' + m.h;
    $('#cabinHint').textContent = own ? (opt.welcome ? T.welcome : T.cabinHint) : (m.auto ? T.autoHint : T.friendHint.replace('{h}', '@' + m.h));
    document.querySelectorAll('#card .opt').forEach(o => o.style.display = own ? '' : 'none');
    $('#claim').style.display = !own && m.auto ? '' : 'none';
    $('#rm').style.display = ADMIN ? '' : 'none';
    chips($('#suits'), SUITS, 'suit', (b, v) => { b.style.background = v; });
    chips($('#visors'), VISORS, 'visor', (b, v) => { b.style.background = v; });
    markChips();
    $('#card').classList.add('open');
    history.replaceState(null, '', '?u=' + encodeURIComponent(m.h));
  }, opt.delay || 1900);
}
$('#claim').onclick = () => { $('#card').classList.remove('open'); board(me.h); };
$('#rm').onclick = async () => { if(!ADMIN || !confirm('Remove @' + me.h + '?')) return; const j = await api('DELETE', null, `?h=${encodeURIComponent(me.h)}&admin=${encodeURIComponent(ADMIN)}`);
  if(j.removed){ crew.list = crew.list.filter(x => x !== me); crew.by.delete(me.h); $('#card').classList.remove('open'); occupy(); makeDecor(); updateHud(); goHome(); } };
$('#syncBtn').style.display = ADMIN ? '' : 'none';
$('#syncBtn').onclick = async () => { $('#syncBtn').textContent = '…'; const j = await api('POST', { action: 'sync' }, '?admin=' + encodeURIComponent(ADMIN)); alert(JSON.stringify(j, null, 1)); location.reload(); };
$('#close').onclick = () => { $('#card').classList.remove('open'); history.replaceState(null, '', location.pathname); goHome(); };
$('#share').onclick = async () => { const url = location.origin + location.pathname + '?u=' + encodeURIComponent(me.h);
  const text = T.shareText.replace('{cabin}', cabinName(me.n)).replace('{name}', CFG.name);
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
  txt(cabinName(me.n), 1420, 96, '#ffd166');
  txt('@' + me.h, 1520, 64, '#ffffff');
  txt(T.storyCta, 1680, 50, '#ffffff');
  txt(CFG.handle, 1760, 50, CFG.accent2);
  const a = document.createElement('a'); a.download = `${CFG.prefix}-${me.n}.png`; a.href = c.toDataURL('image/png'); a.click();
};

build(); dist = homeDist();
const u = clean(qs.get('u'));
if(u){ setTimeout(() => { if(crew.by.has(u)) openCabin(crew.by.get(u)); else { $('#find').onclick(); $('#handle').value = u; renderResults(); } }, 900); }
if(qs.has('debug')) window.__R = R;
requestAnimationFrame(loop);
