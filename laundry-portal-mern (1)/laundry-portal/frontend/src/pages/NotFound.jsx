import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container section text-center">
    <div className="empty-state">
      <div className="bubble-icon">🫧</div>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  </div>
);

export default NotFound;
