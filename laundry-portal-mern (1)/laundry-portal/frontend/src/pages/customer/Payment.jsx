import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './Customer.css';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('Card');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data)).catch((e) => setError(e.message));
  }, [orderId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setPaying(true);
    try {
      // Simulated gateway — in production this would redirect to Razorpay/Stripe checkout.
      await api.post(`/payments/${orderId}`, { method });
      setSuccess(true);
      setTimeout(() => navigate(`/orders/${orderId}`, { replace: true }), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (!order && !error) return <div className="container section"><p>Loading…</p></div>;

  return (
    <div className="auth-page container">
      <div className="card auth-card">
        <h1>Complete payment</h1>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">Payment successful! Redirecting…</div>}

        {order && !success && (
          <>
            <p>Order #{order._id.slice(-6).toUpperCase()} · Total due</p>
            <h2 className="mt-0">₹{order.totalAmount}</h2>

            <form onSubmit={handlePay}>
              <div className="form-group">
                <label htmlFor="method">Payment method</label>
                <select id="method" className="form-control" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              {method === 'Card' && (
                <div className="form-row">
                  <div className="form-group"><label>Card number</label><input className="form-control" placeholder="4242 4242 4242 4242" required /></div>
                  <div className="form-group"><label>Expiry</label><input className="form-control" placeholder="MM/YY" required /></div>
                </div>
              )}
              {method === 'UPI' && (
                <div className="form-group"><label>UPI ID</label><input className="form-control" placeholder="yourname@upi" required /></div>
              )}

              <p className="form-hint">This is a simulated payment for demo purposes — no real transaction is made.</p>
              <button className="btn btn-accent btn-block" type="submit" disabled={paying}>
                {paying ? 'Processing…' : `Pay ₹${order.totalAmount}`}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch"><Link to={`/orders/${orderId}`}>← Back to order</Link></p>
      </div>
    </div>
  );
};

export default Payment;
