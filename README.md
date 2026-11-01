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
