import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import NotFound from './pages/NotFound';

import BookService from './pages/customer/BookService';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Payment from './pages/customer/Payment';

import ProviderDashboard from './pages/provider/ProviderDashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageServices from './pages/admin/ManageServices';

function App() {
  return (
    <>
      <Navbar />
      <main className="main-flex">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer */}
          <Route path="/book" element={<PrivateRoute roles={['customer']}><BookService /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute roles={['customer']}><MyOrders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/pay/:orderId" element={<PrivateRoute roles={['customer']}><Payment /></PrivateRoute>} />

          {/* Provider */}
          <Route path="/provider" element={<PrivateRoute roles={['provider']}><ProviderDashboard /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/services" element={<PrivateRoute roles={['admin']}><ManageServices /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
