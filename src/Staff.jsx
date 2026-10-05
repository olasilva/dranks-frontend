import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useLoad, money, time } from './api';
import { BrandLoader } from './Brand';

function Card({ p, onSold }) {
  const [qty, setQty] = useState(1), [customer, setCustomer] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const sell = async () => {
    setBusy(true); setMsg('');
    try {
      const sale = await api('/sales', { method: 'POST', body: { product_id: p.id, quantity: qty, customer_name: customer.trim() || null } });
      onSold({ product: p, quantity: Number(qty), customer: customer.trim(), sale });
      setQty(1); setCustomer('');
    }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  return (
    <div className={'product' + (p.stock === 0 ? ' out' : '')}>
      {p.image_url ? <img src={p.image_url} alt="" /> : <div className="ph">{p.name[0]}</div>}
      <h3>{p.name}</h3><small>{p.category}</small>
      <div className="price">{money(p.price)}</div>
      <div className="left">{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</div>
      {p.stock > 0 && <div className="sellrow">
        <input type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
        <button className="primary" disabled={busy || qty > p.stock} onClick={sell}>Mark as sold</button>
      </div>}
      {p.stock > 0 && <input className="customer-name" maxLength="120" aria-label={`Customer name for ${p.name}`} placeholder="Customer name (optional)" value={customer} onChange={(e) => setCustomer(e.target.value)} />}
      {msg && <div className="err">{msg}</div>}
    </div>
  );
}

function ReceiptDialog({ receipt, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (receipt && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!receipt && dialog.current?.open) dialog.current.close();
  }, [receipt]);
  if (!receipt) return null;
  const sale = receipt.sale?.sale || receipt.sale || {};
  const unitPrice = Number(sale.unit_price ?? receipt.product.price);
  const total = Number(sale.total ?? unitPrice * receipt.quantity);
  const soldAt = sale.sold_at || sale.created_at || new Date().toISOString();
  return (
    <dialog ref={dialog} className="receipt-dialog" onCancel={onClose}>
      <div className="receipt-paper">
        <img className="receipt-logo" src="/dranks.jpg" alt="Dranks" />
        <h2>Sales receipt</h2>
        {sale.id && <p>Receipt #{sale.id}</p>}
        <p>{new Date(soldAt).toLocaleString()}</p>
        <p>Customer: {receipt.customer || 'Walk-in customer'}</p>
        <hr />
        <div className="receipt-line"><span>{receipt.product.name} x {receipt.quantity}</span><span>{money(total)}</span></div>
        <small>{money(unitPrice)} each</small>
        <hr />
        <div className="receipt-line receipt-total"><b>Total paid</b><b>{money(total)}</b></div>
        <p className="receipt-thanks">Thank you for shopping with Dranks.</p>
      </div>
      <div className="dialog-actions no-print">
        <button type="button" onClick={onClose}>Close</button>
        <button type="button" className="primary" onClick={() => window.print()}>Print receipt</button>
      </div>
    </dialog>
  );
}

export function Dashboard() {
  const [sales, , err, loading] = useLoad('/sales/today');
  const rows = sales || [];
  const open = rows.filter((sale) => !sale.report_id);
  const sum = (key) => rows.reduce((total, sale) => total + Number(sale[key] || 0), 0);
  return (<>
    <h2>Staff dashboard</h2>
    <div className="dashboard-actions">
      <Link to="/staff/shop">Open shop floor</Link>
      <Link to="/staff/today">Review today’s record</Link>
      <Link to="/staff/reports">View my reports</Link>
    </div>
    {err && <div className="err">{err}</div>}
    <div className="stats">
      <div><span>{sum('quantity')}</span> items sold today</div>
      <div><span>{money(sum('total'))}</span> sales total today</div>
      <div><span>{open.length}</span> sales not yet reported</div>
    </div>
    <h3>Recent sales</h3>
    <table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead><tbody>
      {rows.slice(0, 8).map((sale) => (
        <tr key={sale.id}><td>{time(sale.sold_at)}</td><td>{sale.product_name}</td><td>{sale.quantity}</td><td>{money(sale.total)}</td>
          <td>{sale.report_id ? <span className="pill pending">In a report</span> : 'Unreported'}</td></tr>
      ))}
      {sales && rows.length === 0 && <tr><td colSpan="5" className="empty">No sales today yet.</td></tr>}
      {!sales && loading && <tr><td colSpan="5"><BrandLoader label="Loading today’s sales..." /></td></tr>}
    </tbody></table>
  </>);
}

export function Shop() {
  const [list, reload, err, loading] = useLoad('/products');
  const [receipt, setReceipt] = useState(null);
  return (<>
    <h2>Shop floor</h2>
    {err && <div className="err">{err}</div>}
    {!list && loading && <BrandLoader label="Loading products..." />}
    <div className="grid">{list?.map((p) => <Card key={p.id} p={p} onSold={(sale) => { reload(); setReceipt(sale); }} />)}</div>
    {list?.length === 0 && <p className="empty">No products yet. Your admin will add them.</p>}
    <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
  </>);
}

export function Today() {
  const [sales, reload, err, loading] = useLoad('/sales/today');
  const [receipt, setReceipt] = useState(null);
  const [note, setNote] = useState(''), [msg, setMsg] = useState(''), [e2, setE2] = useState(''), [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const reportDialog = useRef(null);
  const open = sales?.filter((s) => !s.report_id) || [];
  const sum = (a, k) => a.reduce((t, s) => t + Number(s[k]), 0);
  useEffect(() => {
    const dialog = reportDialog.current;
    if (confirmOpen && dialog && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog?.open) dialog.close();
  }, [confirmOpen]);
  const send = async () => {
    setE2(''); setMsg(''); setSubmitting(true);
    try { await api('/reports', { method: 'POST', body: { note } }); setNote(''); setMsg('Report sent to admin for approval.'); setConfirmOpen(false); await reload(); }
    catch (x) { setE2(x.message); }
    finally { setSubmitting(false); }
  };
  return (<>
    <h2>Today’s record</h2>
    <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    {err && <div className="err">{err}</div>}
    {!sales && loading && <BrandLoader label="Loading today’s record..." />}
    <div className="stats">
      <div><span>{sum(sales || [], 'quantity')}</span>items sold today</div>
      <div><span>{money(sum(sales || [], 'total'))}</span>total today</div>
      <div><span>{open.length}</span>sales not yet reported</div>
    </div>
    <table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
      {sales?.map((s) => <tr key={s.id}><td>{time(s.sold_at)}</td><td>{s.product_name}</td><td>{s.quantity}</td><td>{money(s.unit_price)}</td><td>{money(s.total)}</td>
        <td>{s.report_id && <span className="pill pending">In a report</span>}</td><td><button onClick={() => setReceipt({ sale: s, product: { name: s.product_name, price: s.unit_price }, quantity: Number(s.quantity), customer: s.customer_name || '' })}>Receipt</button></td></tr>)}
      {sales?.length === 0 && <tr><td colSpan="7" className="empty">Nothing sold yet. Mark items as sold on the Shop floor and they appear here.</td></tr>}
    </tbody></table>
    <div className="report-submit">
      <button className="primary" disabled={!open.length} onClick={() => { setE2(''); setConfirmOpen(true); }}>Prepare report</button>
      {msg && <span className="ok">{msg}</span>}{e2 && <div className="err">{e2}</div>}
    </div>
    <dialog ref={reportDialog} className="report-dialog" onCancel={() => setConfirmOpen(false)}>
      <h3 id="report-dialog-title">Submit report to admin?</h3>
      <p>This report includes {sum(open, 'quantity')} items across {open.length} sales, totaling {money(sum(open, 'total'))}.</p>
      <ul className="report-items">{open.map((sale) => <li key={sale.id}><span>{sale.product_name} x {sale.quantity}</span><b>{money(sale.total)}</b></li>)}</ul>
      <label htmlFor="report-note">Note for the admin (optional)</label>
      <textarea id="report-note" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="dialog-actions">
        <button type="button" disabled={submitting} onClick={() => setConfirmOpen(false)}>Cancel</button>
        <button type="button" className="primary" disabled={submitting || !open.length} onClick={send}>{submitting ? 'Sending report...' : 'Submit report'}</button>
      </div>
    </dialog>
  </>);
}
