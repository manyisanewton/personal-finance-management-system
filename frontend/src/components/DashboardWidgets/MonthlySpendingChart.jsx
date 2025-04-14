import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./MonthlySpendingChart.css";

const MonthlySpendingChart = ({ transactions }) => {
    
  // Fallback in case transactions is not an array
  const dataArray = Array.isArray(transactions) ? transactions : [];

  const monthlySpending = dataArray.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString("default", { month: "short" });
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

  return (
    <div className="monthly-chart-card">
      <h2 className="chart-title" >Monthly Spending</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E4053" />
            <XAxis dataKey="month" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip contentStyle={{ backgroundColor: "#1D1D29", border: "none", color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#ffffff" }} />
            <Bar dataKey="amount" fill="#43B430" radius={[6, 6, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
     </div>
    </div>
  );
};

export default MonthlySpendingChart;
