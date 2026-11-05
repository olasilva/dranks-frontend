import { useState } from 'react';
import { api, useLoad, money, dateTime } from './api';
import { BrandLoader } from './Brand';

const statuses = ['processing', 'ready_for_pickup', 'shipped', 'in_transit', 'out_for_delivery', 'completed', 'cancelled'];

export default function Orders() {
  const [data, reload, error, loading] = useLoad('/orders/incoming');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const update = async (orderNo, status) => {
    setBusy(orderNo);
    setMessage('');
    try {
      await api(`/orders/${orderNo}/status`, { method: 'PATCH', body: { status } });
      setMessage(`Order ${orderNo} updated.`);
      await reload();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy('');
    }
  };
  if (!data) return error ? <div className="err">{error}</div> : loading ? <BrandLoader label="Loading incoming orders..." /> : null;
  return (
    <>
      <h2>Incoming orders</h2>
      {message && <p className="note" role="status">{message}</p>}
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th><th>Process</th></tr></thead>
        <tbody>
          {data.orders.map((order) => (
            <tr key={order.orderNo}>
              <td><b>{order.orderNo}</b><small>{order.trackingId}</small></td>
              <td>{order.customer?.name}<small>{order.customer?.phone}</small></td>
              <td>{order.items?.map((item) => `${item.name} x${item.qty}`).join(', ')}</td>
              <td>{money(order.total)}</td>
              <td>{dateTime(order.createdAt)}</td>
              <td><span className="pill pending">{order.status}</span></td>
              <td>
                <select disabled={busy === order.orderNo} value={order.status} onChange={(event) => update(order.orderNo, event.target.value)}>
                  <option value={order.status}>{order.status}</option>
                  {statuses.filter((status) => status !== order.status).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {!data.orders.length && <tr><td colSpan="7" className="empty">No incoming orders.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
