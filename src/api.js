import { useState, useEffect, useCallback } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'https://ranktel-backend.onrender.com';

export async function api(path, { method = 'GET', body } = {}) {
  const t = localStorage.getItem('token');
  const branchId = localStorage.getItem('activeBranchId');

  let url = BASE + '/api' + path;
  let finalBody = body;

  // Inject branch_id for admins managing multiple branches
  if (branchId && branchId !== 'null') {
    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + `branch_id=${branchId}`;
    } else if (finalBody && typeof finalBody === 'object') {
      finalBody = { ...finalBody, branch_id: Number(branchId) };
    }
  }

  const r = await fetch(url, {
    method,
    body: finalBody ? JSON.stringify(finalBody) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(t && { Authorization: 'Bearer ' + t }),
    },
  });

  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && t) {
    localStorage.clear();
    location.href = '/login';
  }
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}

export function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return [data, load, error, loading];
}

const cur = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: import.meta.env.VITE_CURRENCY || 'NGN',
  maximumFractionDigits: 2,
});

export const money = (n) => cur.format(Number(n || 0));
export const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const dateTime = (d) => d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';