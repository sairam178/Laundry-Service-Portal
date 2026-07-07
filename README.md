# SudsFlow — Laundry Service Booking Portal (MERN Stack)

A full-stack web platform for booking laundry pickup and delivery services online.
Customers place bookings, track order status in real time, and pay digitally.
Service providers manage and update the orders assigned to them. Admins manage
the service catalog and monitor all orders and revenue.

Built with **M**ongoDB, **E**xpress.js, **R**eact, **N**ode.js.

---

## 1. Features

**Customer**
- Register / log in (JWT authentication)
- Browse services and pricing by category
- Book a pickup: select services + quantities, pickup/delivery address, date & time slot
- View order history and live order-status tracker (bubble-trail timeline)
- Pay online (simulated Card/UPI) or Cash on Delivery
- Cancel a booking while it's still pending/confirmed

**Service Provider**
- View unassigned and assigned orders
- Self-assign an order and advance it through each stage:
  Pending → Confirmed → Picked Up → In Progress → Ready for Delivery → Out for Delivery → Delivered

**Admin**
- Dashboard with order counts and revenue collected
- Full order list across all customers
- Add / edit / activate / deactivate / delete services (CRUD)

---

## 2. Tech stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React 18, React Router v6, Axios, plain CSS   |
| Backend    | Node.js, Express.js                           |
| Database   | MongoDB with Mongoose ODM                     |
| Auth       | JSON Web Tokens (JWT) + bcrypt password hashing |

---

## 3. Project structure

```
laundry-portal/
├── backend/
│   ├── config/db.js              MongoDB connection
│   ├── models/                   User, Service, Order schemas
│   ├── controllers/              Request handlers (auth, service, order, payment)
│   ├── routes/                   Express route definitions
│   ├── middleware/                JWT auth guard, role-based authorize(), error handlers
│   ├── utils/                    generateToken.js, seedServices.js
│   ├── server.js                 App entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/           Navbar, Footer, PrivateRoute, StatusBadge, OrderTrackerSteps
    │   ├── pages/                Home, Login, Register, Services, NotFound
    │   │   ├── customer/         BookService, MyOrders, OrderDetail, Payment
    │   │   ├── provider/         ProviderDashboard
    │   │   └── admin/            AdminDashboard, ManageServices
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js       Axios instance with JWT interceptor
    │   └── styles/index.css      Design tokens & shared styles
    └── .env.example
```

---

## 4. Getting started

### Prerequisites
- Node.js v18+
- npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

### Backend setup
```bash
cd backend
npm install
cp .env.example .env        # then edit MONGO_URI / JWT_SECRET as needed
npm run seed                # populates starter laundry services
npm run dev                 # starts the API on http://localhost:5000
```

### Frontend setup
```bash
cd frontend
npm install
cp .env.example .env        # REACT_APP_API_URL=http://localhost:5000/api
npm start                   # starts the app on http://localhost:3000
```

### Creating an admin account
Self-registration only allows the `customer` and `provider` roles (by design, so
anyone can't grant themselves admin access). To create an admin, register a normal
account, then update its role directly in MongoDB:

```js
// in the mongo shell or MongoDB Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## 5. API overview

| Method | Endpoint                    | Access            | Description                       |
|--------|------------------------------|--------------------|------------------------------------|
| POST   | /api/auth/register            | Public             | Register as customer/provider     |
| POST   | /api/auth/login                | Public             | Log in, returns JWT               |
| GET    | /api/auth/profile              | Logged in          | Current user profile              |
| GET    | /api/services                  | Public             | List active services              |
| POST   | /api/services                  | Admin              | Create service                    |
| PUT    | /api/services/:id               | Admin              | Update service                    |
| DELETE | /api/services/:id               | Admin              | Delete service                    |
| POST   | /api/orders                    | Customer           | Create a booking                  |
| GET    | /api/orders/mine                | Customer           | My bookings                       |
| GET    | /api/orders                    | Provider/Admin      | All orders (scoped for provider)  |
| GET    | /api/orders/:id                 | Owner/Provider/Admin| Order detail                      |
| PUT    | /api/orders/:id/status           | Provider/Admin      | Advance order status              |
| PUT    | /api/orders/:id/cancel           | Customer            | Cancel a booking                  |
| POST   | /api/payments/:orderId           | Customer            | Simulate a digital payment        |

---

## 6. Notes for the project report

- Passwords are hashed with bcrypt before storage; the API never returns password hashes.
- Order totals are recalculated server-side from the `Service` collection at booking
  time, so a customer can't tamper with prices from the client.
- The `Order.statusHistory` array gives a full audit trail of every status change,
  which is displayed to the customer as a timeline.
- Payment is simulated (no real payment gateway credentials are required to run
  or demo the project); swapping in Razorpay/Stripe would only require changing
  `paymentController.js` and the `Payment.jsx` form.
