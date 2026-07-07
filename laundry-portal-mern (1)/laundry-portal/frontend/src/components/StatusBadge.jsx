import React from 'react';

const STATUS_CLASS = {
  Pending: 'badge-pending',
  Confirmed: 'badge-progress',
  'Picked Up': 'badge-progress',
  'In Progress': 'badge-progress',
  'Ready for Delivery': 'badge-progress',
  'Out for Delivery': 'badge-progress',
  Delivered: 'badge-done',
  Cancelled: 'badge-cancelled',
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_CLASS[status] || 'badge-pending'}`}>{status}</span>
);

export default StatusBadge;
