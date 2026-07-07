import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const dashboardPathFor = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'provider') return '/provider';
  return '/dashboard';
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-bubble" aria-hidden="true"></span>
          SudsFlow
        </Link>

        <nav className="navbar-links">
          {!user && (
            <>
              <Link to="/services">Services</Link>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-accent btn-sm">Get started</Link>
            </>
          )}

          {user && user.role === 'customer' && (
            <>
              <Link to="/services">Services</Link>
              <Link to="/book">Book pickup</Link>
              <Link to="/dashboard">My orders</Link>
            </>
          )}

          {user && user.role === 'provider' && <Link to="/provider">Provider dashboard</Link>}
          {user && user.role === 'admin' && <Link to="/admin">Admin dashboard</Link>}

          {user && (
            <div className="navbar-user">
              <Link to={dashboardPathFor(user.role)} className="navbar-name">Hi, {user.name.split(' ')[0]}</Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
