import { useState } from 'react';
import { api, useLoad, money, dateTime, time } from './api';
import { BrandLoader } from './Brand';

const Err = ({ e }) => e ? <div className="err">{e}</div> : null;
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function readImageFile(file) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Choose an image file.'));
  if (file.size > IMAGE_MAX_BYTES) return Promise.reject(new Error('Images must be 2 MB or smaller.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
}

export function Overview() {
  const [s, , err, loading] = useLoad('/stats');
  if (!s) return err ? <Err e={err} /> : loading ? <BrandLoader label="Loading dashboard..." /> : null;
  return (<>
    <h2>Today at a glance</h2>
    <div className="stats">
      <div><span>{s.items}</span>items sold</div>
      <div><span>{money(s.revenue)}</span>revenue</div>
      <div><span>{s.pending}</span>reports awaiting review</div>
      <div><span>{s.low.length}</span>products low on stock</div>
    </div>
    {s.low.length > 0 && <p className="note">Low stock: {s.low.map((p) => `${p.name} (${p.stock})`).join(', ')}</p>}
    <h3>Sales today</h3>
    <table><thead><tr><th>Time</th><th>Product</th><th>Staff</th><th>Qty</th><th>Total</th></tr></thead><tbody>
      {s.sales.map((x) => <tr key={x.id}><td>{time(x.sold_at)}</td><td>{x.product_name}</td><td>{x.staff_name}</td><td>{x.quantity}</td><td>{money(x.total)}</td></tr>)}
      {!s.sales.length && <tr><td colSpan="5" className="empty">No sales yet today.</td></tr>}
    </tbody></table>
  </>);
}

function ProductRow({ p, reload }) {
  const [price, setPrice] = useState(p.price), [stock, setStock] = useState(p.stock), [err, setErr] = useState('');
  const [imageUrl, setImageUrl] = useState(p.image_url || '');
  const run = async (fn) => { try { await fn(); reload(); } catch (e) { setErr(e.message); } };
  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { setErr(''); setImageUrl(await readImageFile(file)); }
    catch (e) { setErr(e.message); }
    event.target.value = '';
  };
  return (
    <tr>
      <td>{imageUrl && <img className="thumb" src={imageUrl} alt={`${p.name} preview`} />}</td>
      <td><b>{p.name}</b><small>{p.category}</small><input className="image-url" type="url" aria-label={`Image URL for ${p.name}`} placeholder="Product image URL" value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={(e) => setImageUrl(e.target.value)} /><input className="image-file" type="file" accept="image/*" aria-label={`Upload image for ${p.name}`} onChange={chooseImage} /></td>
      <td><input className="sm" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></td>
      <td><input className="sm" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></td>
      <td className="actions">
        <button onClick={() => run(() => api('/products/' + p.id, { method: 'PUT', body: { price: +price, stock: +stock, image_url: imageUrl || null } }))}>Save</button>
        <button className="danger" onClick={() => confirm(`Remove ${p.name}?`) && run(() => api('/products/' + p.id, { method: 'DELETE' }))}>Remove</button>
        <Err e={err} />
      </td>
    </tr>
  );
}

export function Products() {
  const [list, reload, loadErr, loading] = useLoad('/products');
  const blank = { name: '', category: '', price: '', stock: '', image_url: '' };
  const [f, setF] = useState(blank), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { setErr(''); const imageUrl = await readImageFile(file); setF((current) => ({ ...current, image_url: imageUrl })); }
    catch (x) { setErr(x.message); }
    event.target.value = '';
  };
  const add = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/products', { method: 'POST', body: { ...f, price: +f.price, stock: +f.stock || 0, image_url: f.image_url || null } }); setF(blank); reload(); }
    catch (x) { setErr(x.message); }
  };
  return (<>
    <h2>Products</h2>
    <form className="row card" onSubmit={add}>
      <input required placeholder="Product name" value={f.name} onChange={set('name')} />
      <input placeholder="Category (e.g. Dresses)" value={f.category} onChange={set('category')} />
      <input required type="number" min="0" step="0.01" placeholder="Price" value={f.price} onChange={set('price')} />
      <input required type="number" min="0" placeholder="Quantity" value={f.stock} onChange={set('stock')} />
      <input type="url" aria-label="Product image URL" placeholder="Product image URL (optional)" value={f.image_url.startsWith('data:') ? '' : f.image_url} onChange={set('image_url')} />
      <label className="upload-label">Or upload image<input className="image-file" type="file" accept="image/*" aria-label="Upload product image" onChange={chooseImage} /></label>
      {f.image_url.startsWith('data:') && <img className="thumb upload-preview" src={f.image_url} alt="Selected product preview" />}
      <button className="primary">Add product</button><Err e={err} />
    </form>
    {loadErr && <Err e={loadErr} />}
    {!list && loading && <BrandLoader label="Loading products..." />}
    <table><thead><tr><th></th><th>Product</th><th>Price</th><th>In stock</th><th></th></tr></thead><tbody>
      {list?.map((p) => <ProductRow key={p.id + p.price + p.stock} p={p} reload={reload} />)}
      {list?.length === 0 && <tr><td colSpan="5" className="empty">Add your first product above. Staff see it right away.</td></tr>}
    </tbody></table>
  </>);
}

export function Staff() {
  const [list, reload, loadErr, loading] = useLoad('/staff');
  const blank = { full_name: '', email: '', password: '' };
  const [f, setF] = useState(blank), [err, setErr] = useState(''), [notice, setNotice] = useState(''), [creating, setCreating] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault(); setErr(''); setNotice(''); setCreating(true);
    try {
      const result = await api('/staff', { method: 'POST', body: f });
      setNotice(result.email_sent ? `Staff account created and welcome email sent to ${f.email}.` : `Staff account created, but the welcome email was not sent. ${result.email_message || ''}`);
      setF(blank); reload();
    } catch (x) { setErr(x.message); }
    finally { setCreating(false); }
  };
  const patch = (id, body) => api('/staff/' + id, { method: 'PATCH', body }).then(reload).catch((x) => setErr(x.message));
  return (<>
    <h2>Staff accounts</h2>
    <form className="row card" onSubmit={add}>
      <input required placeholder="Full name" value={f.full_name} onChange={set('full_name')} />
      <input required type="email" placeholder="Email" value={f.email} onChange={set('email')} />
      <input required type="password" autoComplete="new-password" minLength="6" placeholder="Password (6+ characters; emailed to staff)" value={f.password} onChange={set('password')} />
      <button className="primary" disabled={creating}>{creating ? 'Creating account...' : 'Create staff login'}</button><Err e={err} />
    </form>
    {notice && <p className="note" role="status">{notice}</p>}
    {loadErr && <Err e={loadErr} />}
    {!list && loading && <BrandLoader label="Loading staff..." />}
    <table><thead><tr><th>Name</th><th>Email</th><th>Last login</th><th>Status</th><th></th></tr></thead><tbody>
      {list?.map((s) => (
        <tr key={s.id}><td><b>{s.full_name}</b></td><td>{s.email}</td><td>{dateTime(s.last_login)}</td>
          <td><span className={'pill ' + (s.active ? 'approved' : 'rejected')}>{s.active ? 'Active' : 'Disabled'}</span></td>
          <td className="actions">
            <button onClick={() => patch(s.id, { active: !s.active })}>{s.active ? 'Disable' : 'Enable'}</button>
            <button onClick={() => { const p = prompt('New password for ' + s.full_name + ' (6+ characters)'); p && patch(s.id, { password: p }); }}>Reset password</button>
          </td></tr>))}
      {list?.length === 0 && <tr><td colSpan="5" className="empty">No staff yet. Create a login above and share the details with them.</td></tr>}
    </tbody></table>
  </>);
}

export function Logins() {
  const [list, reload, loadErr, loading] = useLoad('/logins');
  return (<>
    <h2>Login activity <button onClick={reload}>Refresh</button></h2>
    {loadErr && <Err e={loadErr} />}
    {!list && loading && <BrandLoader label="Loading login activity..." />}
    <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Signed in</th></tr></thead><tbody>
      {list?.map((l) => <tr key={l.id}><td><b>{l.full_name}</b></td><td>{l.email}</td><td>{l.role}</td><td>{dateTime(l.logged_in_at)}</td></tr>)}
      {list?.length === 0 && <tr><td colSpan="4" className="empty">No logins recorded yet.</td></tr>}
    </tbody></table>
  </>);
}

export function Activity() {
  const [list, reload, loadErr, loading] = useLoad('/activity');
  return (<>
    <h2>Staff activity &amp; payments <button onClick={reload}>Refresh</button></h2>
    {loadErr && <Err e={loadErr} />}
    {!list && loading && <BrandLoader label="Loading staff activity..." />}
    <table><thead><tr><th>Date</th><th>Staff</th><th>Activity</th><th>Details</th><th>Amount</th></tr></thead><tbody>
      {list?.map((item) => <tr key={item.id}><td>{dateTime(item.created_at)}</td><td>{item.staff_name || '—'}</td><td>{item.action}</td><td>{item.description || item.details || '—'}</td><td>{item.amount == null ? '—' : money(item.amount)}</td></tr>)}
      {list?.length === 0 && <tr><td colSpan="5" className="empty">No activity recorded yet.</td></tr>}
    </tbody></table>
  </>);
}
