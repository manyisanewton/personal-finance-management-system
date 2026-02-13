import React, {useEffect, useState} from "react";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend, } from "recharts";
import "./CategorySpendingChart.css";


const CategorySpendingChart = ({ accountId }) => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const params = new URLSearchParams();
        if (accountId) {
            params.append('account_id', accountId);
        }
        fetch(`${API_URL}/api/category_spending_summary?${params.toString()}`, {
            credentials: "include",
          })
          
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch category spending data");
                }
                return response.json();
            })
            .then((data) => {
                setCategoryData(data);
            })
            .catch((error) => {
                console.error("Error fetching category data:", error);
            })
            .finally(() => setLoading(false));
    }, [API_URL, accountId]);

    // suitable data for the chart
    const chartData = categoryData
        .filter((category) => category.name && category.total_spent > 0)
        .map((category) => ({
            name: category.name,
            value: category.total_spent,
        }));

    // the color palette for the pie chart
    const COLORS = ["#A0A1FC", "#E668EA", "#6A6BFB", "#EFE84A", "#86E29B", "#FF94A"];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        return percent > 0.01 ? (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${chartData[index]?.name} (${(percent * 100).toFixed(0)}%)`}
            </text>
        ) : null;
    };

    const renderCenterText = () => {
        const totalExpenses = chartData.reduce((sum, entry) => sum + entry.value, 0);
        return (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{fontSize: '1.1rem', fill: 'white'}}>
                {`Ksh.${totalExpenses.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                })}`}
            </text>
        );
    };


    return (
        <div className="category-chart-card">
            <h2 className="chart-title">Categories</h2>
            {loading ? (
                <p className="loading-message">Loading ...</p>
            ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie 
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={60} // center hole
                            fill="#8884d8"
                            label={renderCustomizedLabel}
                            labelLine={false}
                            paddingAngle={1}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `Ksh.${value.toLocaleString()}`}/>
                        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{color: 'white'}}/>
                        
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="no-data-message">No Category Spending Available</p>
            )} 
        </div>
    );
};

export default CategorySpendingChart;
