import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import OrderTrackerSteps from '../../components/OrderTrackerSteps';
import './Customer.css';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container section"><p>Loading order…</p></div>;
  if (error) return <div className="container section"><div className="form-error">{error}</div></div>;
  if (!order) return null;

  const canCancel = user?.role === 'customer' && ['Pending', 'Confirmed'].includes(order.status);
  const canPay = user?.role === 'customer' && order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled';

  return (
    <div className="container section">
      <Link to="/dashboard">← Back to my orders</Link>
      <div className="flex-between mt-2">
        <h1 className="mb-0">Order #{order._id.slice(-6).toUpperCase()}</h1>
        <div className="flex gap-1">
          <span className={`badge ${order.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-unpaid'}`}>{order.paymentStatus}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="card mt-2">
        <h2 className="mt-0">Progress</h2>
        <OrderTrackerSteps status={order.status} />
      </div>

      <div className="order-detail-grid">
        <div className="card">
          <h2 className="mt-0">Items</h2>
          <table className="order-items-table">
            <thead>
              <tr><th>Service</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.service}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex-between mt-2">
            <strong>Total</strong>
            <strong>₹{order.totalAmount}</strong>
          </div>

          <h2 className="mt-3">History</h2>
          <ul className="history-list">
            {order.statusHistory.slice().reverse().map((h, idx) => (
              <li key={idx}>
                <strong>{h.status}</strong> — {new Date(h.changedAt).toLocaleString()}
                {h.note ? ` · ${h.note}` : ''}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mt-0">Pickup &amp; delivery</h2>
          <p><strong>Pickup:</strong> {order.pickupAddress}</p>
          <p><strong>Delivery:</strong> {order.deliveryAddress}</p>
          <p><strong>Date &amp; slot:</strong> {new Date(order.pickupDate).toLocaleDateString()} · {order.pickupSlot}</p>
          {order.specialInstructions && <p><strong>Notes:</strong> {order.specialInstructions}</p>}
          <p className="mb-0"><strong>Payment method:</strong> {order.paymentMethod}</p>

          <div className="flex gap-1 mt-3 flex-wrap">
            {canPay && (
              <button className="btn btn-accent" onClick={() => navigate(`/pay/${order._id}`)}>Pay now</button>
            )}
            {canCancel && (
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
