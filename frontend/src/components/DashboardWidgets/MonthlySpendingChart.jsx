import React from "react";
import {  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import "./MonthlySpendingChart.css";

const MonthlySpendingChart = ({ transactions }) => {
    
  //In the case where transactions is not an array
  const dataArray = Array.isArray(transactions) ? transactions : [];

  const monthlySpending = dataArray.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
    const year = date.getFullYear();
    const key = `${month} ${year}`;

    if (!acc[key]) {
      acc[key] = 0;
    }

    acc[key] += transaction.amount;
    return acc;
  }, {});

  const chartData = Object.entries(monthlySpending).map(([month, amount]) => ({
    month,
    amount,
  }));

  //  format to be Ksh.
  const kshFormatter = (value) => `Ksh.${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <div className="monthly-chart-card">
      <h2 className="chart-title" >Monthly Spending</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E4053" />
            {/* ticklines helps remove the lines */}
            <XAxis dataKey="month" stroke="#ffffff" tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff" tickLine={false} axisLine={false} tickFormatter={kshFormatter} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1D1D29", border: "none", color: "#fff" }}
              formatter={(value) => [`Ksh.{value.toFixed(2)}`, 'Amount']} />
            <Legend wrapperStyle={{ color: "#ffffff" }} />
            <Bar dataKey="amount" fill="#A0A1FC" fillOpacity={0.8} radius={[4, 4, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
     </div>
    </div>
  );
};

export default MonthlySpendingChart;
