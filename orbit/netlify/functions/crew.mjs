import { store, env, isAdminKey, clean, valid, validLook, defaultLook, sha, loadRoster, mutate, publicMember, runSync } from '../lib/crew-core.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });


export default async (req, context) => {
  const url = new URL(req.url);
  const s = store();
  const admin = await isAdminKey(url.searchParams.get('admin'));
  try {
    if(req.method === 'GET'){
      const [{ data }, stats] = await Promise.all([loadRoster(s), s.get('stats', { type: 'json' })]);
      const out = { followers: stats?.followers ?? null, synced: stats?.at ?? null, members: data.members.map(publicMember) };
      if(admin) out.admin = { info: Object.fromEntries(data.members.map(m => [m.h, [m.src, m.t || 0, m.k ? 1 : 0]])), banned: data.banned || [] };
      return json(out);
    }
    if(req.method === 'DELETE'){
      if(!admin) return json({ error: 'forbidden' }, 403);
      const h = clean(url.searchParams.get('h')); const ban = url.searchParams.get('ban') !== '0';
      const r = await mutate(d => { const i = d.members.findIndex(m => m.h === h); if(i >= 0) d.members.splice(i, 1);
        d.banned = d.banned || []; if(ban && !d.banned.includes(h)) d.banned.push(h);
        if(i < 0 && !ban) return { noWrite: true, removed: false }; return { removed: i >= 0, banned: ban }; });
      return json(r);
    }
    if(req.method !== 'POST') return json({ error: 'method' }, 405);
    const body = await req.json().catch(() => ({}));

    if(body.action === 'sync'){
      if(!admin) return json({ error: 'forbidden' }, 403);
      return json(await runSync());
    }
    if(body.action === 'admin'){ return json({ ok: admin }); }
    if(body.action === 'unban'){
      if(!admin) return json({ error: 'forbidden' }, 403);
      const h = clean(body.h);
      return json(await mutate(d => { d.banned = (d.banned || []).filter(x => x !== h); return { ok: true }; }));
    }

    const h = clean(body.h);
    if(!valid(h)) return json({ error: 'bad_name' }, 400);

    if(body.action === 'join'){
      // max 20 new cabins per IP per day (phones on mobile data often share one IP)
      const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
      const day = new Date().toISOString().slice(0, 10);
      const rk = `rl/${await sha(ip)}`;
      const rl = await s.get(rk, { type: 'json' });
      const used = rl && rl.d === day ? rl.c : 0;
      if(used >= 20 && !admin) return json({ error: 'limit' }, 429);
      const key = crypto.randomUUID();
      const k = await sha(key);
      const look = validLook(body.l) ? body.l : defaultLook(h);
      const r = await mutate(d => {
        if((d.banned || []).includes(h)){ if(!admin) return { noWrite: true, error: 'banned' }; d.banned = d.banned.filter(x => x !== h); }
        const m = d.members.find(x => x.h === h);
        if(m && m.k) return { noWrite: true, error: 'taken', member: publicMember(m) };
        if(m){ m.k = k; m.l = look; m.src = 'web'; return { member: publicMember(m), key, claimed: true }; }
        const nm = { h, n: d.next++, l: look, src: 'web', t: Date.now(), k }; d.members.push(nm);
        return { member: publicMember(nm), key };
      });
      if(r.error) return json({ error: r.error, member: r.member }, r.error === 'banned' ? 403 : 409);
      if(!admin) await s.setJSON(rk, { d: day, c: used + 1 });
      return json(r);
    }
    if(body.action === 'look'){
      if(!validLook(body.l) || !body.key) return json({ error: 'bad' }, 400);
      const k = await sha(String(body.key));
      const r = await mutate(d => { const m = d.members.find(x => x.h === h); if(!m || m.k !== k) return { noWrite: true, error: 'forbidden' }; m.l = body.l; return { member: publicMember(m) }; });
      return json(r, r.error ? 403 : 200);
    }
    return json({ error: 'unknown' }, 400);
  } catch(e){
    return json({ error: 'server', detail: String(e && e.message || e) }, 500);
  }
};

export const config = { path: '/api/crew' };
