import React from 'react';
import './OrderTrackerSteps.css';

// Signature "bubble trail" visual: each completed stage is a filled bubble,
// echoing the suds/wash motif while doubling as a real progress indicator.
const STAGES = [
  'Pending',
  'Confirmed',
  'Picked Up',
  'In Progress',
  'Ready for Delivery',
  'Out for Delivery',
  'Delivered',
];

const OrderTrackerSteps = ({ status }) => {
  if (status === 'Cancelled') {
    return <div className="tracker-cancelled">This booking was cancelled.</div>;
  }

  const currentIndex = STAGES.indexOf(status);

  return (
    <ol className="bubble-trail">
      {STAGES.map((stage, i) => (
        <li key={stage} className={i <= currentIndex ? 'bubble-step done' : 'bubble-step'}>
          <span className="bubble-dot" aria-hidden="true"></span>
          <span className="bubble-label">{stage}</span>
        </li>
      ))}
    </ol>
  );
};

export default OrderTrackerSteps;
