import { useState } from 'react';
import { api, useLoad, money } from './api';
import { BrandLoader } from './Brand';

const Err = ({ e }) => (e ? <div className="err">{e}</div> : null);

export function BranchAdmin() {
  const [summary, reloadSummary, sumErr, sumLoading] = useLoad('/branches/summary');
  const [staff, reloadStaff, staffErr, staffLoading] = useLoad('/staff/all');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const assign = async (staffId, branchId) => {
    setMsg('');
    setBusy(true);
    try {
      await api('/staff/' + staffId, {
        method: 'PATCH',
        body: { branch_id: branchId === '' ? null : Number(branchId) },
      });
      setMsg('Branch assignment saved.');
      reloadStaff();
      reloadSummary();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!summary)
    return sumErr ? <Err e={sumErr} /> : sumLoading ? <BrandLoader label="Loading branches..." /> : null;

  return (
    <>
      <h2>Shop branches</h2>
      {msg && <p className="note" role="status">{msg}</p>}

      <div className="stats">
        {summary.map((b) => (
          <div key={b.id}>
            <span>{b.name}</span>
            {b.staff} staff · {b.products} products · {money(b.revenue_today)} today
          </div>
        ))}
      </div>

      <h3>Assign staff to a branch</h3>
      {staffErr && <Err e={staffErr} />}
      {!staff && staffLoading && <BrandLoader label="Loading staff..." />}
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Email</th>
            <th>Branch</th>
          </tr>
        </thead>
        <tbody>
          {staff?.map((s) => (
            <tr key={s.id}>
              <td><b>{s.full_name}</b></td>
              <td>{s.email}</td>
              <td>
                <select
                  value={s.branch_id || ''}
                  disabled={busy}
                  onChange={(e) => assign(s.id, e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {summary.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {!staff?.length && (
            <tr>
              <td colSpan="3" className="empty">
                No staff accounts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}