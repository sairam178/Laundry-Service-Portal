import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const DashboardCharts = ({ orders }) => {

  // Revenue by Month
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const revenue = new Array(12).fill(0);

  orders.forEach(order=>{

    if(order.paymentStatus==="Paid"){

      const month=new Date(order.createdAt).getMonth();

      revenue[month]+=order.totalAmount;

    }

  });

  const revenueData=months.map((m,index)=>({

    month:m,

    revenue:revenue[index]

  }));

  // Order Status

  const statusMap={};

  orders.forEach(order=>{

    statusMap[order.status]=(statusMap[order.status]||0)+1;

  });

  const statusData=Object.keys(statusMap).map(status=>({

    name:status,

    value:statusMap[status]

  }));


  const COLORS=[
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6"
  ];

  return(

<div className="chart-grid">

<div className="chart-card">

<h3>Revenue Overview</h3>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={revenueData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="month"/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="revenue"
stroke="#2563eb"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

<div className="chart-card">

<h3>Orders by Status</h3>

<ResponsiveContainer width="100%" height={300}>

<PieChart>

<Pie

data={statusData}

dataKey="value"

nameKey="name"

outerRadius={100}

label

>

{

statusData.map((entry,index)=>(

<Cell

key={index}

fill={COLORS[index%COLORS.length]}

/>

))

}

</Pie>

<Legend/>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

</div>

  )

}

export default DashboardCharts;