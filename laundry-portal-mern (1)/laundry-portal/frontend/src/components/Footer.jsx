import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <p className="mb-0">© {new Date().getFullYear()} SudsFlow Laundry Service Booking Portal — B.Tech Mini Project (MERN Stack)</p>
    </div>
  </footer>
);

export default Footer;
