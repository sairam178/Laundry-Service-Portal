import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../Services.css';
import './Customer.css';

const SLOTS = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];

const BookService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState(SLOTS[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data)).catch((e) => setError(e.message));
  }, []);

  const setQty = (id, qty) => {
    const value = Math.max(0, Number(qty) || 0);
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const selectedItems = services
    .filter((s) => quantities[s._id] > 0)
    .map((s) => ({ serviceId: s._id, name: s.name, price: s.price, unit: s.unit, quantity: quantities[s._id] }));

  const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) return setError('Please select at least one service and quantity.');
    if (!pickupAddress || !deliveryAddress || !pickupDate) return setError('Please fill in address and pickup date.');

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: selectedItems.map(({ serviceId, quantity }) => ({ serviceId, quantity })),
        pickupAddress,
        deliveryAddress,
        pickupDate,
        pickupSlot,
        specialInstructions,
        paymentMethod,
      });
      navigate(`/orders/${data._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section">
      <h1>Book a laundry pickup</h1>
      <p>Choose your services and quantities, then set a pickup slot.</p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="book-layout">
        <div className="card">
          <h2>1. Select services</h2>
          <div className="booking-service-list">
            {services.map((s) => (
              <div className="booking-service-row" key={s._id}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="text-muted service-meta">₹{s.price} / {s.unit === 'per kg' ? 'kg' : 'item'}</div>
                </div>
                <input
                  type="number"
                  min="0"
                  className="form-control qty-input"
                  placeholder="0"
                  value={quantities[s._id] || ''}
                  onChange={(e) => setQty(s._id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <h2 className="mt-3">2. Pickup &amp; delivery</h2>
          <div className="form-group">
            <label htmlFor="pickupAddress">Pickup address</label>
            <input id="pickupAddress" className="form-control" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryAddress">Delivery address</label>
            <input id="deliveryAddress" className="form-control" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupDate">Pickup date</label>
              <input id="pickupDate" type="date" min={today} className="form-control" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="pickupSlot">Pickup time slot</label>
              <select id="pickupSlot" className="form-control" value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
                {SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="instructions">Special instructions (optional)</label>
            <textarea id="instructions" className="form-control" rows="3" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="E.g. use fragrance-free detergent" />
          </div>

          <h2 className="mt-3">3. Payment method</h2>
          <div className="form-group">
            <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="Card">Card (pay after booking)</option>
              <option value="UPI">UPI (pay after booking)</option>
            </select>
            <p className="form-hint">Card/UPI payments are collected on the next screen once your order is placed.</p>
          </div>
        </div>

        <aside className="card summary-card">
          <h2>Order summary</h2>
          {selectedItems.length === 0 && <p className="text-muted">No services selected yet.</p>}
          {selectedItems.map((i) => (
            <div className="summary-row" key={i.serviceId}>
              <span>{i.name} × {i.quantity}</span>
              <span>₹{i.price * i.quantity}</span>
            </div>
          ))}
          <div className="summary-total flex-between">
            <strong>Total</strong>
            <strong>₹{total}</strong>
          </div>
          <button className="btn btn-accent btn-block mt-2" type="submit" disabled={submitting}>
            {submitting ? 'Placing booking…' : 'Confirm booking'}
          </button>
        </aside>
      </form>
    </div>
  );
};

export default BookService;
