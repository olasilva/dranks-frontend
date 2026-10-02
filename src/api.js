import { useState, useEffect, useCallback } from 'react';
const BASE = import.meta.env.VITE_API_URL || '';
export async function api(path, { method = 'GET', body } = {}) {
  const t = localStorage.getItem('token');
  const r = await fetch(BASE + '/api' + path, {
    method, body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(t && { Authorization: 'Bearer ' + t }) },
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && t) { localStorage.clear(); location.href = '/login'; }
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}
export function useLoad(path) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api(path).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return [data, load, error, loading];
}
const cur = new Intl.NumberFormat(undefined, { style: 'currency', currency: import.meta.env.VITE_CURRENCY || 'NGN', maximumFractionDigits: 2 });
export const money = (n) => cur.format(Number(n || 0));
export const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const dateTime = (d) => d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';
