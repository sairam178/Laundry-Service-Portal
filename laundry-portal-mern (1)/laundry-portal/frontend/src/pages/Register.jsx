import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '', role: 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      navigate(data.role === 'provider' ? '/provider' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p>Book pickups, track orders, and pay online in one place.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" className="form-control" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength={6} className="form-control" value={form.password} onChange={handleChange} required />
            <p className="form-hint">At least 6 characters.</p>
          </div>
          <div className="form-group">
            <label htmlFor="address">Default address (optional)</label>
            <input id="address" name="address" className="form-control" value={form.address} onChange={handleChange} placeholder="House no, street, city" />
          </div>
          <div className="form-group">
            <label htmlFor="role">I am registering as</label>
            <select id="role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="customer">Customer — I want laundry picked up</option>
              <option value="provider">Service provider — I fulfill laundry orders</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
