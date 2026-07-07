import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import './Provider.css';

const NEXT_STATUS = {
  Pending: 'Confirmed',
  Confirmed: 'Picked Up',
  'Picked Up': 'In Progress',
  'In Progress': 'Ready for Delivery',
  'Ready for Delivery': 'Out for Delivery',
  'Out for Delivery': 'Delivered',
};

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('active');

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order._id);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status: next, note: `Marked as ${next} by ${user.name}` });
      setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleOrders = orders.filter((o) => {
    if (filter === 'active') return !['Delivered', 'Cancelled'].includes(o.status);
    if (filter === 'mine') return o.assignedProvider?._id === user._id || o.assignedProvider === user._id;
    return true;
  });

  return (
    <div className="container section">
      <h1>Provider dashboard</h1>
      <p>Pick up unassigned orders and move active jobs through each stage.</p>

      <div className="flex gap-1 mb-tabs">
        <button className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('active')}>Active orders</button>
        <button className={`btn btn-sm ${filter === 'mine' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('mine')}>My assigned</button>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
      </div>

      {loading && <p>Loading orders…</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && visibleOrders.length === 0 && (
        <div className="empty-state">
          <div className="bubble-icon">🫧</div>
          <p>No orders in this view right now.</p>
        </div>
      )}

      <div className="provider-order-list">
        {visibleOrders.map((o) => (
          <div className="card provider-order-card" key={o._id}>
            <div className="flex-between">
              <h3 className="mb-0">Order #{o._id.slice(-6).toUpperCase()}</h3>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-muted provider-meta">
              Customer: {o.customer?.name} ({o.customer?.phone}) · Pickup {new Date(o.pickupDate).toLocaleDateString()} · {o.pickupSlot}
            </p>
            <p className="text-muted provider-meta">Pickup at: {o.pickupAddress}</p>
            <p className="text-muted provider-meta mb-0">
              {o.items.length} item{o.items.length > 1 ? 's' : ''} · ₹{o.totalAmount} · {o.paymentStatus}
              {o.assignedProvider ? ` · Assigned to ${o.assignedProvider.name || 'you'}` : ' · Unassigned'}
            </p>

            {NEXT_STATUS[o.status] && (
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => advanceStatus(o)}
                disabled={updatingId === o._id}
              >
                {updatingId === o._id ? 'Updating…' : `Mark as "${NEXT_STATUS[o.status]}"`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;
