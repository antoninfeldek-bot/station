# Stations

Two separate websites in one repository:

| Folder | Website | Language |
|---|---|---|
| `orbit/` | ORBIT Station | English |
| `zenit/` | Stanice ZENIT | Czech |

## Deploy on Netlify (once per station)
1. Netlify → **Add new site → Import an existing project → GitHub** → choose this repository.
2. **Base directory:** `orbit` (or `zenit` for the second site). Leave the build command empty.
3. Deploy. Then rename the site in **Site configuration → Change site name**.

Every push to `main` updates both websites automatically.

## Daily update
Edit `orbit/config.json` and `zenit/config.json`:
- `"crew"` = number of followers (crew members)
- `"day"` = day number
- `"instagram"` and `"handle"` = the account link and @name

## ORBIT: live crew (orbit/)
- `netlify/functions/crew.mjs` → `/api/crew` (list, board, change look, admin delete)
- `netlify/functions/ig-sync.mjs` → every 15 min: follower count + people who commented are added to the crew
- Data lives in Netlify Blobs (store `crew`).
- Netlify environment variables: `ADMIN_KEY` (your secret word), `IG_TOKEN` (Instagram long-lived token).
- Admin: open `https://YOUR-SITE/?admin=ADMIN_KEY` once → remove buttons + "Sync Instagram".
