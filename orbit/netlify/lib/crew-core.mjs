// Shared crew logic: roster in Netlify Blobs, Instagram sync.
import { getStore } from '@netlify/blobs';

export const store = () => getStore({ name: 'crew', consistency: 'strong' });
export const env = k => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
export const clean = h => String(h || '').trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
export const valid = h => /^[a-z0-9._]{1,30}$/.test(h) && !h.startsWith('.') && !h.endsWith('.') && !h.includes('..');
export const SUITS_N = 8, VISORS_N = 4, FLAGS_N = 4;

function fnv(str){ let h = 2166136261; for(const c of String(str).toLowerCase()){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function defaultLook(h){ const x = fnv(h || 'x'); return [x % SUITS_N, (x >>> 3) % VISORS_N, (x >>> 6) % FLAGS_N]; }
export function validLook(l){ return Array.isArray(l) && l.length === 3 && [SUITS_N, VISORS_N, FLAGS_N].every((m, i) => Number.isInteger(l[i]) && l[i] >= 0 && l[i] < m); }
export async function sha(s){ const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }

// roster = { next: 1, members: [{ h, n, l:[suit,visor,flag], src:'web'|'ig', t, k? }] }
export async function loadRoster(s){
  const r = await s.getWithMetadata('roster', { type: 'json' });
  return { data: r?.data || { next: 1, members: [] }, etag: r?.etag || null };
}
// read-modify-write with retry (uses conditional writes when the library supports them)
export async function mutate(fn){
  const s = store();
  for(let i = 0; i < 25; i++){
    const { data, etag } = await loadRoster(s);
    const result = await fn(data);
    if(result && result.noWrite) return result;
    const res = await s.setJSON('roster', data, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
    if(!res || res.modified !== false) return result;
    await new Promise(r => setTimeout(r, 40 + Math.random() * (60 + i * 40)));
  }
  throw new Error('busy');
}
export const publicMember = m => [m.h, m.n, ...m.l, m.src === 'ig' && !m.k ? 1 : 0];

// ---------- Instagram sync ----------
const IG = 'https://graph.instagram.com';
async function ig(path, token){ const r = await fetch(`${IG}${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`); const j = await r.json(); if(j.error) throw new Error(j.error.message || 'instagram error'); return j; }

export async function runSync(){
  const s = store();
  const envTok = env('IG_TOKEN');
  if(!envTok) return { ok: false, reason: 'IG_TOKEN is not set' };
  let saved = await s.get('ig-token', { type: 'json' });
  if(!saved || saved.src !== envTok) saved = { t: envTok, at: 0, src: envTok };
  let token = saved.t;
  // long-lived tokens last 60 days; refresh them every 5 days
  if(Date.now() - saved.at > 5 * 864e5){
    try { const r = await ig(`/refresh_access_token?grant_type=ig_refresh_token`, token); if(r.access_token){ token = r.access_token; await s.setJSON('ig-token', { t: token, at: Date.now(), src: envTok }); } }
    catch(e){ /* token may be too new to refresh; keep it */ }
  }
  const me = await ig(`/me?fields=user_id,username,followers_count`, token);
  const own = clean(me.username);
  const media = await ig(`/me/media?fields=id,timestamp&limit=20`, token);
  const names = new Set();
  for(const m of media.data || []){
    let url = `/${m.id}/comments?fields=id,username,text,from&limit=50`; let pages = 0;
    while(url && pages < 40){ const c = await ig(url, token); pages++;
      for(const x of c.data || []){ const h = clean(x.username || x.from?.username); if(h && h !== own && valid(h)) names.add(h); }
      const next = c.paging?.next; url = next ? next.replace(IG, '').replace(/[?&]access_token=[^&]+/, '') : null; }
  }
  let added = [];
  if(names.size){
    added = await mutate(data => { const have = new Set(data.members.map(m => m.h)); const out = [];
      for(const h of names) if(!have.has(h)){ data.members.push({ h, n: data.next++, l: defaultLook(h), src: 'ig', t: Date.now() }); out.push(h); }
      return out.length ? out : { noWrite: true, out };
    });
    if(added.noWrite) added = [];
  }
  await s.setJSON('stats', { followers: me.followers_count ?? null, username: me.username, at: Date.now() });
  return { ok: true, followers: me.followers_count, commenters: names.size, added };
}
