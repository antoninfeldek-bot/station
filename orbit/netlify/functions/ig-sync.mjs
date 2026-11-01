// Runs every 15 minutes: reads follower count + people who commented, adds commenters to the crew.
import { runSync } from '../lib/crew-core.mjs';
export default async () => { try { const r = await runSync(); console.log('ig-sync', JSON.stringify(r)); } catch(e){ console.log('ig-sync error', e.message); } };
export const config = { schedule: '*/15 * * * *' };
