# Demo files (not part of the deployable MERN app)

These two files are standalone previews built for quickly viewing the UI —
they are NOT part of the backend/frontend project and don't need npm install.

- `sudsflow-ui-preview.html` — open directly in any browser. A static,
  click-through mockup of every screen (Home, Services, Book, My Orders,
  Order Tracking, Provider Dashboard, Admin Dashboard) using the same
  CSS design tokens as the real app. No data persists.

- `sudsflow-app.jsx` — a fully interactive React version of the same app,
  wired to real state and persistence (via Claude's artifact storage
  instead of MongoDB). Functionally mirrors the real backend's logic
  (price calculation, order status flow, role-based permissions, payment
  simulation). Meant to be opened as a Claude artifact, not run with
  npm — for that, use the actual `backend/` + `frontend/` in the project
  root, which is the real MERN implementation to submit/deploy.

  Demo logins: demo@customer.com / demo@provider.com / demo@admin.com,
  password "pass123" for all three.
