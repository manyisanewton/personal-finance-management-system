import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianAxis, Tooltip, Legend,ResponsiveContainer } from "recharts";
import "./IncomeVsExpenseChart.css";

const IncomeVsExpenseChart = () => {
    const [balanceSummary, setBalanceSummary] = useState({ total_income: 0, total_expense: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect (() => {
        fetch("http://localhost:5001/api/balance_summary", {
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch balance summary');
                }
                return response.json();
            })
            .then((data) => {
                setBalanceSummary(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching balance summary:', error);
                setError(error);
                setLoading(false);
            });
    }, []);

    const data = [
        {name: 'Income', value: balanceSummary.total_income},
        {name: 'Expense', value: balanceSummary.total_expense * -1},
    ];

    const kshFormatter = (value) => `Ksh.${Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

    if (loading) {
        return (
            <div className="income-expense-chart-card">
                <h2 className="income-expense-title">Income vs Expense</h2>
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="income-expense-chart-card">
                <h2 className="income-expense-title">Income vs Expense</h2>
                <p className="error-text">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="income-expense-chart-card">
            <h2 className="income-expense-title">Income vs Expense</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <cartesianGrid strokeDasharray="3 3" stroke="#2E4053" />
                    <XAxis dataKey="name" stroke="#ffffff" tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff" tickLine={false} axisLine={false} tickFormatter={kshFormatter}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: "#1D1D29", border: "none", color: "#ffffff"}}
                        itemStyle={{ color: "#ffffff"}}
                        labelStyle={{color: "#A0A1FC"}}
                        formatter={(value) => `Ksh.&{Math.abs(value).toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{color: "#ffffff"}}/>
                    <Bar dataKey="value" name="Amount" fill="#43B430" barSize={30} />
                    <Bar dataKey="value" name="Amount" fill="E668EA" barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncomeVsExpenseChart;