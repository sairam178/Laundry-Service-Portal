import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const STEPS = [
  { title: 'Schedule a pickup', text: 'Pick your services, a pickup slot, and drop your address — takes under a minute.' },
  { title: 'We wash, you relax', text: 'Your laundry is collected, cleaned, and quality-checked by a trusted local provider.' },
  { title: 'Delivered to your door', text: 'Track every stage in real time and pay digitally when it arrives, fresh and folded.' },
];

const CATEGORIES = [
  { name: 'Wash & Fold', blurb: 'Everyday clothes, washed and neatly folded.' },
  { name: 'Dry Cleaning', blurb: 'Suits, blazers and delicate fabrics, handled with care.' },
  { name: 'Ironing', blurb: 'Crisp, wrinkle-free steam pressing.' },
  { name: 'Shoe Cleaning', blurb: 'Deep clean and deodorize sneakers and shoes.' },
];

const Home = () => {
  const { user } = useAuth();
  const bookHref = user && user.role === 'customer' ? '/book' : '/register';

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bubbles" aria-hidden="true">
          <span className="hb hb-1"></span>
          <span className="hb hb-2"></span>
          <span className="hb hb-3"></span>
          <span className="hb hb-4"></span>
        </div>
        <div className="container hero-inner">
          <p className="eyebrow">Pickup &middot; Wash &middot; Deliver</p>
          <h1>Laundry day, off your to-do list.</h1>
          <p className="hero-sub">
            Book a laundry pickup in a minute, track every wash from doorstep to delivery,
            and pay online — all from one simple portal.
          </p>
          <div className="hero-actions">
            <Link to={bookHref} className="btn btn-accent">Book a pickup</Link>
            <Link to="/services" className="btn btn-outline">See services &amp; pricing</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>How it works</h2>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="card step-card" key={step.title}>
              <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="flex-between">
          <h2 className="mb-0">Our services</h2>
          <Link to="/services">View full price list →</Link>
        </div>
        <div className="category-grid mt-2">
          {CATEGORIES.map((c) => (
            <div className="card category-card" key={c.name}>
              <h3>{c.name}</h3>
              <p className="mb-0">{c.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section cta-section">
        <div className="card cta-card">
          <div>
            <h2>Ready to skip laundry day?</h2>
            <p className="mb-0">Create a free account and get your first pickup scheduled today.</p>
          </div>
          <Link to="/register" className="btn btn-primary">Create an account</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
