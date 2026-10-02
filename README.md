# Dranks: Inventory Frontend (React + Vite)

```
npm install
npm run dev              # http://localhost:5173
```
The shared brand mark and loader use `public/dranks.jpg`.
In development, `/api` calls are proxied to the backend at http://localhost:5000, so start the backend first.

## Deploy to Vercel

Import this repository into Vercel with the project root as the root directory. The included `vercel.json` builds the Vite app into `dist` and rewrites client-side routes such as `/admin` and `/staff` to the app entry point.

In the Vercel project settings, add these environment variables for Production (and Preview if needed):

- `VITE_API_URL`: the public backend origin, without a trailing slash (for example, `https://api.example.com`). The backend must allow requests from the Vercel deployment origin through CORS.
- `VITE_CURRENCY`: currency code, default `NGN`.

Redeploy after adding or changing environment variables. The backend is not part of this repository and must be deployed separately. For local development, `/api` is proxied to `http://localhost:5000` by Vite.
Currency shown in prices is set with `VITE_CURRENCY` (default NGN).

Sign in with the admin account created in the backend setup. Create staff logins under **Staff**, add items under **Products**.
