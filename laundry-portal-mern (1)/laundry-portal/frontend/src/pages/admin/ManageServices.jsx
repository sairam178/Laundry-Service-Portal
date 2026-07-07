import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Admin.css';

const emptyForm = { name: '', category: 'Wash & Fold', unit: 'per kg', price: '', description: '', estimatedTurnaroundHours: 24 };

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const { data } = await api.get('/services?all=true');
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), estimatedTurnaroundHours: Number(form.estimatedTurnaroundHours) };
      if (editingId) {
        const { data } = await api.put(`/services/${editingId}`, payload);
        setServices((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      } else {
        const { data } = await api.post('/services', payload);
        setServices((prev) => [...prev, data]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm({ name: s.name, category: s.category, unit: s.unit, price: s.price, description: s.description, estimatedTurnaroundHours: s.estimatedTurnaroundHours });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this service? This cannot be undone.')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (s) => {
    try {
      const { data } = await api.put(`/services/${s._id}`, { isActive: !s.isActive });
      setServices((prev) => prev.map((x) => (x._id === data._id ? data : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <Link to="/admin">← Back to dashboard</Link>
      <h1 className="mt-2">Manage services</h1>
      {error && <div className="form-error">{error}</div>}

      <div className="order-detail-grid">
        <div className="card">
          <h2 className="mt-0">All services</h2>
          {loading && <p>Loading…</p>}
          {!loading && services.map((s) => (
            <div className="service-manage-row" key={s._id}>
              <div>
                <strong>{s.name}</strong> {!s.isActive && <span className="badge badge-cancelled">Inactive</span>}
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{s.category} · ₹{s.price} / {s.unit === 'per kg' ? 'kg' : 'item'}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="mt-0">{editingId ? 'Edit service' : 'Add new service'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Service name</label>
              <input id="name" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" className="form-control" value={form.category} onChange={handleChange}>
                {['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Shoe Cleaning', 'Bedding & Linen'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="unit">Unit</label>
                <select id="unit" name="unit" className="form-control" value={form.unit} onChange={handleChange}>
                  <option value="per kg">Per kg</option>
                  <option value="per item">Per item</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (₹)</label>
                <input id="price" name="price" type="number" min="0" className="form-control" value={form.price} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="estimatedTurnaroundHours">Turnaround (hours)</label>
              <input id="estimatedTurnaroundHours" name="estimatedTurnaroundHours" type="number" min="1" className="form-control" value={form.estimatedTurnaroundHours} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="3" className="form-control" value={form.description} onChange={handleChange} />
            </div>
            <div className="flex gap-1">
              <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Add service'}</button>
              {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageServices;
