import { store, env, clean, valid, validLook, defaultLook, sha, loadRoster, mutate, publicMember, runSync } from '../lib/crew-core.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const isAdmin = (url) => { const a = env('ADMIN_KEY'); return !!a && url.searchParams.get('admin') === a; };

export default async (req, context) => {
  const url = new URL(req.url);
  const s = store();
  try {
    if(req.method === 'GET'){
      const [{ data }, stats] = await Promise.all([loadRoster(s), s.get('stats', { type: 'json' })]);
      return json({ followers: stats?.followers ?? null, synced: stats?.at ?? null, members: data.members.map(publicMember) });
    }
    if(req.method === 'DELETE'){
      if(!isAdmin(url)) return json({ error: 'forbidden' }, 403);
      const h = clean(url.searchParams.get('h'));
      const r = await mutate(d => { const i = d.members.findIndex(m => m.h === h); if(i < 0) return { noWrite: true, removed: false }; d.members.splice(i, 1); return { removed: true }; });
      return json(r);
    }
    if(req.method !== 'POST') return json({ error: 'method' }, 405);
    const body = await req.json().catch(() => ({}));

    if(body.action === 'sync'){
      if(!isAdmin(url)) return json({ error: 'forbidden' }, 403);
      return json(await runSync());
    }
    if(body.action === 'admin'){ return json({ ok: isAdmin(url) }); }

    const h = clean(body.h);
    if(!valid(h)) return json({ error: 'bad_name' }, 400);

    if(body.action === 'join'){
      // max 20 new cabins per IP per day (phones on mobile data often share one IP)
      const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
      const day = new Date().toISOString().slice(0, 10);
      const rk = `rl/${await sha(ip)}`;
      const rl = await s.get(rk, { type: 'json' });
      const used = rl && rl.d === day ? rl.c : 0;
      const admin = isAdmin(url);
      if(used >= 20 && !admin) return json({ error: 'limit' }, 429);
      const key = crypto.randomUUID();
      const k = await sha(key);
      const look = validLook(body.l) ? body.l : defaultLook(h);
      const r = await mutate(d => {
        const m = d.members.find(x => x.h === h);
        if(m && m.k) return { noWrite: true, error: 'taken', member: publicMember(m) };
        if(m){ m.k = k; m.l = look; m.src = 'web'; return { member: publicMember(m), key, claimed: true }; }
        const nm = { h, n: d.next++, l: look, src: 'web', t: Date.now(), k }; d.members.push(nm);
        return { member: publicMember(nm), key };
      });
      if(r.error) return json({ error: r.error, member: r.member }, 409);
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
