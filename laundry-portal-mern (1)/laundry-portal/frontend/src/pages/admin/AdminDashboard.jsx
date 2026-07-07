import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import "./Admin.css";

import {
  FaShoppingBasket,
  FaMoneyBillWave,
  FaTruck,
  FaCheckCircle,
  FaSearch,
  FaPlus,
} from "react-icons/fa";

import { motion } from "framer-motion";

const AdminDashboard = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search,setSearch]=useState("");

  useEffect(() => {

    api.get("/orders")
      .then(({data})=>setOrders(data))
      .catch(err=>setError(err.message))
      .finally(()=>setLoading(false));

  },[]);

  const filteredOrders = useMemo(()=>{

      return orders.filter(order=>{

          const customer=order.customer?.name || "";

          return customer.toLowerCase().includes(search.toLowerCase());

      });

  },[orders,search]);

  const stats={

      total:orders.length,

      revenue:orders
      .filter(o=>o.paymentStatus==="Paid")
      .reduce((sum,o)=>sum+o.totalAmount,0),

      active:orders.filter(
      o=>!["Delivered","Cancelled"].includes(o.status)
      ).length,

      delivered:orders.filter(
      o=>o.status==="Delivered"
      ).length

  }

  return (

<div className="admin-container">

<div className="dashboard-header">

<div>

<h1>Laundry Admin Dashboard</h1>

<p>Manage orders, customers and services</p>

</div>

<Link className="new-service-btn" to="/admin/services">

<FaPlus/>

Manage Services

</Link>

</div>

{/* Cards */}

<div className="stats-grid">

<motion.div
whileHover={{scale:1.05}}
className="stat-card">

<div>

<h2>{stats.total}</h2>

<p>Total Orders</p>

</div>

<div className="icon blue">

<FaShoppingBasket/>

</div>

</motion.div>

<motion.div
whileHover={{scale:1.05}}
className="stat-card">

<div>

<h2>{stats.active}</h2>

<p>Active Orders</p>

</div>

<div className="icon orange">

<FaTruck/>

</div>

</motion.div>

<motion.div
whileHover={{scale:1.05}}
className="stat-card">

<div>

<h2>{stats.delivered}</h2>

<p>Delivered</p>

</div>

<div className="icon green">

<FaCheckCircle/>

</div>

</motion.div>

<motion.div
whileHover={{scale:1.05}}
className="stat-card">

<div>

<h2>₹{stats.revenue}</h2>

<p>Revenue</p>

</div>

<div className="icon red">

<FaMoneyBillWave/>

</div>

</motion.div>

</div>

{/* Search */}

<div className="search-box">

<FaSearch/>

<input
type="text"
placeholder="Search customer..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* Orders */}

<div className="table-card">

<h2>Recent Orders</h2>

{loading && <p>Loading...</p>}

{error && <p>{error}</p>}

<table>

<thead>

<tr>

<th>Order</th>

<th>Customer</th>

<th>Amount</th>

<th>Status</th>

<th>Payment</th>

<th>Provider</th>

</tr>

</thead>

<tbody>

{

filteredOrders.map(order=>(

<tr key={order._id}>

<td>

#{order._id.slice(-6).toUpperCase()}

</td>

<td>

{order.customer?.name}

</td>

<td>

₹{order.totalAmount}

</td>

<td>

<StatusBadge status={order.status}/>

</td>

<td>

<span className={
order.paymentStatus==="Paid"
?
"paid"
:
"unpaid"
}>

{order.paymentStatus}

</span>

</td>

<td>

{order.assignedProvider?.name || "--"}

</td>

</tr>

))

}

</tbody>

</table>

</div>

</div>

  );

};

export default AdminDashboard;