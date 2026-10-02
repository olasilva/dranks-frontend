import { useState } from 'react';
import { api, useLoad, money, time, dateTime } from './api';
import { BrandLoader } from './Brand';

export default function Reports({ admin }) {
  const [rows, reload, err, loading] = useLoad('/reports');
  const [open, setOpen] = useState(null), [d, setD] = useState(null), [comment, setComment] = useState(''), [e2, setE2] = useState('');
  const view = async (id) => {
    if (open === id) return setOpen(null);
    setOpen(id); setD(null); setComment(''); setE2('');
    setD(await api('/reports/' + id));
  };
  const review = async (status) => {
    try { await api('/reports/' + open, { method: 'PATCH', body: { status, admin_comment: comment } }); setOpen(null); reload(); }
    catch (x) { setE2(x.message); }
  };
  return (<>
    <h2>{admin ? 'Staff reports' : 'My reports'}</h2>
    {err && <div className="err">{err}</div>}
    {!rows && loading && <BrandLoader label="Loading reports..." />}
    <table><thead><tr><th>Date</th>{admin && <th>Staff</th>}<th>Items</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
      {rows?.map((r) => (<>
        <tr key={r.id}><td>{r.report_date}</td>{admin && <td>{r.staff_name}</td>}<td>{r.total_items}</td><td>{money(r.total_amount)}</td>
          <td><span className={'pill ' + r.status}>{r.status}</span></td>
          <td><button type="button" className="history-toggle" aria-label={open === r.id ? 'Close report history' : 'View report history'} title={open === r.id ? 'Close report history' : 'View report history'} onClick={() => view(r.id)}><span className="history-icon" aria-hidden="true" /></button></td></tr>
        {open === r.id && <tr key={r.id + 'd'}><td colSpan={admin ? 6 : 5} className="detail">
          {!d ? 'Loading…' : (<>
            {d.note && <p><b>Staff note:</b> {d.note}</p>}
            {d.admin_comment && <p><b>Admin comment:</b> {d.admin_comment}</p>}
            {d.status === 'rejected' && !admin && <p className="note">Rejected sales go back to Today’s record so you can send a corrected report.</p>}
            {d.sales.length > 0 && <table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Total</th></tr></thead><tbody>
              {d.sales.map((s) => <tr key={s.id}><td>{time(s.sold_at)}</td><td>{s.product_name}</td><td>{s.quantity}</td><td>{money(s.total)}</td></tr>)}
            </tbody></table>}
            <small>Sent {dateTime(d.submitted_at)}</small>
            {admin && d.status === 'pending' && <div className="row">
              <input placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="primary" onClick={() => review('approved')}>Approve</button>
              <button className="danger" onClick={() => review('rejected')}>Reject</button>
              {e2 && <div className="err">{e2}</div>}
            </div>}
          </>)}
        </td></tr>}
      </>))}
      {rows?.length === 0 && <tr><td colSpan="6" className="empty">{admin ? 'No reports yet.' : 'You haven’t sent a report yet. Do it from Today’s record.'}</td></tr>}
    </tbody></table>
  </>);
}
