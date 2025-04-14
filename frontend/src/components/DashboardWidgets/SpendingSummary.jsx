import React, { useEffect, useState } from "react";
import "./SpendingSummary.css";

const SpendingSummary = () => {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchSpendingSummary = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/spending_summary");
                const data = await response.json();
                setSummary(data);
            } catch (error) {
                console.error("Error fetching spending summary:", error);
            }
        };

        fetchSpendingSummary();

    }, []);

    if (!summary) return <div>Loading...</div>;

    return (
        <div className="spending-summary-card">
            <h2 className="spending-summary-title">Spending Summary</h2>
            <div className="spending-summary-content">
                <p><strong>Total Bidget: </strong> ${summary.total_budget.toFixed(2)}</p>
                <p><strong>Total Spent: </strong> ${summary.total_spent.toFixed(2)}</p>
                <p><strong>Remaining: </strong> ${summary.remaining.toFixed(2)}</p>
            </div>
        </div>
    )
} 

export default SpendingSummary;