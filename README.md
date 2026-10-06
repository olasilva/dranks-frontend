# Ranktel Collections: Inventory Frontend (React + Vite)

```
npm install
npm run dev              # http://localhost:5173
```
The shared brand mark and loader use `public/ranktel.png`.
In development, `/api` calls are proxied to the backend at http://localhost:5000, so start the backend first.

## Deploy to Vercel

Import this repository into Vercel with the project root as the root directory. The included `vercel.json` builds the Vite app into `dist` and rewrites client-side routes such as `/admin` and `/staff` to the app entry point.

In the Vercel project settings, add these environment variables for Production (and Preview if needed):

- `VITE_API_URL`: the public backend origin, without a trailing slash (for example, `https://api.example.com`). The backend must allow requests from the Vercel deployment origin through CORS.
- `VITE_CURRENCY`: currency code, default `NGN`.

Redeploy after adding or changing environment variables. The backend is not part of this repository and must be deployed separately. For local development, `/api` is proxied to `http://localhost:5000` by Vite.
Currency shown in prices is set with `VITE_CURRENCY` (default NGN).

Sign in with the admin account created in the backend setup. Create staff logins under **Staff**, add items under **Products**.

## Admin activity feed

The admin **Activity & payments** page reads `GET /api/activity` and expects a JSON array with `id`, `created_at`, `staff_name`, `action`, `description` (or `details`), and optional numeric `amount`. The backend must record events for sales/payments and relevant inventory changes (such as product deletion and price updates); the frontend cannot reconstruct deleted or previous values from the current products API. Protect this endpoint for admin users.
