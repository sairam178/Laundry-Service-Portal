import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/services');
        setServices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = services.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="container section">
      <h1>Services &amp; pricing</h1>
      <p>Transparent per-kg and per-item pricing — no hidden charges.</p>

      {loading && <p>Loading services…</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <div className="empty-state">
          <div className="bubble-icon">🫧</div>
          <p>No services are available right now. Please check back soon.</p>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="service-category">
          <h2>{category}</h2>
          <div className="service-grid">
            {items.map((s) => (
              <div className="card service-card" key={s._id}>
                <div className="flex-between">
                  <h3 className="mb-0">{s.name}</h3>
                  <span className="service-price">₹{s.price}<span className="text-muted"> / {s.unit === 'per kg' ? 'kg' : 'item'}</span></span>
                </div>
                <p>{s.description}</p>
                <p className="text-muted mb-0">Ready in ~{s.estimatedTurnaroundHours}h</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center mt-3">
        <Link to="/book" className="btn btn-accent">Book a pickup</Link>
      </div>
    </div>
  );
};

export default Services;
