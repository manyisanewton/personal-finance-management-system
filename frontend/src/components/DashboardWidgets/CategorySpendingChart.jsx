import React, {useEffect, useState} from "react";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend, } from "recharts";
import "./CategorySpendingChart.css";

// the color palette for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF6699", "#FF33CC", "#FF9933", "#FFCC33"];

const CategorySpendingChart = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5001/api/category_spending_summary", {
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
    }, []);

    // suitable data for the chart
    const chartData = categoryData
        .filter((category) => category.name && category.total_spent > 0)
        .map((category) => ({
            name: category.name,
            value: category.total_spent,
        }));

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
                            outerRadius={100}
                            fill="#8884d8"
                            label
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="no-data-message">No Category Spending Available</p>
            )} 
        </div>
    );
};

export default CategorySpendingChart;