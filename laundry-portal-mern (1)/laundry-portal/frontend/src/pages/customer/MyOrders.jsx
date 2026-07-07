import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import './Customer.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders/mine');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  return (
    <div className="container section">
      <div className="flex-between">
        <h1 className="mb-0">My orders</h1>
        <Link to="/book" className="btn btn-accent btn-sm">Book new pickup</Link>
      </div>

      {loading && <p>Loading your orders…</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && orders.length === 0 && (
        <div className="empty-state">
          <div className="bubble-icon">🧺</div>
          <p>You haven't booked a pickup yet.</p>
          <Link to="/book" className="btn btn-primary">Book your first pickup</Link>
        </div>
      )}

      <div className="orders-list">
        {orders.map((o) => (
          <div className="card order-row" key={o._id}>
            <div className="order-row-left">
              <h3>Order #{o._id.slice(-6).toUpperCase()}</h3>
              <div className="order-row-meta">
                {o.items.length} item{o.items.length > 1 ? 's' : ''} · ₹{o.totalAmount} · Pickup {new Date(o.pickupDate).toLocaleDateString()}
              </div>
            </div>
            <div className="order-row-right">
              <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-unpaid'}`}>{o.paymentStatus}</span>
              <StatusBadge status={o.status} />
              <Link to={`/orders/${o._id}`} className="btn btn-outline btn-sm">View details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
